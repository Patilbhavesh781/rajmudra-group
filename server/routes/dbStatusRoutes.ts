import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { dbStatus, memoryStore } from '../db.js';
import { MongoUserModel, MongoPavtiModel, MongoExpenseModel, MongoAuditLogModel } from '../models.js';

const router = Router();

router.get('/status', async (req: Request, res: Response) => {
  try {
    const mongoReady = mongoose.connection.readyState === 1;
    let userCount = 0;
    let pavtiCount = 0;
    let expenseCount = 0;
    let auditLogCount = 0;

    if (mongoReady) {
      userCount = await MongoUserModel.countDocuments();
      pavtiCount = await MongoPavtiModel.countDocuments();
      expenseCount = await MongoExpenseModel.countDocuments();
      auditLogCount = await MongoAuditLogModel.countDocuments();
    } else {
      userCount = memoryStore.users.length;
      pavtiCount = memoryStore.pavtis.length;
      expenseCount = memoryStore.expenses.length;
      auditLogCount = memoryStore.auditLogs.length;
    }

    const envUriConfigured = Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>'));

    return res.json({
      connected: mongoReady || dbStatus.connected,
      engine: mongoReady ? 'MongoDB (Cloud / Local Replica)' : 'MongoDB-Compatible Persistent Local Store',
      type: mongoReady ? 'mongodb' : 'local_fallback',
      dbName: mongoReady ? (mongoose.connection.name || 'mandal_db') : dbStatus.dbName,
      uriConfigured: envUriConfigured,
      collections: {
        users: userCount,
        pavtis: pavtiCount,
        expenses: expenseCount,
        auditLogs: auditLogCount,
      },
      error: dbStatus.error || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
