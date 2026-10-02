import { z } from 'zod';

/**
 * Schema for raw place observation ingestion payloads.
 *
 * SECURITY NOTE:
 * `confidenceScore` and `status` are intentionally excluded.
 * Both fields are computed internally by the Discovery Pipeline domain;
 * they must never be accepted from external callers.
 */
export const createObservationSchema = z
  .object({
    dataSourceId: z.string().uuid({ message: 'dataSourceId must be a valid UUID' }),
    placeId: z.string().uuid({ message: 'placeId must be a valid UUID' }).optional(),
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    categoryId: z.string().uuid({ message: 'categoryId must be a valid UUID' }).optional(),
    latitude: z
      .number()
      .min(-90, { message: 'Latitude must be between -90 and 90' })
      .max(90, { message: 'Latitude must be between -90 and 90' })
      .optional(),
    longitude: z
      .number()
      .min(-180, { message: 'Longitude must be between -180 and 180' })
      .max(180, { message: 'Longitude must be between -180 and 180' })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.categoryId !== undefined ||
      (data.latitude !== undefined && data.longitude !== undefined) ||
      data.placeId !== undefined,
    {
      message:
        'At least one core attribute (name, phone, categoryId, location coordinates, or placeId) must be provided',
    }
  )
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    {
      message: 'Both latitude and longitude must be provided together if spatial coordinates are included',
      path: ['latitude'],
    }
  );

export type CreateObservationInput = z.infer<typeof createObservationSchema>;

/**
 * Schema for public community observation submission payloads.
 *
 * `dataSourceId` is intentionally excluded because the backend server assigns
 * the Community DataSource server-side to prevent provenance spoofing.
 */
export const communityReportSchema = z
  .object({
    placeId: z.string().uuid({ message: 'placeId must be a valid UUID' }).optional(),
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    categoryId: z.string().uuid({ message: 'categoryId must be a valid UUID' }).optional(),
    latitude: z
      .number()
      .min(-90, { message: 'Latitude must be between -90 and 90' })
      .max(90, { message: 'Latitude must be between -90 and 90' })
      .optional(),
    longitude: z
      .number()
      .min(-180, { message: 'Longitude must be between -180 and 180' })
      .max(180, { message: 'Longitude must be between -180 and 180' })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.categoryId !== undefined ||
      (data.latitude !== undefined && data.longitude !== undefined) ||
      data.placeId !== undefined,
    {
      message:
        'At least one core attribute (name, phone, categoryId, location coordinates, or placeId) must be provided',
    }
  )
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    {
      message: 'Both latitude and longitude must be provided together if spatial coordinates are included',
      path: ['latitude'],
    }
  );

export type CommunityReportInput = z.infer<typeof communityReportSchema>;

