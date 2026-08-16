import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from './models.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'rajmudra_ganpati_mandal_secure_jwt_secret_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: 'admin' | 'user';
    name: string;
    sessionId: string;
  };
}

export function generateToken(payload: { id: string; phone: string; role: 'admin' | 'user'; name: string; sessionId: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
      if (!initialAdminPassword) {
        throw new Error('INITIAL_ADMIN_PASSWORD must be set in .env before the first startup.');
      }

      console.log('[Seed] Creating the initial Rajmudra Ganpati Mandal admin account...');
      const adminPasswordHash = await bcrypt.hash(initialAdminPassword, 10);

      await UserModel.create({
        name: 'Sangharsh Patil',
        phone: '7057606126',
        role: 'admin',
        passwordHash: adminPasswordHash,
        activeSessionId: null,
      });
      console.log('[Seed] Initial admin account created. Database is ready for fresh Mandal data.');
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
}
