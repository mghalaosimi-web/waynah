/**
 * Standardized API Response Helper
 *
 * Enforces unified JSON response structure across all public and protected API routes:
 *
 * Success Response:
 * {
 *   "success": true,
 *   "data": T,
 *   "meta"?: Record<string, unknown>
 * }
 *
 * Error Response:
 * {
 *   "success": false,
 *   "error": {
 *     "code": string,
 *     "message": string,
 *     "details"?: unknown
 *   }
 * }
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export class ApiResponse {
  public static success<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    };
  }

  public static error(message: string, code = 'INTERNAL_ERROR', details?: unknown): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };
  }
}
