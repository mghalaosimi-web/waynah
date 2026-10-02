import { ErrorCodes, type ErrorCode } from '../constants/error-codes.js';
import type { ApiErrorResponse } from '../types/response.types.js';

const INTERNAL_ERROR_MESSAGE = 'An internal server error occurred';

/**
 * Base Application Error Class
 * Serializable, framework-independent error model for N-Tier applications.
 */
export class AppError extends Error {
  public readonly code: ErrorCode | string;
  public readonly statusCode: number;
  declare public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode | string = ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode = 500,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.defineProperty(this, 'details', {
      value: details,
      writable: false,
      configurable: true,
      enumerable: false,
    });
    
    const errWithStack = Error as unknown as { captureStackTrace?: (target: object, ctor?: Function) => void };
    if (typeof errWithStack.captureStackTrace === 'function') {
      errWithStack.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Maps internal error state to the public error contract. 5xx errors and
   * non-operational errors deliberately omit diagnostic details.
   */
  public toClientResponse(): ApiErrorResponse {
    const isInternal = this.statusCode >= 500 || !this.isOperational;

    return {
      success: false,
      error: {
        code: this.code,
        message: isInternal ? INTERNAL_ERROR_MESSAGE : this.message,
        ...(!isInternal && this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }

  /**
   * JSON serialization is client-safe while `details` remains available on
   * the in-memory error instance for server-side logging and diagnostics.
   */
  public toJSON(): ApiErrorResponse {
    return this.toClientResponse();
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, ErrorCodes.VALIDATION_ERROR, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, ErrorCodes.UNAUTHORIZED, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details?: unknown) {
    super(message, ErrorCodes.FORBIDDEN, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, ErrorCodes.NOT_FOUND, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, ErrorCodes.CONFLICT, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details?: unknown) {
    super(message, ErrorCodes.TOO_MANY_REQUESTS, 429, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = INTERNAL_ERROR_MESSAGE, details?: unknown) {
    super(message, ErrorCodes.INTERNAL_SERVER_ERROR, 500, details, false);
  }
}
