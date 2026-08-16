import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDatabase } from './server/db.js';
import { seedInitialMandalData } from './server/auth.js';

import authRoutes from './server/routes/authRoutes.js';
import pavtiRoutes from './server/routes/pavtiRoutes.js';
import expenseRoutes from './server/routes/expenseRoutes.js';
import dbStatusRoutes from './server/routes/dbStatusRoutes.js';
import auditRoutes from './server/routes/auditRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Connect Database (MongoDB or persistent fallback) and Seed Default Accounts
  await connectDatabase();
  await seedInitialMandalData();

  // API Routes First
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'राजमुद्रा गणपती मंडळ पावती प्रणाली (Rajmudra Ganpati Mandal Pavti System)',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/pavti', pavtiRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/db', dbStatusRoutes);
  app.use('/api/audit', auditRoutes);

  // Vite middleware for development & Static Serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Rajmudra Ganpati Mandal backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});
