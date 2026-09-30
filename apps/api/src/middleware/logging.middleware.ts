import type { MiddlewareHandler } from 'hono';

/**
 * Request Access Logger Middleware
 *
 * Logs essential HTTP metadata (method, path, status, duration) for incoming requests
 * without logging sensitive payloads, headers, or tokens.
 */
export const requestLoggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const durationMs = Date.now() - start;
  const status = c.res.status;

  // Format log entry concisely
  const logLine = `[HTTP] ${method} ${path} ${status} - ${durationMs}ms`;

  if (status >= 500) {
    console.error(logLine);
  } else if (status >= 400) {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
};
