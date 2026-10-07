/**
 * Core domain-independent search types for WAYNAH Discovery & Search Subsystem.
 */

export type SearchEntityType = 'PLACE' | 'BUSINESS' | 'SERVICE_ITEM' | 'PRODUCT';

export interface SearchQueryParams {
  query?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  governorateId?: string;
  districtId?: string;
  categoryId?: string;
  entityTypes?: SearchEntityType[];
  limit?: number;
  offset?: number;
}

export interface SearchTrustMetadata {
  verificationStatus?: string | null;
  isVerified?: boolean;
  trustScore?: number | null;
}

export interface SearchMatchResult<T = unknown> {
  id: string;
  entityType: SearchEntityType;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  categoryId?: string | null;
  districtId?: string | null;
  governorateId?: string | null;
  distanceMeters?: number | null;
  textScore: number;
  distanceScore: number;
  relevancyScore: number;
  trustMetadata?: SearchTrustMetadata;
  rawItem?: T;
}

export interface UnifiedDiscoveryResultData {
  query?: string;
  total: number;
  placesCount: number;
  businessesCount: number;
  productsCount: number;
  servicesCount: number;
  results: SearchMatchResult[];
}

export interface GeographicBounds {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AdministrativeFilterCriteria {
  governorateId?: string;
  districtId?: string;
}

export interface CategoryFilterCriteria {
  categoryId?: string;
}

export interface PaginationCriteria {
  limit: number;
  offset: number;
}
