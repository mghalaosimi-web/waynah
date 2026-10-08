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
    const queryPromise = prisma.$queryRaw<PostGISVersionResult[]>`
      SELECT PostGIS_Full_Version() as postgis_full_version;
    `;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Spatial database query timeout (3s limit exceeded)')), 3000)
    );

    const result = await Promise.race([queryPromise, timeoutPromise]);

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
