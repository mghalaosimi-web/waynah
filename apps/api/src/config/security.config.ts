/**
 * WAYNAH API Security Configuration
 *
 * Provides central, type-safe security settings for API key authorization,
 * CORS origins, rate limiting, and environment separation.
 */

const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

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
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_DEV_CORS_ORIGINS,

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
