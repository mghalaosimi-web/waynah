import { describe, it, expect } from 'vitest';
import {
  normalizeSearchQueryParams,
  extractGeographicBounds,
  extractAdministrativeFilters,
  extractPaginationCriteria,
} from '../src/filters/query-builder.js';

describe('@waynah/search — Search Filter Helpers Engine', () => {
  it('1. Normalizes valid search query parameters', () => {
    const raw = {
      query: '  صيدلية  ',
      lat: 16.01,
      lng: 43.1,
      radiusMeters: 10000,
      governorateId: 'gov-hajjah',
      districtId: 'dist-abs',
      limit: 15,
      offset: 0,
    };

    const normalized = normalizeSearchQueryParams(raw);

    expect(normalized.query).toBe('صيدلية');
    expect(normalized.lat).toBe(16.01);
    expect(normalized.lng).toBe(43.1);
    expect(normalized.radiusMeters).toBe(10000);
    expect(normalized.governorateId).toBe('gov-hajjah');
    expect(normalized.districtId).toBe('dist-abs');
    expect(normalized.limit).toBe(15);
    expect(normalized.offset).toBe(0);
  });

  it('2. Enforces pagination limits (max 50, min 1)', () => {
    const overLimit = normalizeSearchQueryParams({ limit: 100 });
    expect(overLimit.limit).toBe(50);

    const underLimit = normalizeSearchQueryParams({ limit: -5 });
    expect(underLimit.limit).toBe(20); // Default
  });

  it('3. Extracts geographic bounds for valid coordinates', () => {
    const params = normalizeSearchQueryParams({ lat: 15.69, lng: 43.6, radiusMeters: 3000 });
    const bounds = extractGeographicBounds(params);

    expect(bounds).not.toBeNull();
    expect(bounds?.latitude).toBe(15.69);
    expect(bounds?.longitude).toBe(43.6);
    expect(bounds?.radiusMeters).toBe(3000);
  });

  it('4. Returns null for invalid latitude/longitude', () => {
    const params = normalizeSearchQueryParams({ lat: 1000, lng: 43.6 });
    const bounds = extractGeographicBounds(params);
    expect(bounds).toBeNull();
  });

  it('5. Extracts administrative filters correctly', () => {
    const params = normalizeSearchQueryParams({ governorateId: 'gov-hajjah', districtId: 'dist-abs' });
    const adminFilters = extractAdministrativeFilters(params);

    expect(adminFilters.governorateId).toBe('gov-hajjah');
    expect(adminFilters.districtId).toBe('dist-abs');
  });

  it('6. Extracts pagination criteria correctly', () => {
    const params = normalizeSearchQueryParams({ limit: 25, offset: 50 });
    const pagination = extractPaginationCriteria(params);

    expect(pagination.limit).toBe(25);
    expect(pagination.offset).toBe(50);
  });
});
