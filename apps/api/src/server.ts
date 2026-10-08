import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { prisma, verifySpatialConnection } from '@waynah/database';
import { securityConfig } from './config/security.config.js';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware.js';
import { requestLoggerMiddleware } from './middleware/logging.middleware.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { createSearchRouter } from './routes/v1/search.routes.js';
import { createDiscoveryRouter } from './routes/v1/discovery.routes.js';
import { createAdminRouter } from './routes/v1/admin.routes.js';
import { createAuthRouter } from './routes/v1/auth.routes.js';
import { createUserRouter } from './routes/v1/user.routes.js';
import { createBusinessRouter } from './routes/v1/business.routes.js';
import { createGeographyRouter } from './routes/v1/geography.routes.js';
import { createTransactionRouter } from './routes/v1/transaction.routes.js';
import { createFulfillmentRouter } from './routes/v1/fulfillment.routes.js';
import { createTrustRouter } from './routes/v1/trust.routes.js';
import { createReviewRouter } from './routes/v1/review.routes.js';
import { createObservationRouter } from './routes/v1/observation.routes.js';
import { createNotificationRouter } from './routes/v1/notification.routes.js';
import { AuditLogger } from './utils/audit-logger.js';
import { ApiResponse } from './utils/api-response.js';

export function createServer(prismaClient = prisma) {
  AuditLogger.setPrismaClient(prismaClient);
  const app = new Hono();

  // Middleware 1: Enable CORS with controlled dev/prod origins (MUST be registered first to handle preflight OPTIONS immediately)
  app.use(
    '*',
    cors({
      origin: (origin) => {
        // Allow server-to-server or non-browser requests (no origin header)
        if (!origin) return securityConfig.corsOrigins[0] || '*';

        if (
          securityConfig.corsOrigins.includes('*') ||
          securityConfig.corsOrigins.includes(origin)
        ) {
          return origin;
        }

        return null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400,
    })
  );

  // Middleware 2: Security Headers, Request Logger & Authentication
  app.use('*', securityHeadersMiddleware);
  app.use('*', requestLoggerMiddleware);
  app.use('*', createAuthMiddleware(prismaClient));

  // Health Check Endpoint (Public API)
  app.get('/health', async (c) => {
    try {
      const spatialHealth = await verifySpatialConnection();
      return c.json(
        ApiResponse.success({
          status: 'ok',
          database: spatialHealth,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Healthcheck database error:', error);
      return c.json(
        ApiResponse.error('Database connection failed', 'DATABASE_CONNECTION_ERROR'),
        500
      );
    }
  });

  // Mount API v1 Routers (Public & Protected Routes)
  app.route('/v1/auth', createAuthRouter(prismaClient));
  app.route('/v1/user', createUserRouter(prismaClient));
  app.route('/v1/businesses', createBusinessRouter(prismaClient));
  app.route('/v1/search', createSearchRouter(prismaClient));
  app.route('/v1/discovery', createDiscoveryRouter(prismaClient));
  app.route('/v1/admin', createAdminRouter(prismaClient));
  app.route('/v1/geography', createGeographyRouter(prismaClient));
  app.route('/v1/transactions', createTransactionRouter(prismaClient));
  app.route('/v1/fulfillment', createFulfillmentRouter(prismaClient));
  app.route('/v1/trust', createTrustRouter(prismaClient));
  app.route('/v1/reviews', createReviewRouter(prismaClient));
  app.route('/v1/observations', createObservationRouter(prismaClient));
  app.route('/v1/notifications', createNotificationRouter(prismaClient));



  // Global 404 Handler
  app.notFound((c) => {
    return c.json(
      ApiResponse.error('Route not found', 'NOT_FOUND'),
      404
    );
  });

  // Global Error Handler
  app.onError((err, c) => {
    console.error('Unhandled API Error:', err);

    if (err.name === 'GeographicContextMismatchError' || (err as any).code === 'GEOGRAPHIC_CONTEXT_MISMATCH') {
      return c.json(
        ApiResponse.error(err.message || 'The supplied district does not match the place coordinates.', 'GEOGRAPHIC_CONTEXT_MISMATCH'),
        400
      );
    }

    if ('status' in err && typeof err.status === 'number') {
      const statusCode = err.status as number;
      return c.json(
        ApiResponse.error(err.message || 'HTTP Error', 'HTTP_ERROR'),
        statusCode as any
      );
    }

    // Do NOT leak stack traces or internal errors to caller
    return c.json(
      ApiResponse.error('An internal server error occurred', 'INTERNAL_SERVER_ERROR'),
      500
    );
  });

  return app;
}

export const app = createServer(prisma);

const PORT = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  console.log(`Starting WAYNAH API Server on port ${PORT}...`);
  const server = serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    (info) => {
      console.log(`🚀 API Server running on http://localhost:${info.port}`);
    }
  );

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\nReceived ${signal}. Gracefully shutting down WAYNAH API Server...`);

    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('Database client disconnected cleanly.');
      } catch (err) {
        console.error('Error disconnecting database:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default handle(app);
