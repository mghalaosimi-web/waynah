import {
  ApiResponseBuilder,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiErrorDetail,
} from '@waynah/shared';

export type { ApiSuccessResponse, ApiErrorResponse, ApiErrorDetail };

/**
 * Standardized API Response Helper for apps/api.
 * Extends @waynah/shared ApiResponseBuilder for 100% backward compatibility.
 */
export class ApiResponse {
  public static success<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
    return ApiResponseBuilder.success(data, meta);
  }

  public static error(message: string, code = 'INTERNAL_ERROR', details?: unknown): ApiErrorResponse {
    return ApiResponseBuilder.error(message, code, details);
  }
}
