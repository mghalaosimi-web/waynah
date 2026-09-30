import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { z, PERMISSIONS } from '@waynah/shared';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { UserFavoritesService } from '../../domain/user/user-favorites.service.js';
import { UserRequestsService } from '../../domain/user/user-requests.service.js';
import { ApiResponse } from '../../utils/api-response.js';

const addFavoriteSchema = z.object({
  placeId: z.string().min(1, 'مكان غير محدد'),
});

const createRequestSchema = z.object({
  title: z.string().min(3, 'العنوان قصير جداً'),
  description: z.string().min(5, 'الوصف قصير جداً'),
  placeId: z.string().nullable().optional(),
});

export function createUserRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const favoritesService = new UserFavoritesService(prismaClient);
  const requestsService = new UserRequestsService(prismaClient);

  // ---------------- FAVORITES ----------------

  // GET /v1/user/favorites
  router.get('/favorites', requirePermission(PERMISSIONS.FAVORITE_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || actor?.id;

    if (!userId || userId === 'anonymous') {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const favorites = await favoritesService.getFavorites(userId);
    return c.json(ApiResponse.success(favorites, { count: favorites.length }));
  });

  // POST /v1/user/favorites
  router.post(
    '/favorites',
    requirePermission(PERMISSIONS.FAVORITE_MANAGE),
    zValidator('json', addFavoriteSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات الحفظ غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || actor?.id;

      if (!userId || userId === 'anonymous') {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const { placeId } = c.req.valid('json');

      try {
        const favorite = await favoritesService.addFavorite(userId, placeId);
        return c.json(ApiResponse.success(favorite), 201);
      } catch (err: any) {
        if (err.message === 'PLACE_NOT_FOUND') {
          return c.json(ApiResponse.error('المكان غير موجود', 'PLACE_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في حفظ المكان للمفضلة', 'FAVORITE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/user/favorites/:placeId
  router.delete('/favorites/:placeId', requirePermission(PERMISSIONS.FAVORITE_MANAGE), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || actor?.id;

    if (!userId || userId === 'anonymous') {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const placeId = c.req.param('placeId');
    const result = await favoritesService.removeFavorite(userId, placeId);
    return c.json(ApiResponse.success(result));
  });

  // ---------------- REQUESTS ----------------

  // GET /v1/user/requests
  router.get('/requests', requirePermission(PERMISSIONS.REQUEST_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || actor?.id;

    if (!userId || userId === 'anonymous') {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const requests = await requestsService.getRequests(userId);
    return c.json(ApiResponse.success(requests, { count: requests.length }));
  });

  // POST /v1/user/requests
  router.post(
    '/requests',
    requirePermission(PERMISSIONS.REQUEST_CREATE),
    zValidator('json', createRequestSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات الطلب غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || actor?.id;

      if (!userId || userId === 'anonymous') {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const request = await requestsService.createRequest(userId, body);
        return c.json(ApiResponse.success(request), 201);
      } catch (err: any) {
        if (err.message === 'PLACE_NOT_FOUND') {
          return c.json(ApiResponse.error('المكان المرتبط بالطلب غير موجود', 'PLACE_NOT_FOUND'), 404);
        }
        if (err.message === 'INVALID_TITLE' || err.message === 'INVALID_DESCRIPTION') {
          return c.json(ApiResponse.error('العنوان أو الوصف غير صالح', 'INVALID_INPUT'), 400);
        }
        return c.json(ApiResponse.error('فشل في إنشاء الطلب', 'REQUEST_FAILED'), 500);
      }
    }
  );

  return router;
}

export const userRouter = createUserRouter(defaultPrisma);
