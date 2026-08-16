import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth.js';
import { AuditLogModel } from '../models.js';

const router = Router();

router.get('/list', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
    const filter: Record<string, string> = {};

    if (typeof req.query.action === 'string' && req.query.action !== 'all') filter.action = req.query.action;
    if (typeof req.query.entityType === 'string' && req.query.entityType !== 'all') filter.entityType = req.query.entityType;
    if (typeof req.query.userId === 'string' && req.query.userId) filter['actor.userId'] = req.query.userId;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter, { skip: (page - 1) * limit, limit }),
      AuditLogModel.countDocuments(filter),
    ]);

    return res.json({ logs, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to load audit logs.' });
  }
});

export default router;
