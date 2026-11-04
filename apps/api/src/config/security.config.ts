/**
 * WAYNAH API Security Configuration
 *
 * Provides central, type-safe security settings for API key authorization,
 * CORS origins, rate limiting, and environment separation.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const DEFAULT_CORS_ORIGINS = IS_PRODUCTION
  ? ['https://waynah.vercel.app']
  : [
      'https://waynah.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

const CONFIGURED_CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter((origin) => Boolean(origin) && !(IS_PRODUCTION && origin === '*'));

const CORS_ORIGINS = Array.from(
  new Set([...DEFAULT_CORS_ORIGINS, ...CONFIGURED_CORS_ORIGINS])
);

export const securityConfig = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Ingestion API Key (Secret configuration)
  ingestionApiKey:
    process.env.INGESTION_API_KEY ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'dev-ingestion-key-do-not-use-in-prod'),

  // CORS configuration
  corsOrigins: CORS_ORIGINS,

  // Rate Limiting defaults (In-Memory)
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
    maxRequestsProtected: Number(process.env.RATE_LIMIT_MAX_PROTECTED) || 60,
    maxRequestsPublic: Number(process.env.RATE_LIMIT_MAX_PUBLIC) || 300,
  },

  // Account Token Lifetimes
  accountTokens: {
    emailVerificationExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
    passwordResetExpiryMs: 60 * 60 * 1000, // 1 hour
  },
};
