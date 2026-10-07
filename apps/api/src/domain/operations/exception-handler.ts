import {
  AppError,
  DomainError,
  ErrorCodes,
  ExceptionFamilies,
  type ExceptionFamily,
  type ApiErrorResponse,
  ApiResponseBuilder,
} from '@waynah/shared';

export interface ClassifiedException {
  family: ExceptionFamily | 'INFRASTRUCTURE' | 'UNKNOWN';
  code: string;
  statusCode: number;
  isOperational: boolean;
  message: string;
  details?: unknown;
}

/**
 * WAYNAH — Phase 10 Unit A — Exception Handling & Taxonomy Framework
 *
 * Provides a standardized, client-safe error classification, taxonomy mapping,
 * and response handling framework strictly adhering to LOGIC-008 specifications.
 */
export class ExceptionHandler {
  /**
   * Classifies an unknown error into the LOGIC-008 exception taxonomy.
   */
  public static classify(error: unknown): ClassifiedException {
    if (error instanceof DomainError) {
      return {
        family: error.family,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        message: error.message,
        details: error.details,
      };
    }

    if (error instanceof AppError) {
      return {
        family: 'INFRASTRUCTURE',
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        message: error.message,
        details: error.details,
      };
    }

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      // Check for known domain code strings attached to generic errors
      if (err.name === 'GeographicContextMismatchError' || err.code === 'GEOGRAPHIC_CONTEXT_MISMATCH') {
        return {
          family: ExceptionFamilies.GEOGRAPHIC_COVERAGE,
          code: 'GEOGRAPHIC_CONTEXT_MISMATCH',
          statusCode: 400,
          isOperational: true,
          message: typeof err.message === 'string' ? err.message : 'The supplied district does not match place coordinates.',
        };
      }

      if (typeof err.code === 'string' && err.code.startsWith('CANNOT_MERGE') || err.code === 'INVALID_MERGE_SAME_PLACE' || err.code === 'UNMERGE_OUT_OF_SCOPE') {
        return {
          family: ExceptionFamilies.TRUST_DATA_MODERATION,
          code: err.code as string,
          statusCode: 400,
          isOperational: true,
          message: typeof err.message === 'string' ? err.message : 'Invalid place merge or split operation.',
        };
      }

      // HTTP error objects with status
      if (typeof err.status === 'number') {
        return {
          family: 'INFRASTRUCTURE',
          code: typeof err.code === 'string' ? err.code : 'HTTP_ERROR',
          statusCode: err.status,
          isOperational: true,
          message: typeof err.message === 'string' ? err.message : 'HTTP Error',
        };
      }
    }

    // Default unmapped / non-operational internal server error
    return {
      family: 'UNKNOWN',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      isOperational: false,
      message: 'An internal server error occurred',
    };
  }

  /**
   * Transforms any caught error into a client-safe ApiErrorResponse contract.
   * Internal (5xx) or non-operational diagnostic details are stripped to prevent information leaks.
   */
  public static handle(error: unknown): ApiErrorResponse {
    if (error instanceof AppError) {
      return error.toClientResponse();
    }

    const classified = this.classify(error);

    return ApiResponseBuilder.error(
      classified.message,
      classified.code,
      classified.isOperational && classified.statusCode < 500 ? classified.details : undefined
    );
  }

  /**
   * Helper to evaluate whether an error is an operational (expected) domain issue vs system fault.
   */
  public static isOperational(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return this.classify(error).isOperational;
  }
}
