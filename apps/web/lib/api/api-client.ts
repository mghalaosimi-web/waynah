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

export interface IngestObservationInput {
  dataSourceId?: string;
  placeId?: string;
  name?: string;
  phone?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
}

export interface IngestObservationResult {
  observation: {
    id: string;
    placeId?: string | null;
    createdAt?: string;
  };
  action: string;
}

export interface DataConflictItem {
  id: string;
  placeId: string;
  description: string;
  baseObservationId: string;
  conflictingObservationId: string;
  status: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  place: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    phoneNumber?: string | null;
  };
}

export interface PlaceObservationItem {
  id: string;
  placeId?: string | null;
  dataSourceId: string;
  name?: string | null;
  phone?: string | null;
  categoryId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  confidenceScore: number;
  status: string;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
  dataSource: {
    id: string;
    name: string;
    type: string;
    reliabilityWeight: number;
  };
}

export interface PlaceHistoryData {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  verificationStatus: string;
  categoryId: string;
  districtId: string;
  category: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    slug: string;
    icon?: string | null;
  };
  district: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    governorate: {
      id: string;
      nameAr: string;
      nameEn?: string | null;
    };
  };
  location?: {
    id: string;
    latitude: number;
    longitude: number;
  } | null;
  observations: PlaceObservationItem[];
  conflicts: {
    id: string;
    placeId: string;
    description: string;
    baseObservationId: string;
    conflictingObservationId: string;
    status: string;
    createdAt: string;
  }[];
}


export const MOCK_DEMO_CATEGORIES: PlaceCategory[] = [
  { id: 'cat-1', nameAr: 'صيدليات ورعاية صحية', nameEn: 'Pharmacies & Health', slug: 'pharmacies', icon: '💊' },
  { id: 'cat-2', nameAr: 'مطاعم ومأكولات شعبية', nameEn: 'Restaurants & Food', slug: 'restaurants', icon: '🍽️' },
  { id: 'cat-3', nameAr: 'مستشفيات وطوارئ', nameEn: 'Hospitals & Emergency', slug: 'hospitals', icon: '🏥' },
  { id: 'cat-4', nameAr: 'مراكز خدمة وتقنية', nameEn: 'Services & Tech', slug: 'services', icon: '⚡' },
  { id: 'cat-5', nameAr: 'سوبرماركت ومتاجر', nameEn: 'Stores & Supermarkets', slug: 'stores', icon: '🛒' },
  { id: 'cat-6', nameAr: 'خدمات لوجستية ونقل', nameEn: 'Logistics & Transport', slug: 'logistics', icon: '🚚' },
];

export const MOCK_DEMO_PLACES: PlaceSearchResult[] = [
  {
    id: 'place-1',
    nameAr: 'صيدلية السلام الحديثة [بيانات تجريبية]',
    nameEn: 'Al-Salam Modern Pharmacy (Demo)',
    slug: 'al-salam-pharmacy-abs',
    description: 'فرع صيدلية السلام الوطنية. توفر المستلزمات الطبية والأدوية العامة والخدمة الاستشارية على مدار 24 ساعة.',
    address: 'عبس — شارع السوق الرئيسي — بجوار المجمع الطبي',
    phoneNumber: '+967 771 234 567',
    website: 'https://waynah.demo/pharmacy-abs',
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-1',
    categoryNameAr: 'صيدليات ورعاية صحية',
    districtNameAr: 'حي السوق الرئيسي',
    governorateNameAr: 'عبس — محافظة حجة',
    latitude: 15.9189,
    longitude: 43.2081,
    distance_meters: 320,
    confidenceScore: 0.96,
  },
  {
    id: 'place-2',
    nameAr: 'مستشفى عبس العام والتخصصي [بيانات تجريبية]',
    nameEn: 'Abs General Hospital (Demo)',
    slug: 'abs-general-hospital',
    description: 'مستشفى حكومي تخصصي يوفر أقسام الطوارئ العاجلة والعمليات والأشعة والمختبرات المركزية.',
    address: 'عبس — المدخل الجنوبي — الخط العام',
    phoneNumber: '+967 770 987 654',
    website: 'https://waynah.demo/abs-hospital',
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-3',
    categoryNameAr: 'مستشفيات وطوارئ',
    districtNameAr: 'حي النصر',
    governorateNameAr: 'عبس — محافظة حجة',
    latitude: 15.9120,
    longitude: 43.2150,
    distance_meters: 850,
    confidenceScore: 0.98,
  },
  {
    id: 'place-3',
    nameAr: 'مطعم السعيد للمأكولات الشعبية [بيانات تجريبية]',
    nameEn: 'Al-Saeed Traditional Restaurant (Demo)',
    slug: 'al-saeed-restaurant-abs',
    description: 'مطعم مأكولات شعبية يمني. تنبيه عدم يقين: يوجد تعارض في رقم التواصل المحدث عبر بلاغ مجتمعي.',
    address: 'عبس — قرب دوار الساعة',
    phoneNumber: '+967 773 112 233',
    verificationStatus: 'COMMUNITY',
    categoryId: 'cat-2',
    categoryNameAr: 'مطاعم ومأكولات شعبية',
    districtNameAr: 'دوار الساعة',
    governorateNameAr: 'عبس — محافظة حجة',
    latitude: 15.9220,
    longitude: 43.2010,
    distance_meters: 1100,
    confidenceScore: 0.75,
  },
  {
    id: 'place-4',
    nameAr: 'مركز الخدمة السريعة للاتصالات [بيانات تجريبية]',
    nameEn: 'Express Telecom Service Center (Demo)',
    slug: 'express-telecom-abs',
    description: 'مركز خدمة وصيانة أجهزة وسداد فواتير. تنبيه: المعلومات غير محدثة ميدانياً منذ أكثر من 90 يوماً.',
    address: 'عبس — شارع المحطة الرئيسي',
    phoneNumber: '+967 777 444 555',
    verificationStatus: 'STALE',
    categoryId: 'cat-4',
    categoryNameAr: 'مراكز خدمة وتقنية',
    districtNameAr: 'شارع المحطة',
    governorateNameAr: 'عبس — محافظة حجة',
    latitude: 15.9150,
    longitude: 43.2050,
    distance_meters: 500,
    confidenceScore: 0.60,
  },
  {
    id: 'place-5',
    nameAr: 'صيدلية الحكمة والتجهيزات الطبية [بيانات تجريبية]',
    nameEn: 'Al-Hikma Pharmacy (Demo)',
    slug: 'al-hikma-pharmacy-hajjah',
    description: 'صيدلية مركزية توفر المستلزمات الطبية والأدوية وتجهيزات العناية الشخصية.',
    address: 'حجة — الشارع الرئيسي — مقابل المستشفى الجمهوري',
    phoneNumber: '+967 775 888 999',
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-1',
    categoryNameAr: 'صيدليات ورعاية صحية',
    districtNameAr: 'حي النصر',
    governorateNameAr: 'حجة — المركز',
    latitude: 15.6942,
    longitude: 43.6041,
    distance_meters: 12400,
    confidenceScore: 0.92,
  },
];

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    this.baseUrl =
      baseUrl ||
      (typeof window !== 'undefined'
        ? envUrl || ''
        : envUrl || 'http://localhost:3000');
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
    } catch (_err: unknown) {
      // Prototype Mock Fallback Logic when server is offline and mock mode is explicitly enabled
      const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === 'true';

      if (enableMock) {
        if (endpoint.includes('/v1/search/categories')) {
          return { success: true, data: MOCK_DEMO_CATEGORIES as unknown as T };
        }

        if (endpoint.includes('/v1/search/places/')) {
          const placeId = endpoint.split('/v1/search/places/')[1];
          const found = MOCK_DEMO_PLACES.find((p) => p.id === placeId) || MOCK_DEMO_PLACES[0];
          return { success: true, data: found as unknown as T };
        }

        if (endpoint.includes('/v1/search')) {
          const urlObj = new URL(url, 'http://localhost');
          const q = urlObj.searchParams.get('query')?.toLowerCase();
          const catId = urlObj.searchParams.get('categoryId');

          let filtered = [...MOCK_DEMO_PLACES];
          if (q) {
            filtered = filtered.filter(
              (p) =>
                p.nameAr.toLowerCase().includes(q) ||
                (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
                (p.address && p.address.toLowerCase().includes(q))
            );
          }
          if (catId) {
            filtered = filtered.filter((p) => p.categoryId === catId);
          }
          return { success: true, data: filtered as unknown as T };
        }

        if (endpoint.includes('/v1/discovery/ingest') || endpoint.includes('/v1/discovery/community-report')) {
          const bodyStr = options.body as string;
          let parsed: Record<string, unknown> = {};
          try {
            if (bodyStr) parsed = JSON.parse(bodyStr);
          } catch (_e) {}

          return {
            success: true,
            data: {
              observation: {
                id: `obs-${Math.random().toString(36).substring(2, 9)}`,
                placeId: (parsed.placeId as string) || null,
                createdAt: new Date().toISOString(),
              },
              action: 'OBSERVATION_INGESTED',
            } as unknown as T,
          };
        }

        if (endpoint.includes('/v1/businesses/')) {
          return {
            success: true,
            data: {
              id: 'biz-1',
              name: 'منشأة صيدليات السلام الوطنية [بيانات تجريبية]',
              description: 'منشأة صحية رائدة تدير وتغل شبكة من الصيدليات والمراكز الطبية في عبس وحجة.',
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              verified: true,
              verificationStatus: 'VERIFIED',
              places: MOCK_DEMO_PLACES.filter((p) => p.categoryId === 'cat-1'),
            } as unknown as T,
          };
        }

        if (endpoint.includes('/v1/admin/conflicts')) {
          return {
            success: true,
            data: [
              {
                id: 'conflict-demo-1',
                placeId: 'place-3',
                description: '[{"field":"phone","old":"+967 773 112 233","new":"+967 773 999 000"}]',
                baseObservationId: 'obs-base-1',
                conflictingObservationId: 'obs-conflict-1',
                status: 'OPEN',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                place: {
                  id: 'place-3',
                  nameAr: 'مطعم السعيد للمأكولات الشعبية [بيانات تجريبية]',
                  nameEn: 'Al-Saeed Traditional Restaurant (Demo)',
                  phoneNumber: '+967 773 112 233',
                },
              },
            ] as unknown as T,
            count: 1,
          };
        }

        if (endpoint.includes('/v1/admin/places/') && endpoint.includes('/history')) {
          const placeId = endpoint.split('/v1/admin/places/')[1].split('/history')[0];
          const found = MOCK_DEMO_PLACES.find((p) => p.id === placeId) || MOCK_DEMO_PLACES[0];
          return {
            success: true,
            data: {
              id: found.id,
              nameAr: found.nameAr,
              nameEn: found.nameEn,
              slug: found.slug,
              description: found.description,
              address: found.address,
              phoneNumber: found.phoneNumber,
              website: found.website,
              verificationStatus: found.verificationStatus || 'UNVERIFIED',
              categoryId: found.categoryId || 'cat-1',
              districtId: 'dist-1',
              category: {
                id: found.categoryId || 'cat-1',
                nameAr: found.categoryNameAr || 'صيدليات ورعاية صحية',
                nameEn: 'Pharmacies & Health',
                slug: 'pharmacies',
                icon: '💊',
              },
              district: {
                id: 'dist-1',
                nameAr: found.districtNameAr || 'عبس',
                nameEn: 'Abs',
                governorate: {
                  id: 'gov-1',
                  nameAr: 'محافظة حجة',
                  nameEn: 'Hajjah Governorate',
                },
              },
              location: found.latitude ? { id: 'loc-1', latitude: found.latitude, longitude: found.longitude || 0 } : null,
              observations: [
                {
                  id: 'obs-sys-1',
                  placeId: found.id,
                  dataSourceId: 'ds-1',
                  name: found.nameAr,
                  phone: found.phoneNumber,
                  categoryId: found.categoryId,
                  latitude: found.latitude,
                  longitude: found.longitude,
                  confidenceScore: found.confidenceScore || 0.8,
                  status: 'AUTO_APPROVED',
                  discoveredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                  createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                  updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                  dataSource: {
                    id: 'ds-1',
                    name: 'معدل بيانات الشركاء الميدانيين (Partner Data Ingestion)',
                    type: 'SYSTEM_INGESTION',
                    reliabilityWeight: 0.85,
                  },
                },
                {
                  id: 'obs-comm-1',
                  placeId: found.id,
                  dataSourceId: 'ds-community',
                  name: found.nameAr,
                  phone: '+967 773 999 000',
                  categoryId: found.categoryId,
                  latitude: found.latitude,
                  longitude: found.longitude,
                  confidenceScore: 0.0,
                  status: 'PENDING',
                  discoveredAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  dataSource: {
                    id: 'ds-community',
                    name: 'WAYNAH Community Reports',
                    type: 'COMMUNITY_OBSERVATION',
                    reliabilityWeight: 0.5,
                  },
                },
              ],
              conflicts: [
                {
                  id: 'conflict-demo-1',
                  placeId: found.id,
                  description: '[{"field":"phone","old":"+967 773 112 233","new":"+967 773 999 000"}]',
                  baseObservationId: 'obs-sys-1',
                  conflictingObservationId: 'obs-comm-1',
                  status: 'OPEN',
                  createdAt: new Date().toISOString(),
                },
              ],
            } as unknown as T,
          };
        }
      }

      return {
        success: false,
        error: 'تعذر الاتصال بخادم الواجهة البرمجية، يرجى المحاولة لاحقاً.',
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
  public async getAdminConflicts(apiKey?: string): Promise<ApiResponse<DataConflictItem[]>> {
    return this.request<DataConflictItem[]>('/v1/admin/conflicts', { method: 'GET' }, apiKey);
  }

  /**
   * Admin Place History (Protected API)
   */
  public async getPlaceHistory(placeId: string, apiKey?: string): Promise<ApiResponse<PlaceHistoryData>> {
    return this.request<PlaceHistoryData>(`/v1/admin/places/${placeId}/history`, { method: 'GET' }, apiKey);
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
   * Submit Place Correction / Community Observation (Public Community API)
   */
  public async submitPlaceCorrection(
    data: Omit<IngestObservationInput, 'dataSourceId'>
  ): Promise<ApiResponse<IngestObservationResult>> {
    const payload = {
      placeId: data.placeId,
      name: data.name,
      phone: data.phone,
      categoryId: data.categoryId,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    return this.request<IngestObservationResult>('/v1/discovery/community-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
