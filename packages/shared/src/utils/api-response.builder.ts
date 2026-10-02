import type {
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  PaginationMeta,
} from '../types/response.types.js';
import { ErrorCodes } from '../constants/error-codes.js';

const INTERNAL_ERROR_MESSAGE = 'An internal server error occurred';

/**
 * Standard API Response Builder Helper
 * Construct standardized JSON response objects across all presentation layers.
 */
export class ApiResponseBuilder {
  public static success<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    };
  }

  public static paginated<T>(
    data: T[],
    meta: PaginationMeta
  ): ApiPaginatedResponse<T> {
    return {
      success: true,
      data,
      meta,
    };
  }

  public static error(
    message: string,
    code: string = ErrorCodes.INTERNAL_SERVER_ERROR,
    details?: unknown
  ): ApiErrorResponse {
    const isInternalError =
      code === ErrorCodes.INTERNAL_SERVER_ERROR ||
      code === 'INTERNAL_ERROR' ||
      code === ErrorCodes.SERVICE_UNAVAILABLE ||
      code === ErrorCodes.GATEWAY_TIMEOUT;

    return {
      success: false,
      error: {
        code,
        message: isInternalError ? INTERNAL_ERROR_MESSAGE : message,
        ...(!isInternalError && details !== undefined ? { details } : {}),
      },
    };
  }
}
