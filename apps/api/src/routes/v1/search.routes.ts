import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { searchParamsSchema, type SearchParams } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { SearchService } from '../../domain/search/search.service.js';

export function createSearchRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const searchService = new SearchService(prismaClient);

  router.get(
    '/',
    zValidator(
      'query',
      searchParamsSchema,
      (result, c) => {
        if (!result.success) {
          return c.json(
            {
              success: false,
              error: 'Invalid search query parameters',
              details: result.error.errors,
            },
            400
          );
        }
        return;
      },
      {
        validationFunction: (schema, value) => {
          const parsed: Record<string, unknown> = { ...value };
          if (typeof parsed.lat === 'string' && parsed.lat.trim() !== '') {
            parsed.lat = Number(parsed.lat);
          }
          if (typeof parsed.lng === 'string' && parsed.lng.trim() !== '') {
            parsed.lng = Number(parsed.lng);
          }
          if (typeof parsed.radiusMeters === 'string' && parsed.radiusMeters.trim() !== '') {
            parsed.radiusMeters = Number(parsed.radiusMeters);
          }
          if (typeof parsed.limit === 'string' && parsed.limit.trim() !== '') {
            parsed.limit = Number(parsed.limit);
          }
          if (typeof parsed.offset === 'string' && parsed.offset.trim() !== '') {
            parsed.offset = Number(parsed.offset);
          }
          return schema.safeParse(parsed);
        },
      }
    ),
    async (c) => {
      const queryParams = c.req.valid('query') as SearchParams;
      const results = await searchService.searchPlaces(queryParams);
      return c.json({
        success: true,
        data: results,
        count: results.length,
      });
    }
  );

  router.get('/categories', async (c) => {
    const categories = await searchService.getCategories();
    return c.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  });

  router.get('/places/:id', async (c) => {
    const id = c.req.param('id');
    const place = await searchService.getPlaceById(id);
    if (!place) {
      return c.json(
        {
          success: false,
          error: 'Place not found',
        },
        404
      );
    }
    return c.json({
      success: true,
      data: place,
    });
  });

  return router;
}

export const searchRouter = createSearchRouter(defaultPrisma);
