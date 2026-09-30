import { prisma } from '../client.js';

export interface PostGISVersionResult {
  postgis_full_version: string;
}

export interface SpatialConnectionHealth {
  connected: boolean;
  postgisVersion?: string;
  error?: string;
}

/**
 * Executes a safe, parameterized raw query to verify PostGIS extension status & version.
 */
export async function verifySpatialConnection(): Promise<SpatialConnectionHealth> {
  try {
    const result = await prisma.$queryRaw<PostGISVersionResult[]>`
      SELECT PostGIS_Full_Version() as postgis_full_version;
    `;

    if (result && result.length > 0 && result[0]?.postgis_full_version) {
      return {
        connected: true,
        postgisVersion: result[0].postgis_full_version,
      };
    }

    return {
      connected: false,
      error: 'PostGIS extension returned empty version string',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      error: errorMessage,
    };
  }
}
