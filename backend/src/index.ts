import 'dotenv/config';
import './types/index'; // Load Express type augmentations
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/applications.routes';
import contactRoutes from './routes/contacts.routes';
import statsRoutes from './routes/stats.routes';

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
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(Number(env.PORT), () => {
  console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
