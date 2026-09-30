/**
 * WAYNAH API Client Boundary
 *
 * Encapsulates all HTTP API communication between Web App and API Server.
 * Enforces: Web UI -> API Client -> HTTP API -> Domain Services -> Database.
 * Web UI NEVER touches Prisma / Database directly.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  count?: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code?: string;
    message?: string;
    details?: unknown;
  } | string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckData {
  status: string;
  database: boolean;
  timestamp: string;
}

export interface PlaceCategory {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
}

export interface PlaceSearchResult {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  verificationStatus?: string;
  categoryId?: string;
  districtId?: string;
  categoryNameAr?: string;
  districtNameAr?: string;
  governorateNameAr?: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters?: number;
  match_score?: number;
  confidenceScore?: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthActorData {
  id: string;
  type: 'ANONYMOUS' | 'SYSTEM' | 'SERVICE' | 'USER' | 'BUSINESS_MEMBER' | 'ADMIN';
  roles: string[];
  permissions: string[];
}

export interface AuthResponseData {
  user: UserData;
  actor: AuthActorData;
  token: string;
}

export interface MeResponseData {
  authenticated: boolean;
  actor: AuthActorData;
  user: UserData | null;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  placeId: string;
  createdAt: string;
  place: PlaceSearchResult;
}

export interface ServiceRequestItem {
  id: string;
  userId: string;
  placeId?: string | null;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  place?: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
  } | null;
}

export interface BusinessMemberItem {
  id: string;
  businessId: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export type BusinessVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AdminVerificationStats {
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalBusinessesCount: number;
}

export interface BusinessVerificationData {
  id: string | null;
  businessId: string;
  status: BusinessVerificationStatus;
  notes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewerId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: BusinessItem | null;
}

export interface BusinessItem {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  membershipRole?: 'OWNER' | 'MANAGER' | 'MEMBER';
  members?: BusinessMemberItem[];
  places?: PlaceSearchResult[];
  totalPlaces?: number;
  verification?: BusinessVerificationData | null;
  verified?: boolean;
  verificationStatus?: BusinessVerificationStatus;
}


export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customApiKey?: string
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (customApiKey) {
      headers['X-API-Key'] = customApiKey;
    }

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const data = await response.json();

      // Normalize error string/object format
      if (!response.ok && data.success !== false) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return data as ApiResponse<T>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to API server';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Health Check (Public API)
   */
  public async getHealth(): Promise<ApiResponse<HealthCheckData>> {
    return this.request<HealthCheckData>('/health');
  }

  /**
   * Register User (Auth API)
   */
  public async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponseData>> {
    return this.request<AuthResponseData>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login User (Auth API)
   */
  public async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponseData>> {
    return this.request<AuthResponseData>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Logout User (Auth API)
   */
  public async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/v1/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Get Current Identity (Auth API)
   */
  public async getMe(): Promise<ApiResponse<MeResponseData>> {
    return this.request<MeResponseData>('/v1/auth/me');
  }

  /**
   * Search Places (Public API)
   */
  public async searchPlaces(params: {
    query?: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PlaceSearchResult[]>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.lat !== undefined) searchParams.set('lat', String(params.lat));
    if (params.lng !== undefined) searchParams.set('lng', String(params.lng));
    if (params.radiusMeters !== undefined) searchParams.set('radiusMeters', String(params.radiusMeters));
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

    const queryString = searchParams.toString();
    const endpoint = `/v1/search${queryString ? `?${queryString}` : ''}`;
    return this.request<PlaceSearchResult[]>(endpoint);
  }

  /**
   * Fetch categories list (Public API)
   */
  public async getCategories(): Promise<ApiResponse<PlaceCategory[]>> {
    return this.request<PlaceCategory[]>('/v1/search/categories');
  }

  /**
   * Fetch single place by ID (Public API)
   */
  public async getPlaceById(id: string): Promise<ApiResponse<PlaceSearchResult>> {
    return this.request<PlaceSearchResult>(`/v1/search/places/${id}`);
  }

  /**
   * Get User Favorites (Protected API)
   */
  public async getFavorites(): Promise<ApiResponse<FavoriteItem[]>> {
    return this.request<FavoriteItem[]>('/v1/user/favorites');
  }

  /**
   * Add Place to User Favorites (Protected API)
   */
  public async addFavorite(placeId: string): Promise<ApiResponse<FavoriteItem>> {
    return this.request<FavoriteItem>('/v1/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ placeId }),
    });
  }

  /**
   * Remove Place from User Favorites (Protected API)
   */
  public async removeFavorite(placeId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/v1/user/favorites/${placeId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get User Requests (Protected API)
   */
  public async getRequests(): Promise<ApiResponse<ServiceRequestItem[]>> {
    return this.request<ServiceRequestItem[]>('/v1/user/requests');
  }

  /**
   * Create User Service Request (Protected API)
   */
  public async createRequest(data: {
    title: string;
    description: string;
    placeId?: string | null;
  }): Promise<ApiResponse<ServiceRequestItem>> {
    return this.request<ServiceRequestItem>('/v1/user/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Admin Conflicts (Protected API)
   */
  public async getAdminConflicts(apiKey?: string): Promise<ApiResponse<unknown[]>> {
    return this.request<unknown[]>('/v1/admin/conflicts', { method: 'GET' }, apiKey);
  }

  /**
   * Admin Place History (Protected API)
   */
  public async getPlaceHistory(placeId: string, apiKey?: string): Promise<ApiResponse<unknown>> {
    return this.request<unknown>(`/v1/admin/places/${placeId}/history`, { method: 'GET' }, apiKey);
  }

  /**
   * Get User Businesses (Protected API)
   */
  public async getMyBusinesses(): Promise<ApiResponse<BusinessItem[]>> {
    return this.request<BusinessItem[]>('/v1/businesses/my');
  }

  /**
   * Get Business Details by ID (Protected API)
   */
  public async getBusinessById(id: string): Promise<ApiResponse<BusinessItem>> {
    return this.request<BusinessItem>(`/v1/businesses/${id}`);
  }

  /**
   * Get Public Business Profile (Public API)
   */
  public async getPublicBusinessProfile(idOrSlug: string): Promise<ApiResponse<BusinessItem>> {
    return this.request<BusinessItem>(`/v1/businesses/public/${idOrSlug}`);
  }

  /**
   * Create Business (Protected API)
   */
  public async createBusiness(data: {
    name: string;
    description?: string | null;
    slug?: string | null;
  }): Promise<ApiResponse<BusinessItem>> {
    return this.request<BusinessItem>('/v1/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Business (Protected API)
   */
  public async updateBusiness(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      status?: 'ACTIVE' | 'INACTIVE';
    }
  ): Promise<ApiResponse<BusinessItem>> {
    return this.request<BusinessItem>(`/v1/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get Business Verification Status (Protected API)
   */
  public async getBusinessVerification(businessId: string): Promise<ApiResponse<BusinessVerificationData>> {
    return this.request<BusinessVerificationData>(`/v1/businesses/${businessId}/verification`);
  }

  /**
   * Submit Business Verification Request (Protected API)
   */
  public async submitBusinessVerification(
    businessId: string,
    data?: { notes?: string }
  ): Promise<ApiResponse<BusinessVerificationData>> {
    return this.request<BusinessVerificationData>(`/v1/businesses/${businessId}/verification`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  /**
   * Admin Verification Queue (Protected API)
   */
  public async getAdminVerifications(status?: string): Promise<ApiResponse<BusinessVerificationData[]>> {
    const endpoint = `/v1/admin/verifications${status ? `?status=${status}` : ''}`;
    return this.request<BusinessVerificationData[]>(endpoint);
  }

  /**
   * Admin Verification Stats Overview (Protected API)
   */
  public async getAdminVerificationStats(): Promise<ApiResponse<AdminVerificationStats>> {
    return this.request<AdminVerificationStats>('/v1/admin/verifications/stats');
  }

  /**
   * Admin Verification Detail by ID (Protected API)
   */
  public async getAdminVerificationById(id: string): Promise<ApiResponse<BusinessVerificationData>> {
    return this.request<BusinessVerificationData>(`/v1/admin/verifications/${id}`);
  }

  /**
   * Admin Review Verification Request (Protected API)
   */
  public async reviewBusinessVerification(
    id: string,
    data: {
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string | null;
    }
  ): Promise<ApiResponse<BusinessVerificationData>> {
    return this.request<BusinessVerificationData>(`/v1/admin/verifications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
