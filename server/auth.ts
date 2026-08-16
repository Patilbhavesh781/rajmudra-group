import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from './models.js';
import crypto from 'crypto';
import { MANDAL_CONFIG } from '../shared/mandalConfig.js';

function getJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured in production.');
  return 'rajmudra_local_development_only_secret_2026';
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: 'admin' | 'user';
    name: string;
    sessionId: string;
    canUpdateReceiptStatus: boolean;
    canManageExpenses: boolean;
  };
}

export function generateToken(payload: { id: string; phone: string; role: 'admin' | 'user'; name: string; sessionId: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated by Admin.' });
    }

    // SINGLE-DEVICE LOGIN SECURITY CHECK:
    // If the activeSessionId in database has changed, this previous device/session has been invalidated!
    if (user.activeSessionId && user.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        code: 'SESSION_TERMINATED_BY_NEW_LOGIN',
        error: 'Your account was logged in on another device. You have been automatically logged out for security.',
        lastLoginDevice: user.lastLoginDevice,
        lastLoginAt: user.lastLoginAt,
      });
    }

    req.user = {
      id: user._id?.toString() || user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      sessionId: decoded.sessionId,
      canUpdateReceiptStatus: Boolean(user.canUpdateReceiptStatus),
      canManageExpenses: Boolean(user.canManageExpenses),
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}

export async function seedInitialMandalData() {
  try {
    const count = await UserModel.countDocuments();
    if (count === 0) {
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();
      const initialAdminPhone = process.env.INITIAL_ADMIN_PHONE?.trim() || MANDAL_CONFIG.primaryAdmin.phone;
      if (!initialAdminPassword) {
        throw new Error('INITIAL_ADMIN_PASSWORD must be set in .env before the first startup.');
      }

      console.log(`[Seed] Creating the initial ${MANDAL_CONFIG.name.en} admin account...`);
      const adminPasswordHash = await bcrypt.hash(initialAdminPassword, 10);

      await UserModel.create({
        name: MANDAL_CONFIG.primaryAdmin.name,
        phone: initialAdminPhone,
        role: 'admin',
        passwordHash: adminPasswordHash,
        activeSessionId: null,
        canUpdateReceiptStatus: true,
        canManageExpenses: true,
      });
      console.log('[Seed] Initial admin account created. Database is ready for fresh Mandal data.');
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
}
