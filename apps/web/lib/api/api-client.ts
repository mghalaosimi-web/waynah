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
  category?: { id: string; nameAr: string; icon?: string | null } | null;
  district?: { id: string; nameAr: string; governorate?: { id: string; nameAr: string } | null } | null;
  location?: { latitude: number; longitude: number } | null;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
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

export interface BusinessInvitationItem {
  id: string;
  businessId: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter?: {
    id: string;
    name: string;
  } | null;
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

export interface CatalogProduct {
  id: string;
  businessId: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  sku?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogServiceItem {
  id: string;
  businessId: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  price?: number | null;
  currency: string;
  isAvailable: boolean;
  durationMinutes?: number | null;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCatalogData {
  business?: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
  };
  products: CatalogProduct[];
  services: CatalogServiceItem[];
  totalProducts: number;
  totalServices: number;
}

export interface InquiryItem {
  id: string;
  businessId: string;
  userId: string;
  productId?: string | null;
  serviceId?: string | null;
  subject: string;
  message: string;
  reply?: string | null;
  status: 'PENDING' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug?: string | null };
  user?: { id: string; name: string; email: string };
  product?: CatalogProduct | null;
  service?: CatalogServiceItem | null;
}

export interface ServiceRequestItem {
  id: string;
  userId: string;
  businessId?: string | null;
  placeId?: string | null;
  serviceId?: string | null;
  productId?: string | null;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug?: string | null };
  user?: { id: string; name: string; email: string };
  service?: CatalogServiceItem | null;
  product?: CatalogProduct | null;
}

export interface QuoteItem {
  id: string;
  rfqId: string;
  businessId: string;
  amount: number;
  currency: string;
  notes?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface RFQItem {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  description: string;
  budget?: number | null;
  currency: string;
  status: 'OPEN' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt?: string | null;
  quotes?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug?: string | null };
  user?: { id: string; name: string; email: string };
}

export interface BookingItem {
  id: string;
  businessId: string;
  userId: string;
  serviceId?: string | null;
  scheduledAt: string;
  durationMinutes?: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug?: string | null };
  user?: { id: string; name: string; email: string };
  service?: CatalogServiceItem | null;
}

export interface OrderItemDetail {
  id: string;
  orderId: string;
  productId?: string | null;
  serviceId?: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TransactionOrderItem {
  id: string;
  orderNumber: string;
  businessId: string;
  userId: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  items: OrderItemDetail[];
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug?: string | null };
  user?: { id: string; name: string; email: string };
}

export interface DeliveryItem {
  id: string;
  fulfillmentId: string;
  status: 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  carrierName?: string | null;
  carrierPhone?: string | null;
  trackingNumber?: string | null;
  proofPhotoUrl?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface FulfillmentItem {
  id: string;
  orderId?: string | null;
  bookingId?: string | null;
  businessId: string;
  mode: 'CUSTOMER_PICKUP' | 'MERCHANT_FULFILLMENT' | 'THIRD_PARTY_DELIVERY' | 'FIELD_FULFILLMENT' | 'ON_SITE' | 'REMOTE';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'FULFILLED' | 'CANCELLED';
  otpCode?: string | null;
  notes?: string | null;
  deliveries?: DeliveryItem[];
  fulfilledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: { id: string; orderNumber: string; totalAmount: number; userId: string } | null;
  booking?: { id: string; scheduledAt: string; userId: string } | null;
}

export interface PaymentRecordItem {
  id: string;
  orderId?: string | null;
  bookingId?: string | null;
  businessId: string;
  amount: number;
  currency: string;
  method: 'CASH_ON_DELIVERY' | 'WALLET_TRANSFER' | 'BANK_TRANSFER' | 'CARD' | 'DIRECT_MERCHANT';
  status: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'PAYMENT_FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  referenceNumber?: string | null;
  notes?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: { id: string; orderNumber: string; totalAmount: number; userId: string } | null;
  booking?: { id: string; scheduledAt: string; userId: string } | null;
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

export interface NotificationApiItem {
  id: string;
  userId: string;
  businessId?: string | null;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestObservationInput {
  dataSourceId?: string;
  placeId?: string;
  name?: string;
  phone?: string;
  categoryId?: string;
  description?: string;
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

export interface TimelineActor {
  id: string | null;
  type: 'USER' | 'ADMIN' | 'SYSTEM' | 'UNKNOWN';
}

export interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  actor: TimelineActor;
  title: string;
  description: string;
  status?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  metadata?: Record<string, any>;
  relatedEntity?: { type: string; id: string };
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
  branchClaims?: {
    id: string;
    businessId: string;
    placeId: string;
    claimantId: string;
    reviewerId?: string | null;
    status: string;
    notes?: string | null;
    rejectionReason?: string | null;
    submittedAt: string;
    reviewedAt?: string | null;
    business?: {
      id: string;
      name: string;
      slug?: string | null;
    } | null;
  }[];
  business?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
  timeline?: TimelineEvent[];
}

export interface GovernorateItem {
  id: string;
  externalId: string | null;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  districtCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DistrictItem {
  id: string;
  externalId: string | null;
  governorateId: string;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  hasBoundary?: boolean;
  boundaryStatus?: 'AVAILABLE' | 'MISSING';
  placesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DistrictDetailData extends DistrictItem {
  governorate?: {
    id: string;
    externalId: string | null;
    nameAr: string;
    nameEn: string | null;
    code: string | null;
  } | null;
  boundaryGeometryType?: 'MultiPolygon' | 'Polygon' | null;
  srid?: number | null;
  boundaryGeoJson?: any | null;
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
        if (endpoint.includes('/v1/auth/verify-email')) {
          return { success: true, data: { message: 'تم تأكيد البريد الإلكتروني بنجاح' } as unknown as T };
        }

        if (endpoint.includes('/v1/auth/resend-verification')) {
          return { success: true, data: { message: 'إذا كان البريد الإلكتروني متاحاً وغير مفعل، تم إرسال رابط التأكيد' } as unknown as T };
        }

        if (endpoint.includes('/v1/auth/forgot-password')) {
          return { success: true, data: { message: 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال تعليمات إعادة ضبط كلمة المرور' } as unknown as T };
        }

        if (endpoint.includes('/v1/auth/reset-password')) {
          return { success: true, data: { message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' } as unknown as T };
        }

        if (endpoint.includes('/v1/geography/governorates/')) {
          if (endpoint.includes('/districts')) {
            const govId = endpoint.split('/governorates/')[1].split('/districts')[0];
            return {
              success: true,
              data: [
                {
                  id: 'dist-abs-1',
                  externalId: 'YE1704',
                  governorateId: govId,
                  nameAr: 'عبس',
                  nameEn: 'Abs',
                  code: '1704',
                  hasBoundary: true,
                  boundaryStatus: 'AVAILABLE',
                  placesCount: 12,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 'dist-hajjah-city',
                  externalId: 'YE1701',
                  governorateId: govId,
                  nameAr: 'مدينة حجة',
                  nameEn: 'Hajjah City',
                  code: '1701',
                  hasBoundary: true,
                  boundaryStatus: 'AVAILABLE',
                  placesCount: 8,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ] as unknown as T,
              count: 2,
            };
          } else {
            const govId = endpoint.split('/governorates/')[1];
            return {
              success: true,
              data: {
                id: govId,
                externalId: 'YE17',
                nameAr: 'حجة',
                nameEn: 'Hajjah',
                code: 'YE17',
                districtCount: 31,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as unknown as T,
            };
          }
        }

        if (endpoint.includes('/v1/geography/governorates')) {
          return {
            success: true,
            data: [
              {
                id: 'gov-hajjah-1',
                externalId: 'YE17',
                nameAr: 'حجة',
                nameEn: 'Hajjah',
                code: 'YE17',
                districtCount: 31,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'gov-sanaa-1',
                externalId: 'YE11',
                nameAr: 'أمانة العاصمة',
                nameEn: "Sana'a City",
                code: 'YE11',
                districtCount: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ] as unknown as T,
            count: 2,
          };
        }

        if (endpoint.includes('/v1/geography/districts/')) {
          const distId = endpoint.split('/v1/geography/districts/')[1];
          return {
            success: true,
            data: {
              id: distId,
              externalId: 'YE1704',
              governorateId: 'gov-hajjah-1',
              nameAr: 'عبس',
              nameEn: 'Abs',
              code: '1704',
              hasBoundary: true,
              boundaryStatus: 'AVAILABLE',
              boundaryGeometryType: 'MultiPolygon',
              srid: 4326,
              placesCount: 12,
              boundaryGeoJson: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [43.1, 16.0],
                      [43.3, 16.0],
                      [43.3, 16.2],
                      [43.1, 16.2],
                      [43.1, 16.0],
                    ],
                  ],
                ],
              },
              governorate: {
                id: 'gov-hajjah-1',
                externalId: 'YE17',
                nameAr: 'حجة',
                nameEn: 'Hajjah',
                code: 'YE17',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as T,
          };
        }

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
          const govId = urlObj.searchParams.get('governorateId');
          const distId = urlObj.searchParams.get('districtId');

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
          if (distId) {
            filtered = filtered.filter((p) => p.districtId === distId);
          }
          if (govId) {
            filtered = filtered.filter((p) => p.district?.governorate?.id === govId);
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
              timeline: [
                {
                  id: `conflict-created:conflict-demo-1`,
                  type: 'CONFLICT_CREATED',
                  timestamp: new Date().toISOString(),
                  source: 'DATA_RECONCILIATION',
                  actor: { id: null, type: 'SYSTEM' },
                  title: 'تعارض بيانات مكتشف',
                  description: 'اختلاف في رقم الهاتف الملاحظ',
                  status: 'OPEN',
                  severity: 'WARNING',
                  metadata: {
                    conflictId: 'conflict-demo-1',
                    baseObservationId: 'obs-sys-1',
                    conflictingObservationId: 'obs-comm-1',
                  },
                },
                {
                  id: `observation:obs-comm-1`,
                  type: 'OBSERVATION_RECORDED',
                  timestamp: new Date().toISOString(),
                  source: 'WAYNAH Community Reports',
                  actor: { id: null, type: 'USER' },
                  title: 'ملاحظة مجتمعية جديدة',
                  description: `رصد بيانات لموقع المكان: ${found.nameAr}`,
                  status: 'PENDING',
                  severity: 'INFO',
                  metadata: {
                    observationId: 'obs-comm-1',
                    dataSourceId: 'ds-community',
                    dataSourceType: 'COMMUNITY_OBSERVATION',
                    confidenceScore: 0.0,
                    phone: '+967 773 999 000',
                  },
                },
                {
                  id: `observation:obs-sys-1`,
                  type: 'OBSERVATION_RECORDED',
                  timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
                  source: 'معدل بيانات الشركاء الميدانيين (Partner Data Ingestion)',
                  actor: { id: null, type: 'SYSTEM' },
                  title: 'رصد ملاحظة بيانات',
                  description: `رصد بيانات لموقع المكان: ${found.nameAr}`,
                  status: 'AUTO_APPROVED',
                  severity: 'INFO',
                  metadata: {
                    observationId: 'obs-sys-1',
                    dataSourceId: 'ds-1',
                    dataSourceType: 'SYSTEM_INGESTION',
                    confidenceScore: found.confidenceScore || 0.8,
                    phone: found.phoneNumber,
                  },
                },
                {
                  id: `place-created:${found.id}`,
                  type: 'PLACE_CREATED',
                  timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
                  source: 'CANONICAL_DATABASE',
                  actor: { id: null, type: 'UNKNOWN' },
                  title: 'إنشاء المكان',
                  description: `تم إنشاء سجل المكان (${found.nameAr}) في النظام`,
                  severity: 'INFO',
                  metadata: {
                    placeId: found.id,
                    nameAr: found.nameAr,
                    nameEn: found.nameEn || null,
                    verificationStatus: found.verificationStatus || 'UNVERIFIED',
                  },
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
    governorateId?: string;
    districtId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PlaceSearchResult[]>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.lat !== undefined) searchParams.set('lat', String(params.lat));
    if (params.lng !== undefined) searchParams.set('lng', String(params.lng));
    if (params.radiusMeters !== undefined) searchParams.set('radiusMeters', String(params.radiusMeters));
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.governorateId) searchParams.set('governorateId', params.governorateId);
    if (params.districtId) searchParams.set('districtId', params.districtId);
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
   * Get Business Members (Protected API)
   */
  public async getBusinessMembers(businessId: string): Promise<ApiResponse<BusinessMemberItem[]>> {
    return this.request<BusinessMemberItem[]>(`/v1/businesses/${businessId}/members`);
  }

  /**
   * Get Business Pending Invitations (Protected API)
   */
  public async getBusinessInvitations(businessId: string): Promise<ApiResponse<BusinessInvitationItem[]>> {
    return this.request<BusinessInvitationItem[]>(`/v1/businesses/${businessId}/invitations`);
  }

  /**
   * Invite Business Member (Protected API)
   */
  public async inviteBusinessMember(
    businessId: string,
    data: { email: string; role?: 'MANAGER' | 'MEMBER' }
  ): Promise<ApiResponse<{ invitation: BusinessInvitationItem; rawToken: string }>> {
    return this.request<{ invitation: BusinessInvitationItem; rawToken: string }>(
      `/v1/businesses/${businessId}/members/invite`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  /**
   * Cancel Business Invitation (Protected API)
   */
  public async cancelBusinessInvitation(
    businessId: string,
    invitationId: string
  ): Promise<ApiResponse<BusinessInvitationItem>> {
    return this.request<BusinessInvitationItem>(
      `/v1/businesses/${businessId}/invitations/${invitationId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Remove Business Member (Protected API)
   */
  public async removeBusinessMember(
    businessId: string,
    memberId: string
  ): Promise<ApiResponse<BusinessMemberItem>> {
    return this.request<BusinessMemberItem>(
      `/v1/businesses/${businessId}/members/${memberId}`,
      { method: 'DELETE' }
    );
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
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    return this.request<IngestObservationResult>('/v1/discovery/community-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Verify email using verification token (Public API)
   */
  public async verifyEmail(data: { token: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Resend email verification link (Public API)
   */
  public async resendVerification(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Initiate forgot password flow (Public API)
   */
  public async forgotPassword(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Reset user password using token (Public API)
   */
  public async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Fetch all governorates (Public / Admin API)
   */
  public async getGovernorates(): Promise<ApiResponse<GovernorateItem[]>> {
    return this.request<GovernorateItem[]>('/v1/geography/governorates');
  }

  /**
   * Fetch single governorate by ID (Public / Admin API)
   */
  public async getGovernorateById(id: string): Promise<ApiResponse<GovernorateItem>> {
    return this.request<GovernorateItem>(`/v1/geography/governorates/${id}`);
  }

  /**
   * Fetch districts by governorate ID (Public / Admin API)
   */
  public async getDistrictsByGovernorate(governorateId: string): Promise<ApiResponse<DistrictItem[]>> {
    return this.request<DistrictItem[]>(`/v1/geography/governorates/${governorateId}/districts`);
  }

  /**
   * Fetch district detail with boundary & PostGIS spatial metadata (Public / Admin API)
   */
  public async getDistrictById(id: string): Promise<ApiResponse<DistrictDetailData>> {
    return this.request<DistrictDetailData>(`/v1/geography/districts/${id}`);
  }

  // ---------------- CATALOG, PRODUCTS & SERVICES (PHASE 5) ----------------

  /**
   * Get public business catalog (products & services)
   */
  public async getPublicCatalog(idOrSlug: string): Promise<ApiResponse<BusinessCatalogData>> {
    return this.request<BusinessCatalogData>(`/v1/businesses/public/${idOrSlug}/catalog`);
  }

  /**
   * Get merchant business catalog for authenticated members
   */
  public async getMerchantCatalog(businessId: string): Promise<ApiResponse<BusinessCatalogData>> {
    return this.request<BusinessCatalogData>(`/v1/businesses/${businessId}/catalog`);
  }

  /**
   * Create Product
   */
  public async createProduct(
    businessId: string,
    data: {
      nameAr: string;
      nameEn?: string;
      description?: string;
      price: number;
      currency?: string;
      isAvailable?: boolean;
      sku?: string;
      imageUrl?: string;
      categoryId?: string;
    }
  ): Promise<ApiResponse<CatalogProduct>> {
    return this.request<CatalogProduct>(`/v1/businesses/${businessId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Product
   */
  public async updateProduct(
    businessId: string,
    productId: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      description?: string;
      price?: number;
      currency?: string;
      isAvailable?: boolean;
      sku?: string;
      imageUrl?: string;
      categoryId?: string;
    }
  ): Promise<ApiResponse<CatalogProduct>> {
    return this.request<CatalogProduct>(`/v1/businesses/${businessId}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete Product
   */
  public async deleteProduct(businessId: string, productId: string): Promise<ApiResponse<CatalogProduct>> {
    return this.request<CatalogProduct>(`/v1/businesses/${businessId}/products/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create Service
   */
  public async createService(
    businessId: string,
    data: {
      nameAr: string;
      nameEn?: string;
      description?: string;
      price?: number | null;
      currency?: string;
      isAvailable?: boolean;
      durationMinutes?: number | null;
      categoryId?: string;
    }
  ): Promise<ApiResponse<CatalogServiceItem>> {
    return this.request<CatalogServiceItem>(`/v1/businesses/${businessId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Service
   */
  public async updateService(
    businessId: string,
    serviceId: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      description?: string;
      price?: number | null;
      currency?: string;
      isAvailable?: boolean;
      durationMinutes?: number | null;
      categoryId?: string;
    }
  ): Promise<ApiResponse<CatalogServiceItem>> {
    return this.request<CatalogServiceItem>(`/v1/businesses/${businessId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete Service
   */
  public async deleteService(businessId: string, serviceId: string): Promise<ApiResponse<CatalogServiceItem>> {
    return this.request<CatalogServiceItem>(`/v1/businesses/${businessId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // ---------------- PHASE 6 TRANSACTIONS (INQUIRY, REQUEST, RFQ, BOOKING, ORDER) ----------------

  public async createInquiry(
    businessId: string,
    data: { productId?: string; serviceId?: string; subject: string; message: string }
  ): Promise<ApiResponse<InquiryItem>> {
    return this.request<InquiryItem>(`/v1/transactions/businesses/${businessId}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessInquiries(businessId: string): Promise<ApiResponse<InquiryItem[]>> {
    return this.request<InquiryItem[]>(`/v1/transactions/businesses/${businessId}/inquiries`);
  }

  public async replyInquiry(businessId: string, inquiryId: string, reply: string): Promise<ApiResponse<InquiryItem>> {
    return this.request<InquiryItem>(`/v1/transactions/businesses/${businessId}/inquiries/${inquiryId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
  }

  public async getMyInquiries(): Promise<ApiResponse<InquiryItem[]>> {
    return this.request<InquiryItem[]>('/v1/transactions/my/inquiries');
  }

  public async createServiceRequest(data: {
    businessId?: string;
    placeId?: string;
    serviceId?: string;
    productId?: string;
    title: string;
    description: string;
  }): Promise<ApiResponse<ServiceRequestItem>> {
    return this.request<ServiceRequestItem>('/v1/transactions/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessRequests(businessId: string): Promise<ApiResponse<ServiceRequestItem[]>> {
    return this.request<ServiceRequestItem[]>(`/v1/transactions/businesses/${businessId}/requests`);
  }

  public async updateRequestStatus(
    businessId: string,
    requestId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ): Promise<ApiResponse<ServiceRequestItem>> {
    return this.request<ServiceRequestItem>(`/v1/transactions/businesses/${businessId}/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  public async getMyRequests(): Promise<ApiResponse<ServiceRequestItem[]>> {
    return this.request<ServiceRequestItem[]>('/v1/transactions/my/requests');
  }

  public async createRFQ(
    businessId: string,
    data: { title: string; description: string; budget?: number; currency?: string; expiresAt?: string }
  ): Promise<ApiResponse<RFQItem>> {
    return this.request<RFQItem>(`/v1/transactions/businesses/${businessId}/rfqs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessRFQs(businessId: string): Promise<ApiResponse<RFQItem[]>> {
    return this.request<RFQItem[]>(`/v1/transactions/businesses/${businessId}/rfqs`);
  }

  public async createQuote(
    businessId: string,
    rfqId: string,
    data: { amount: number; currency?: string; notes?: string }
  ): Promise<ApiResponse<QuoteItem>> {
    return this.request<QuoteItem>(`/v1/transactions/businesses/${businessId}/rfqs/${rfqId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getMyRFQs(): Promise<ApiResponse<RFQItem[]>> {
    return this.request<RFQItem[]>('/v1/transactions/my/rfqs');
  }

  public async createBooking(
    businessId: string,
    data: { serviceId?: string; scheduledAt: string; durationMinutes?: number; notes?: string }
  ): Promise<ApiResponse<BookingItem>> {
    return this.request<BookingItem>(`/v1/transactions/businesses/${businessId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessBookings(businessId: string): Promise<ApiResponse<BookingItem[]>> {
    return this.request<BookingItem[]>(`/v1/transactions/businesses/${businessId}/bookings`);
  }

  public async updateBookingStatus(
    businessId: string,
    bookingId: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ): Promise<ApiResponse<BookingItem>> {
    return this.request<BookingItem>(`/v1/transactions/businesses/${businessId}/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async getMyBookings(): Promise<ApiResponse<BookingItem[]>> {
    return this.request<BookingItem[]>('/v1/transactions/my/bookings');
  }

  public async createOrder(
    businessId: string,
    data: {
      items: { productId?: string; serviceId?: string; title: string; quantity: number; unitPrice: number }[];
      notes?: string;
      currency?: string;
    }
  ): Promise<ApiResponse<TransactionOrderItem>> {
    return this.request<TransactionOrderItem>(`/v1/transactions/businesses/${businessId}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessOrders(businessId: string): Promise<ApiResponse<TransactionOrderItem[]>> {
    return this.request<TransactionOrderItem[]>(`/v1/transactions/businesses/${businessId}/orders`);
  }

  public async updateOrderStatus(
    businessId: string,
    orderId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  ): Promise<ApiResponse<TransactionOrderItem>> {
    return this.request<TransactionOrderItem>(`/v1/transactions/businesses/${businessId}/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async getMyOrders(): Promise<ApiResponse<TransactionOrderItem[]>> {
    return this.request<TransactionOrderItem[]>('/v1/transactions/my/orders');
  }

  // ---------------- PHASE 7: FULFILLMENT & PAYMENT BOUNDARY ----------------

  public async createFulfillment(
    businessId: string,
    data: {
      orderId?: string | null;
      bookingId?: string | null;
      mode?: string;
      notes?: string | null;
    }
  ): Promise<ApiResponse<FulfillmentItem>> {
    return this.request<FulfillmentItem>(`/v1/fulfillment/fulfillments/business/${businessId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateFulfillmentStatus(
    businessId: string,
    id: string,
    status: string
  ): Promise<ApiResponse<FulfillmentItem>> {
    return this.request<FulfillmentItem>(`/v1/fulfillment/fulfillments/business/${businessId}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async verifyProofOfDelivery(
    businessId: string,
    id: string,
    otpCode: string
  ): Promise<ApiResponse<FulfillmentItem>> {
    return this.request<FulfillmentItem>(`/v1/fulfillment/fulfillments/business/${businessId}/${id}/proof`, {
      method: 'POST',
      body: JSON.stringify({ otpCode }),
    });
  }

  public async getBusinessFulfillments(businessId: string): Promise<ApiResponse<FulfillmentItem[]>> {
    return this.request<FulfillmentItem[]>(`/v1/fulfillment/fulfillments/business/${businessId}`);
  }

  public async createPaymentRecord(
    businessId: string,
    data: {
      orderId?: string | null;
      bookingId?: string | null;
      amount: number;
      currency?: string;
      method?: string;
      referenceNumber?: string | null;
      notes?: string | null;
    }
  ): Promise<ApiResponse<PaymentRecordItem>> {
    return this.request<PaymentRecordItem>(`/v1/fulfillment/payments/business/${businessId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updatePaymentStatus(
    businessId: string,
    id: string,
    status: string
  ): Promise<ApiResponse<PaymentRecordItem>> {
    return this.request<PaymentRecordItem>(`/v1/fulfillment/payments/business/${businessId}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async getBusinessPaymentRecords(businessId: string): Promise<ApiResponse<PaymentRecordItem[]>> {
    return this.request<PaymentRecordItem[]>(`/v1/fulfillment/payments/business/${businessId}`);
  }

  public async getNotifications(params?: { page?: number; limit?: number; isRead?: boolean }): Promise<ApiResponse<NotificationApiItem[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.isRead !== undefined) query.append('isRead', String(params.isRead));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<NotificationApiItem[]>(`/v1/notifications${queryString}`);
  }

  public async getUnreadNotificationCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.request<{ unreadCount: number }>('/v1/notifications/unread-count');
  }

  public async markNotificationRead(id: string): Promise<ApiResponse<NotificationApiItem>> {
    return this.request<NotificationApiItem>(`/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public async markAllNotificationsRead(): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/v1/notifications/read-all', {
      method: 'POST',
    });
  }

  public async deleteNotification(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<{ deleted: boolean }>(`/v1/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

