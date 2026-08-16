import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel, resetMandalData } from '../models.js';
import { generateToken, authenticateToken, requireAdmin, AuthRequest } from '../auth.js';
import { recordAudit } from '../audit.js';
import { MANDAL_CONFIG } from '../../shared/mandalConfig.js';

const router = Router();

function getDeviceInfo(req: Request) {
  const ua = req.headers['user-agent'] || 'Unknown Device';
  let device = 'Desktop Browser';
  if (/mobile/i.test(ua)) device = 'Mobile Browser';
  if (/android/i.test(ua)) device = 'Android Device';
  if (/iphone|ipad|ipod/i.test(ua)) device = 'iOS Device';
  if (/windows/i.test(ua)) device = 'Windows PC';
  if (/macintosh/i.test(ua)) device = 'MacBook / Mac';
  if (/linux/i.test(ua)) device = 'Linux PC';
  return `${device} (${new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })})`;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'मोबाईल नंबर आणि पासवर्ड दोन्ही आवश्यक आहेत (Phone & password required).' });
    }

    const cleanPhone = phone.toString().trim();
    const user = await UserModel.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(401).json({ error: 'या मोबाईल नंबरचे खाते सापडले नाही (Account not found with this phone number).' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'हे खाते निष्क्रिय (Deactivated) केले आहे. कृपया अध्यक्षांशी संपर्क साधा.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'चुकीचा पासवर्ड (Incorrect password. Please try again).' });
    }

    // Generate unique sessionId for this specific device/login
    const newSessionId = 'sess_' + crypto.randomUUID();
    const deviceInfo = getDeviceInfo(req);
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const loginTime = new Date().toISOString();

    const previousSessionExisted = Boolean(user.activeSessionId);
    const previousDevice = user.lastLoginDevice || 'Another device';

    // Update the user's active session in MongoDB/Store
    // This immediately invalidates any other active device logged into this account
    await UserModel.updateOne(
      { _id: user._id?.toString() || user.id },
      {
        $set: {
          activeSessionId: newSessionId,
          lastLoginAt: loginTime,
          lastLoginDevice: deviceInfo,
          lastLoginIp: typeof ip === 'string' ? ip : ip[0],
        }
      }
    );

    const token = generateToken({
      id: user._id?.toString() || user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      sessionId: newSessionId,
    });

    await recordAudit({
      action: 'LOGIN',
      entityType: 'auth',
      entityId: user._id?.toString() || user.id,
      description: `${user.name} logged in successfully.`,
      req,
      actor: {
        userId: user._id?.toString() || user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      metadata: { device: deviceInfo, previousSessionTerminated: previousSessionExisted },
    });

    return res.json({
      message: 'यशस्वी लॉगिन (Login successful)',
      token,
      previousSessionTerminated: previousSessionExisted,
      previousDevice,
      user: {
        id: user._id?.toString() || user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        sessionId: newSessionId,
        lastLoginAt: loginTime,
        lastLoginDevice: deviceInfo,
        canUpdateReceiptStatus: Boolean(user.canUpdateReceiptStatus),
        canManageExpenses: Boolean(user.canManageExpenses),
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login server error: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await recordAudit({
        action: 'LOGOUT',
        entityType: 'auth',
        entityId: req.user.id,
        description: `${req.user.name} logged out.`,
        req,
      });
      await UserModel.updateOne(
        { _id: req.user.id },
        { $set: { activeSessionId: null } }
      );
    }
    return res.json({ message: 'यशस्वीरित्या लॉगआउट झाले (Logged out successfully)' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Logout error: ' + err.message });
  }
});

// GET /api/auth/verify-session
// Heartbeat to check if session is still alive or kicked out by another device
router.get('/verify-session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    return res.json({
      valid: true,
      user: {
        id: user._id?.toString() || user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        lastLoginDevice: user.lastLoginDevice,
      sessionId: req.user!.sessionId,
      canUpdateReceiptStatus: Boolean(user.canUpdateReceiptStatus),
      canManageExpenses: Boolean(user.canManageExpenses),
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      id: user._id?.toString() || user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      lastLoginDevice: user.lastLoginDevice,
      createdAt: user.createdAt,
      canUpdateReceiptStatus: Boolean(user.canUpdateReceiptStatus),
      canManageExpenses: Boolean(user.canManageExpenses),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users (Admin only: list all karyakartas)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserModel.find({});
    const sanitized = users.map((u: any) => ({
      id: u._id?.toString() || u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      lastLoginDevice: u.lastLoginDevice,
      hasActiveSession: Boolean(u.activeSessionId),
      canUpdateReceiptStatus: Boolean(u.canUpdateReceiptStatus),
      canManageExpenses: Boolean(u.canManageExpenses),
      createdAt: u.createdAt,
    }));
    return res.json(sanitized);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/create-user (Admin only: create new karyakarta)
router.post('/create-user', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, password, role, canUpdateReceiptStatus, canManageExpenses } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'नाव, फोन आणि पासवर्ड आवश्यक आहेत.' });
    }

    const cleanPhone = phone.toString().trim();
    const existing = await UserModel.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ error: 'या मोबाईल नंबरचा कार्यकर्ता आधीच नोंदणीकृत आहे.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      name: name.trim(),
      phone: cleanPhone,
      role: role === 'admin' ? 'admin' : 'user',
      passwordHash,
      activeSessionId: null,
      canUpdateReceiptStatus: role === 'admin' || Boolean(canUpdateReceiptStatus),
      canManageExpenses: role === 'admin' || Boolean(canManageExpenses),
    });

    await recordAudit({
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: newUser._id?.toString() || newUser.id,
      description: `${req.user!.name} created user ${newUser.name}.`,
      req,
      metadata: { targetName: newUser.name, targetPhone: newUser.phone, targetRole: newUser.role },
    });

    return res.status(201).json({
      message: 'नवीन कार्यकर्ता खाते तयार झाले.',
      user: {
        id: newUser._id?.toString() || newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const target = await UserModel.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    const primaryAdminPhone = process.env.INITIAL_ADMIN_PHONE?.trim() || MANDAL_CONFIG.primaryAdmin.phone;
    const isPrimary = target.phone === primaryAdminPhone;
    const { name, role, isActive, canUpdateReceiptStatus, canManageExpenses, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Member name is required.' });
    if (password?.trim() && password.trim().length < 6) return res.status(400).json({ error: 'Password must contain at least 6 characters.' });
    if (isPrimary && (role !== 'admin' || isActive === false)) return res.status(400).json({ error: 'The primary admin cannot be deactivated or demoted.' });
    if ((target._id?.toString() || target.id) === req.user!.id && (role !== 'admin' || isActive === false)) return res.status(400).json({ error: 'You cannot deactivate or demote your current admin account.' });

    const safeRole = role === 'admin' ? 'admin' : 'user';
    const updates: Record<string, unknown> = {
      name: name.trim(),
      role: safeRole,
      isActive: isPrimary ? true : Boolean(isActive),
      canUpdateReceiptStatus: safeRole === 'admin' || Boolean(canUpdateReceiptStatus),
      canManageExpenses: safeRole === 'admin' || Boolean(canManageExpenses),
    };
    if (password?.trim()) updates.passwordHash = await bcrypt.hash(password.trim(), 10);
    if (!updates.isActive) updates.activeSessionId = null;
    await UserModel.updateOne({ _id: req.params.id }, { $set: updates });
    await recordAudit({ action: 'USER_UPDATED', entityType: 'user', entityId: req.params.id, description: `${req.user!.name} updated member ${target.name}.`, req, metadata: { targetName: name.trim(), role: safeRole, isActive: updates.isActive, canUpdateReceiptStatus: updates.canUpdateReceiptStatus, canManageExpenses: updates.canManageExpenses } });
    return res.json({ message: 'Member updated successfully.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const target = await UserModel.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    const primaryAdminPhone = process.env.INITIAL_ADMIN_PHONE?.trim() || MANDAL_CONFIG.primaryAdmin.phone;
    if (target.phone === primaryAdminPhone || req.params.id === req.user!.id) return res.status(400).json({ error: 'The primary/current admin account cannot be deleted.' });
    await UserModel.deleteOne({ _id: req.params.id });
    await recordAudit({ action: 'USER_DELETED', entityType: 'user', entityId: req.params.id, description: `${req.user!.name} deleted member ${target.name}.`, req, metadata: { targetName: target.name, targetPhone: target.phone, targetRole: target.role } });
    return res.json({ message: 'Member deleted successfully.' });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// POST /api/auth/force-logout-user (Admin can force logout any karyakarta)
router.post('/force-logout-user', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const targetUser = await UserModel.findById(userId);

    await UserModel.updateOne(
      { _id: userId },
      { $set: { activeSessionId: null } }
    );

    await recordAudit({
      action: 'USER_FORCE_LOGOUT',
      entityType: 'user',
      entityId: userId,
      description: `${req.user!.name} terminated ${targetUser?.name || 'a user'}'s active session.`,
      req,
      metadata: { targetName: targetUser?.name || '', targetPhone: targetUser?.phone || '' },
    });

    return res.json({ message: 'User session terminated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/reset-mandal-data', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const primaryAdminPhone = process.env.INITIAL_ADMIN_PHONE?.trim() || MANDAL_CONFIG.primaryAdmin.phone;
    if (req.user!.phone !== primaryAdminPhone) {
      return res.status(403).json({ error: 'Only the primary Mandal administrator can reset all data.' });
    }

    const { password, confirmation } = req.body;
    if (confirmation !== 'DELETE RAJMUDRA DATA') {
      return res.status(400).json({ error: 'The reset confirmation phrase is incorrect.' });
    }
    const admin = await UserModel.findById(req.user!.id);
    if (!admin || !password || !(await bcrypt.compare(String(password), admin.passwordHash))) {
      return res.status(401).json({ error: 'Administrator password is incorrect.' });
    }

    const deleted = await resetMandalData(req.user!.id);
    await recordAudit({
      action: 'MANDAL_DATA_RESET',
      entityType: 'auth',
      entityId: req.user!.id,
      description: `${req.user!.name} reset Mandal financial data and member accounts.`,
      req,
      metadata: deleted,
    });
    return res.json({ message: 'Mandal data was reset successfully. The primary admin account was preserved.', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
