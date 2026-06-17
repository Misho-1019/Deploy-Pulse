import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitor.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './scheduler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);

app.use(errorHandler);

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
