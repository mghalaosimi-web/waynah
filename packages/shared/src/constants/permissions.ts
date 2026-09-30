/**
 * WAYNAH Naming Convention & Constants for Authorization Permissions
 *
 * Pattern: <domain>.<action>
 */

export const PERMISSIONS = {
  // Discovery & Ingestion
  DISCOVERY_INGEST: 'discovery.ingest',

  // Places
  PLACE_READ: 'place.read',
  PLACE_CREATE: 'place.create',
  PLACE_UPDATE: 'place.update',
  PLACE_DELETE: 'place.delete',

  // Business
  BUSINESS_READ: 'business.read',
  BUSINESS_MANAGE: 'business.manage',
  BUSINESS_VERIFICATION_READ: 'business.verification.read',
  BUSINESS_VERIFICATION_SUBMIT: 'business.verification.submit',

  // Services
  SERVICE_READ: 'service.read',
  SERVICE_MANAGE: 'service.manage',

  // Users
  USER_READ: 'user.read',
  USER_MANAGE: 'user.manage',

  // Favorites
  FAVORITE_READ: 'favorite.read',
  FAVORITE_MANAGE: 'favorite.manage',

  // Requests
  REQUEST_READ: 'request.read',
  REQUEST_CREATE: 'request.create',

  // Admin & Governance
  ADMIN_CONFLICTS_READ: 'admin.conflicts.read',
  ADMIN_PLACES_HISTORY_READ: 'admin.places.history.read',
  ADMIN_USERS_MANAGE: 'admin.users.manage',
  ADMIN_VERIFICATION_READ: 'admin.verification.read',
  ADMIN_VERIFICATION_REVIEW: 'admin.verification.review',

  // Geography (read-only public reference data)
  GEOGRAPHY_READ: 'geography.read',
  // Admin-only geographic import (never exposed publicly)
  ADMIN_GEOGRAPHY_IMPORT: 'admin.geography.import',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
