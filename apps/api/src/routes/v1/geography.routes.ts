/**
 * WAYNAH Geography Routes — /v1/geography
 *
 * PUBLIC read-only endpoints:
 *   GET /v1/geography/governorates
 *   GET /v1/geography/governorates/:id
 *   GET /v1/geography/governorates/:id/districts
 *
 * These routes return real database records only.
 * No geographic import/mutation is exposed publicly.
 *
 * AUTHORIZATION:
 * Read endpoints are intentionally public (no auth required).
 * Geographic reference data (governorates, districts) is not sensitive.
 * Import/mutation operations are handled internally and must never be exposed here.
 */

import { Hono } from 'hono';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { GeographyService } from '../../domain/geography/geography.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export function createGeographyRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const geographyService = new GeographyService(prismaClient);

  /**
   * GET /v1/geography/governorates
   *
   * Returns all governorates in the database, ordered by Arabic name.
   * Returns an empty array if no governorates exist yet.
   *
   * NOTE: If the list is empty, geographic import has not yet been performed.
   * This is expected at initial deployment; it is not an error.
   */
  router.get('/governorates', async (c) => {
    const governorates = await geographyService.listGovernorates();
    return c.json(
      ApiResponse.success(governorates, { count: governorates.length })
    );
  });

  /**
   * GET /v1/geography/governorates/:id
   *
   * Returns a single governorate by its internal WAYNAH UUID.
   * Returns 404 if not found.
   */
  router.get('/governorates/:id', async (c) => {
    const id = c.req.param('id');
    const governorate = await geographyService.getGovernorateById(id);

    if (!governorate) {
      return c.json(
        ApiResponse.error(`Governorate with ID '${id}' was not found`, 'NOT_FOUND'),
        404
      );
    }

    return c.json(ApiResponse.success(governorate));
  });

  /**
   * GET /v1/geography/governorates/:id/districts
   *
   * Returns all districts belonging to the specified governorate, ordered by Arabic name.
   * Returns 404 if the governorate does not exist.
   * Returns an empty array if the governorate exists but has no districts yet.
   */
  router.get('/governorates/:id/districts', async (c) => {
    const governorateId = c.req.param('id');

    // Verify the governorate exists before returning districts.
    const governorate = await geographyService.getGovernorateById(governorateId);
    if (!governorate) {
      return c.json(
        ApiResponse.error(`Governorate with ID '${governorateId}' was not found`, 'NOT_FOUND'),
        404
      );
    }

    const districts = await geographyService.listDistrictsByGovernorate(governorateId);
    return c.json(
      ApiResponse.success(districts, { count: districts.length, governorateId })
    );
  });

  return router;
}
