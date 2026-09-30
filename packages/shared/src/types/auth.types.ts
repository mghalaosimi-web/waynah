/**
 * WAYNAH Identity & Authentication Types
 *
 * Provides central domain abstractions for Actor identities,
 * Types, and Roles across the WAYNAH platform.
 */

export type ActorType =
  | 'ANONYMOUS'
  | 'SYSTEM'
  | 'SERVICE'
  | 'USER'
  | 'BUSINESS_MEMBER'
  | 'ADMIN';

export type Role =
  | 'ANONYMOUS'
  | 'SYSTEM_SERVICE'
  | 'USER'
  | 'BUSINESS_OWNER'
  | 'BUSINESS_MEMBER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface Actor {
  id: string;
  type: ActorType;
  roles: (Role | string)[];
  permissions: string[];
}

export const ANONYMOUS_ACTOR: Actor = {
  id: 'anonymous',
  type: 'ANONYMOUS',
  roles: ['ANONYMOUS'],
  permissions: [],
};
