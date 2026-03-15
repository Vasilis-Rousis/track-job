import 'dotenv/config';
import './types/index'; // Load Express type augmentations
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/applications.routes';
import contactRoutes from './routes/contacts.routes';
import statsRoutes from './routes/stats.routes';
import gmailRoutes from './routes/gmail.routes';
import emailRoutes from './routes/email.routes';
import adminRoutes from './routes/admin.routes';
import { startEmailWorker } from './workers/emailWorker';

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production' ? env.FRONTEND_URL : true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
app.use('/api', globalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const server = app.listen(Number(env.PORT), () => {
  console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

const worker = startEmailWorker();

process.on('SIGTERM', async () => {
  await worker.close();
  server.close(() => process.exit(0));
});

export default app;
