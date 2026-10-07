import { z } from 'zod';

export const searchParamsSchema = z
  .object({
    query: z.string().trim().min(1).optional(),
    lat: z
      .number()
      .min(-90, { message: 'lat must be between -90 and 90' })
      .max(90, { message: 'lat must be between -90 and 90' })
      .optional(),
    lng: z
      .number()
      .min(-180, { message: 'lng must be between -180 and 180' })
      .max(180, { message: 'lng must be between -180 and 180' })
      .optional(),
    radiusMeters: z
      .number()
      .positive({ message: 'radiusMeters must be positive' })
      .default(5000)
      .optional(),
    categoryId: z.string().uuid({ message: 'categoryId must be a valid UUID' }).optional(),
    governorateId: z.string().trim().min(1).optional(),
    districtId: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(50).default(20).optional(),
    offset: z.number().int().min(0).default(0).optional(),
  })
  .refine(
    (data) =>
      (data.lat === undefined && data.lng === undefined) ||
      (data.lat !== undefined && data.lng !== undefined),
    {
      message: 'Both lat and lng must be provided together for spatial queries',
      path: ['lat'],
    }
  );

export type SearchParams = z.infer<typeof searchParamsSchema>;
