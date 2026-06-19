import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitor.js';
import userRoutes from './routes/user.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhooks.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './scheduler.js';
import './workers/checkWorker.js';

const app = express();

// Webhook route needs raw body — mount before JSON parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: "1mb" }));

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/billing', billingRoutes);

app.use(errorHandler);

app.set("timeout", 30_000);

app.listen(env.PORT, () => {
  console.log(`DeployPulse API running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  try {
    startScheduler();
    console.log('[Scheduler] Started');
  } catch (err) {
    console.error('[Scheduler] Failed to start:', err);
  }
});
