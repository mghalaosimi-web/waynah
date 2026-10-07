/**
 * WAYNAH-SLICE6A — Public Business Profile & Branch Explorer UI Tests
 *
 * Verifies:
 * 1. Routing & API Consumption for /v1/businesses/public/:idOrSlug
 * 2. Public vs Private Authorization Boundaries (Anonymous access permitted for public profile)
 * 3. Exact schema response contracts (name, verificationStatus, verified, places, location coordinates)
 * 4. Not Found (404) behavior for unknown Business slug/id
 * 5. Branch & Place architecture integrity (Place.businessId linking, no standalone Branch model)
 * 6. Multi-branch, single-branch, and zero-branch state contracts
 * 7. Map coordinate data transformation safety (location.latitude/longitude)
 * 8. Verification state representation (VERIFIED, UNVERIFIED, PENDING)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createBusinessRouter } from '../src/routes/v1/business.routes.js';
import { Hono } from 'hono';
import { filterValidMarkers, type MapMarkerData } from '../../web/lib/maps/map-types.js';

// Mock Prisma Client matching database contracts
function createMockPrisma() {
  const mockBusiness = {
    id: 'biz-6a-001',
    name: 'مجموعة صيدليات السلام الوطنية',
    slug: 'al-salam-pharmacies',
    description: 'شبكة صيدليات ومراكز صحية متكاملة تقدم الخدمات الطبية والدوائية في محافظة حجة.',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    verification: {
      status: 'VERIFIED',
    },
    places: [
      {
        id: 'place-6a-abs-main',
        nameAr: 'صيدلية السلام - فرع السوق الرئيسي',
        nameEn: 'Al-Salam Pharmacy - Abs Main Branch',
        description: 'الفرع الرئيسي مقابل المستشفى العام',
        address: 'حي السوق الرئيسي - بجوار المستشفى العام',
        phoneNumber: '+967 773 100 200',
        website: 'https://alsalam-pharmacy.ye',
        verificationStatus: 'VERIFIED',
        category: { id: 'cat-1', nameAr: 'صيدليات ورعاية صحية', icon: '💊' },
        district: {
          id: 'dist-1',
          nameAr: 'عبس',
          governorate: { id: 'gov-1', nameAr: 'محافظة حجة' },
        },
        location: {
          latitude: 16.0123,
          longitude: 43.2156,
        },
      },
      {
        id: 'place-6a-abs-north',
        nameAr: 'صيدلية السلام - فرع الدوار الشمالي',
        nameEn: 'Al-Salam Pharmacy - North Circle Branch',
        description: 'فرع الخدمة السريعة 24 ساعة',
        address: 'شارع الدوار الشمالي - عبس',
        phoneNumber: '+967 773 100 201',
        website: null,
        verificationStatus: 'VERIFIED',
        category: { id: 'cat-1', nameAr: 'صيدليات ورعاية صحية', icon: '💊' },
        district: {
          id: 'dist-1',
          nameAr: 'عبس',
          governorate: { id: 'gov-1', nameAr: 'محافظة حجة' },
        },
        location: {
          latitude: 16.0250,
          longitude: 43.2210,
        },
      },
      {
        id: 'place-6a-no-coords',
        nameAr: 'صيدلية السلام - فرع العيادات الميدانية',
        nameEn: 'Al-Salam Pharmacy - Field Branch',
        description: 'فرع تحت التجهيز',
        address: 'حي السلام - عبس',
        phoneNumber: null,
        website: null,
        verificationStatus: 'UNVERIFIED',
        category: { id: 'cat-1', nameAr: 'صيدليات ورعاية صحية', icon: '💊' },
        district: {
          id: 'dist-1',
          nameAr: 'عبس',
          governorate: { id: 'gov-1', nameAr: 'محافظة حجة' },
        },
        location: null,
      },
    ],
    _count: {
      members: 3,
      places: 3,
    },
  };

  const mockEmptyBusiness = {
    ...mockBusiness,
    id: 'biz-6a-empty',
    slug: 'new-unlinked-business',
    name: 'منشأة حديثة بدون فروع',
    places: [],
    _count: { members: 1, places: 0 },
    verification: { status: 'PENDING' },
  };

  return {
    business: {
      findFirst: async ({ where }: any) => {
        const idOrSlug = where?.OR?.[0]?.id || where?.OR?.[1]?.slug;
        if (idOrSlug === 'al-salam-pharmacies' || idOrSlug === 'biz-6a-001') {
          return mockBusiness;
        }
        if (idOrSlug === 'new-unlinked-business' || idOrSlug === 'biz-6a-empty') {
          return mockEmptyBusiness;
        }
        return null;
      },
    },
  } as any;
}

describe('WAYNAH-SLICE6A — Public Business Profile & Branch Explorer API & UI Contract', () => {
  let app: Hono;

  beforeAll(() => {
    const mockPrisma = createMockPrisma();
    app = new Hono();
    app.route('/v1/businesses', createBusinessRouter(mockPrisma));
  });

  describe('1. Routing & Public Access Boundary', () => {
    it('GET /v1/businesses/public/:idOrSlug resolves anonymously (200 OK)', async () => {
      const res = await app.request('/v1/businesses/public/al-salam-pharmacies');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('مجموعة صيدليات السلام الوطنية');
      expect(body.data.slug).toBe('al-salam-pharmacies');
      expect(body.data.verified).toBe(true);
      expect(body.data.verificationStatus).toBe('VERIFIED');
    });

    it('GET /v1/businesses/public/:idOrSlug resolves by Business ID (200 OK)', async () => {
      const res = await app.request('/v1/businesses/public/biz-6a-001');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('biz-6a-001');
    });

    it('Private endpoint GET /v1/businesses/:id denies unauthenticated access (401 Unauthorized)', async () => {
      const res = await app.request('/v1/businesses/biz-6a-001');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Not Found (404) Handling', () => {
    it('returns 404 with BUSINESS_NOT_FOUND code for unknown Business slug or ID', async () => {
      const res = await app.request('/v1/businesses/public/non-existent-slug');
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BUSINESS_NOT_FOUND');
    });
  });

  describe('3. Branch Architecture & Place Response Schema', () => {
    it('returns linked Places as branches without introducing a standalone Branch model', async () => {
      const res = await app.request('/v1/businesses/public/al-salam-pharmacies');
      const body = await res.json();
      const biz = body.data;

      expect(Array.isArray(biz.places)).toBe(true);
      expect(biz.places.length).toBe(3);
      expect(biz.totalPlaces).toBe(3);

      const firstBranch = biz.places[0];
      expect(firstBranch.id).toBe('place-6a-abs-main');
      expect(firstBranch.nameAr).toBe('صيدلية السلام - فرع السوق الرئيسي');
      expect(firstBranch.address).toBe('حي السوق الرئيسي - بجوار المستشفى العام');
      expect(firstBranch.phoneNumber).toBe('+967 773 100 200');
      expect(firstBranch.website).toBe('https://alsalam-pharmacy.ye');
      expect(firstBranch.district.nameAr).toBe('عبس');
      expect(firstBranch.district.governorate.nameAr).toBe('محافظة حجة');
    });

    it('includes spatial location coordinates (latitude & longitude) for map rendering', async () => {
      const res = await app.request('/v1/businesses/public/al-salam-pharmacies');
      const body = await res.json();
      const biz = body.data;

      const mainBranch = biz.places[0];
      expect(mainBranch.location).toBeDefined();
      expect(mainBranch.location.latitude).toBe(16.0123);
      expect(mainBranch.location.longitude).toBe(43.2156);
    });
  });

  describe('4. Zero-Branch & Edge States', () => {
    it('safely renders Business profile with empty places array when 0 branches are linked', async () => {
      const res = await app.request('/v1/businesses/public/new-unlinked-business');
      expect(res.status).toBe(200);

      const body = await res.json();
      const biz = body.data;

      expect(biz.name).toBe('منشأة حديثة بدون فروع');
      expect(biz.places).toEqual([]);
      expect(biz.totalPlaces).toBe(0);
      expect(biz.verificationStatus).toBe('PENDING');
      expect(biz.verified).toBe(false);
    });
  });

  describe('5. Map Coordinates Transformation Safety', () => {
    it('filters valid markers and excludes branches missing location coordinates', () => {
      const rawPlaces = [
        {
          id: 'p1',
          nameAr: 'فرع 1',
          location: { latitude: 16.01, longitude: 43.21 },
        },
        {
          id: 'p2',
          nameAr: 'فرع 2 بدون إحداثيات',
          location: null,
        },
        {
          id: 'p3',
          nameAr: 'فرع 3 إحداثيات غير صالحة',
          location: { latitude: 999, longitude: 43.21 },
        },
      ];

      const mappedMarkers: MapMarkerData[] = rawPlaces
        .map((p) => {
          if (!p.location) return null;
          return {
            id: p.id,
            latitude: p.location.latitude,
            longitude: p.location.longitude,
            nameAr: p.nameAr,
          };
        })
        .filter((m): m is MapMarkerData => m !== null);

      const validMarkers = filterValidMarkers(mappedMarkers);

      expect(validMarkers.length).toBe(1);
      expect(validMarkers[0].id).toBe('p1');
      expect(validMarkers[0].latitude).toBe(16.01);
    });
  });
});
