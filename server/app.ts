import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import pavtiRoutes from './routes/pavtiRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import dbStatusRoutes from './routes/dbStatusRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { MANDAL_CONFIG } from '../shared/mandalConfig.js';

export function createApiApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: `${MANDAL_CONFIG.name.mr} पावती प्रणाली (${MANDAL_CONFIG.name.en} Pavti System)`, timestamp: new Date().toISOString() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/pavti', pavtiRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/db', dbStatusRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/reports', reportRoutes);
  return app;
}
