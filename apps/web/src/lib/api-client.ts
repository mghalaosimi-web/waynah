/**
 * API Client for WAYNAH Web Application
 *
 * Enforces the architectural boundary:
 * apps/web -> HTTP API -> Domain Services -> Database
 *
 * Eliminates direct database imports from Web Next.js server components.
 */

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const API_BASE_URL =
  getEnv('NEXT_PUBLIC_API_URL') ||
  getEnv('API_URL') ||
  'http://localhost:3000';

const API_KEY =
  getEnv('INGESTION_API_KEY') || 'dev-ingestion-key-do-not-use-in-prod';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store', // ensures fresh data in server components
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null as T;
    }
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const apiClient = {
  /**
   * Fetches open data conflicts queue for admin moderation.
   */
  async getOpenConflicts() {
    return fetchApi<
      Array<{
        id: string;
        placeId: string;
        description: string;
        baseObservationId: string;
        conflictingObservationId: string;
        status: string;
        resolvedAt: string | null;
        createdAt: string;
        updatedAt: string;
        place: {
          id: string;
          nameAr: string;
          nameEn: string | null;
          phoneNumber: string | null;
        };
      }>
    >('/v1/admin/conflicts');
  },

  /**
   * Fetches place knowledge history and observations timeline.
   */
  async getPlaceHistory(placeId: string) {
    return fetchApi<{
      id: string;
      nameAr: string;
      nameEn: string | null;
      slug: string | null;
      description: string | null;
      address: string | null;
      phoneNumber: string | null;
      website: string | null;
      verificationStatus: string;
      categoryId: string;
      districtId: string;
      createdAt: string;
      updatedAt: string;
      category: {
        id: string;
        nameAr: string;
        nameEn: string | null;
      };
      district: {
        id: string;
        nameAr: string;
        nameEn: string | null;
        governorate: {
          id: string;
          nameAr: string;
          nameEn: string | null;
        };
      };
      location: {
        id: string;
        latitude: number;
        longitude: number;
      } | null;
      observations: Array<{
        id: string;
        placeId: string | null;
        dataSourceId: string;
        name: string | null;
        phone: string | null;
        confidenceScore: number;
        status: string;
        discoveredAt: string;
        createdAt: string;
        dataSource: {
          id: string;
          name: string;
          reliabilityWeight: number;
        };
      }>;
      conflicts: Array<{
        id: string;
        description: string;
        createdAt: string;
      }>;
    } | null>(`/v1/admin/places/${placeId}/history`);
  },
};
