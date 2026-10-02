import { describe, it, expect } from 'vitest';
import {
  ApiResponseBuilder,
  ErrorCodes,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  PaginationQuerySchema,
} from '../src/index.js';

describe('Phase 1 Foundation Core & Architecture Utilities (@waynah/shared)', () => {
  describe('ApiResponseBuilder', () => {
    it('builds standard success response envelope', () => {
      const response = ApiResponseBuilder.success({ id: '123', name: 'Test Place' });
      expect(response).toEqual({
        success: true,
        data: { id: '123', name: 'Test Place' },
      });
    });

    it('builds standard success response envelope with meta', () => {
      const response = ApiResponseBuilder.success({ id: '123' }, { requestId: 'req-456' });
      expect(response).toEqual({
        success: true,
        data: { id: '123' },
        meta: { requestId: 'req-456' },
      });
    });

    it('builds standard paginated response envelope', () => {
      const meta = {
        page: 1,
        limit: 10,
        totalItems: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      };
      const response = ApiResponseBuilder.paginated([{ id: '1' }, { id: '2' }], meta);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.meta).toEqual(meta);
    });

    it('builds standard error response envelope', () => {
      const response = ApiResponseBuilder.error('Invalid credential', ErrorCodes.UNAUTHORIZED, { field: 'password' });
      expect(response).toEqual({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Invalid credential',
          details: { field: 'password' },
        },
      });
    });

    it('does not expose internal details through an internal error response', () => {
      const response = ApiResponseBuilder.error(
        'database password: secret-value',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        { password: 'secret-value', stack: 'private-stack' }
      );

      expect(response).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
        },
      });
      expect(JSON.stringify(response)).not.toContain('secret-value');
      expect(JSON.stringify(response)).not.toContain('private-stack');
    });
  });

  describe('Foundation Error Classes', () => {
    it('creates ValidationError with 400 status', () => {
      const err = new ValidationError('Bad email format', { field: 'email' });
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(err.details).toEqual({ field: 'email' });
    });

    it('creates AuthenticationError with 401 status', () => {
      const err = new AuthenticationError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('creates AuthorizationError with 403 status', () => {
      const err = new AuthorizationError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe(ErrorCodes.FORBIDDEN);
    });

    it('creates NotFoundError with 404 status', () => {
      const err = new NotFoundError('Place not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('creates ConflictError with 409 status', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe(ErrorCodes.CONFLICT);
    });

    it('creates RateLimitError with 429 status', () => {
      const err = new RateLimitError();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
    });

    it('creates InternalServerError with 500 status', () => {
      const err = new InternalServerError('database password: secret-value', {
        password: 'secret-value',
        stack: 'private-stack',
        cause: new Error('private exception object'),
      });
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
      expect(err.isOperational).toBe(false);
      expect(err.details).toMatchObject({ password: 'secret-value' });

      const clientResponse = err.toClientResponse();
      expect(clientResponse).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
        },
      });

      const serialized = JSON.stringify(err);
      expect(serialized).toBe(JSON.stringify(clientResponse));
      expect(serialized).not.toContain('secret-value');
      expect(serialized).not.toContain('private-stack');
      expect(serialized).not.toContain('private exception object');
    });

    it('serializes public operational errors with their expected details', () => {
      const err = new ValidationError('Bad email format', { field: 'email' });

      expect(err.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Bad email format',
          details: { field: 'email' },
        },
      });
    });
  });

  describe('Security Remediation F-02 & F-06 Direct Bypass Prevention', () => {
    const createInternalErrorWithSecrets = () =>
      new InternalServerError('Database failure with secret-password', {
        password: 'secret-password-123',
        token: 'bearer-secret-token-xyz',
        secret: 'super-secret-key',
        stack: 'Error: Database connection lost\n  at dbConnect (/app/db.ts:42)',
        database: 'postgres://user:secret-password-123@db.internal:5432/waynah',
        nestedInternalMessage: 'private exception object detail',
      });

    it('Test A: JSON.stringify({...internalServerError}) must not expose sensitive diagnostic data', () => {
      const err = createInternalErrorWithSecrets();
      const spreadObject = { ...err };
      const serialized = JSON.stringify(spreadObject);

      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('secret-password-123');
      expect(serialized).not.toContain('bearer-secret-token-xyz');
      expect(serialized).not.toContain('super-secret-key');
      expect(serialized).not.toContain('dbConnect');
      expect(serialized).not.toContain('postgres://');
      expect(serialized).not.toContain('private exception object detail');
    });

    it('Test B: JSON.stringify(Object.assign({}, internalServerError)) must not expose internal diagnostic data', () => {
      const err = createInternalErrorWithSecrets();
      const assignedObject = Object.assign({}, err);
      const serialized = JSON.stringify(assignedObject);

      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('secret-password-123');
      expect(serialized).not.toContain('bearer-secret-token-xyz');
      expect(serialized).not.toContain('super-secret-key');
      expect(serialized).not.toContain('dbConnect');
      expect(serialized).not.toContain('postgres://');
      expect(serialized).not.toContain('private exception object detail');
    });

    it('Test C: Object.keys(internalServerError) must not expose the internal diagnostic property (details)', () => {
      const err = createInternalErrorWithSecrets();
      const keys = Object.keys(err);

      expect(keys).not.toContain('details');
    });

    it('Test D: JSON.stringify(internalServerError) must remain client-safe', () => {
      const err = createInternalErrorWithSecrets();
      const serialized = JSON.stringify(err);

      expect(JSON.parse(serialized)).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
        },
      });
      expect(serialized).not.toContain('secret-password-123');
    });

    it('Test E: internalServerError.toClientResponse() must remain client-safe', () => {
      const err = createInternalErrorWithSecrets();
      const response = err.toClientResponse();

      expect(response).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
        },
      });
      expect(JSON.stringify(response)).not.toContain('secret-password-123');
    });

    it('Test F: ApiResponseBuilder.error(...) for INTERNAL_SERVER_ERROR and INTERNAL_ERROR must remain client-safe', () => {
      const resp1 = ApiResponseBuilder.error(
        'Internal failure message',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        { password: 'secret-password-123', stack: 'private-stack' }
      );

      const resp2 = ApiResponseBuilder.error(
        'Internal failure message',
        'INTERNAL_ERROR',
        { token: 'bearer-secret-token-xyz' }
      );

      expect(resp1).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
        },
      });
      expect(resp2).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred',
        },
      });

      expect(JSON.stringify(resp1)).not.toContain('secret-password-123');
      expect(JSON.stringify(resp2)).not.toContain('bearer-secret-token-xyz');
    });

    it('Public Error Regression: preserves operational details for public errors', () => {
      const valErr = new ValidationError('Bad field', { field: 'email' });
      const authErr = new AuthenticationError('Invalid token', { reason: 'expired' });
      const authzErr = new AuthorizationError('Access denied', { role: 'guest' });
      const nfErr = new NotFoundError('User not found', { id: 'usr-123' });
      const conflictErr = new ConflictError('Email in use', { email: 'a@b.com' });
      const rlErr = new RateLimitError('Rate limit exceeded', { retryAfter: 60 });

      expect(valErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Bad field',
          details: { field: 'email' },
        },
      });
      expect(authErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Invalid token',
          details: { reason: 'expired' },
        },
      });
      expect(authzErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Access denied',
          details: { role: 'guest' },
        },
      });
      expect(nfErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found',
          details: { id: 'usr-123' },
        },
      });
      expect(conflictErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.CONFLICT,
          message: 'Email in use',
          details: { email: 'a@b.com' },
        },
      });
      expect(rlErr.toClientResponse()).toEqual({
        success: false,
        error: {
          code: ErrorCodes.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          details: { retryAfter: 60 },
        },
      });
    });

    it('Stack Safety: internal stack trace is not serialized in any output representation', () => {
      const err = new InternalServerError('Error with stack', { stack: 'at /secret/path/app.ts:10' });
      expect(JSON.stringify(err)).not.toContain('/secret/path');
      expect(JSON.stringify({ ...err })).not.toContain('/secret/path');
      expect(JSON.stringify(Object.assign({}, err))).not.toContain('/secret/path');
      expect(JSON.stringify(err.toClientResponse())).not.toContain('/secret/path');
      expect(JSON.stringify(ApiResponseBuilder.error('msg', ErrorCodes.INTERNAL_SERVER_ERROR, err.stack))).not.toContain('Error with stack');
    });
  });

  describe('PaginationQuerySchema', () => {
    it('parses valid pagination query parameters with defaults', () => {
      const parsed = PaginationQuerySchema.parse({});
      expect(parsed).toEqual({
        page: 1,
        limit: 20,
        order: 'desc',
      });
    });

    it('parses numeric string query parameters', () => {
      const parsed = PaginationQuerySchema.parse({ page: '2', limit: '50', order: 'asc' });
      expect(parsed).toEqual({
        page: 2,
        limit: 50,
        order: 'asc',
      });
    });

    it('rejects values above the limit maximum and invalid numeric values', () => {
      expect(PaginationQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
      expect(PaginationQuerySchema.safeParse({ page: '' }).success).toBe(false);
    });

    it('documents the current boolean coercion behavior as a design candidate', () => {
      expect(PaginationQuerySchema.parse({ page: true, limit: true })).toMatchObject({
        page: 1,
        limit: 1,
      });
    });
  });
});
