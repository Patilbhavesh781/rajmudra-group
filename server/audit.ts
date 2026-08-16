import { Request } from 'express';
import { AuditAction, AuditLogModel } from './models.js';
import { AuthRequest } from './auth.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'authorization',
  'jwt',
  'secret',
  'activeSessionId',
  'sessionId',
]);

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEYS.has(key))
      .map(([key, nestedValue]) => [key, sanitizeMetadata(nestedValue)])
  );
}

function getRequestIp(req?: Request) {
  if (!req) return '';
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0] || '';
  return req.ip || '';
}

interface AuditEvent {
  action: AuditAction;
  entityType: 'auth' | 'user' | 'pavti' | 'expense';
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  req?: AuthRequest | Request;
  actor?: {
    userId: string;
    name: string;
    phone: string;
    role: 'admin' | 'user' | 'system';
  };
}

export async function recordAudit(event: AuditEvent) {
  try {
    const authenticatedUser = (event.req as AuthRequest | undefined)?.user;
    await AuditLogModel.create({
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId || '',
      description: event.description,
      actor: event.actor || (authenticatedUser ? {
        userId: authenticatedUser.id,
        name: authenticatedUser.name,
        phone: authenticatedUser.phone,
        role: authenticatedUser.role,
      } : {
        userId: '',
        name: 'System',
        phone: '',
        role: 'system',
      }),
      metadata: sanitizeMetadata(event.metadata || {}),
      ipAddress: getRequestIp(event.req),
      userAgent: event.req?.headers['user-agent'] || '',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Business operations must not fail solely because audit storage is unavailable.
    console.error('[Audit] Failed to record event:', error);
  }
}
