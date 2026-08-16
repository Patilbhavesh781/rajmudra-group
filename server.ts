import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDatabase } from './server/db.js';
import { seedInitialMandalData } from './server/auth.js';

import { MANDAL_CONFIG } from './shared/mandalConfig.js';
import { createApiApp } from './server/app.js';

dotenv.config();

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Connect Database (MongoDB or persistent fallback) and Seed Default Accounts
  await connectDatabase();
  await seedInitialMandalData();

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
    console.log(`[Server] ${MANDAL_CONFIG.name.en} backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});
