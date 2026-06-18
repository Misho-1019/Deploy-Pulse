import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'change-me-to-a-random-string') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      return 'dev-secret';
    }
    return secret;
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
  },
  ALERT_FROM_EMAIL: process.env.ALERT_FROM_EMAIL || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_STARTER_ID: process.env.STRIPE_PRICE_STARTER_ID || '',
  STRIPE_PRICE_PRO_ID: process.env.STRIPE_PRICE_PRO_ID || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
