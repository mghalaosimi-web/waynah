'use client';

import React from 'react';
import { useAuth } from '../auth/auth-context';
import { can } from './permission-helper';

export interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { actor } = useAuth();
  const hasAccess = can(actor, permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export function usePermission(permission: string): boolean {
  const { actor } = useAuth();
  return can(actor, permission);
}
