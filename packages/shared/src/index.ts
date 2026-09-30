import { z } from 'zod';

export { z };
export const WAYNAH_PLATFORM_NAME = 'WAYNAH' as const;
export const WAYNAH_VERSION = '0.1.0' as const;

export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

export * from './schemas/discovery.schema.js';
export * from './schemas/search.schema.js';
export * from './types/auth.types.js';
export * from './constants/permissions.js';

