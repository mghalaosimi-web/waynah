import { type Actor } from '@waynah/shared';

/**
 * Client Permission Helper ("can")
 * Used exclusively for UI visibility, navigation rendering, and UX guidance.
 * Note: Real security enforcement occurs at the API Authorization layer.
 */
export function can(actor: Actor | null | undefined, requiredPermission: string): boolean {
  if (!actor || !actor.permissions) return false;
  if (actor.permissions.includes('*')) return true;
  if (actor.permissions.includes(requiredPermission)) return true;

  return actor.permissions.some((p) => {
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -1);
      return requiredPermission.startsWith(prefix);
    }
    return false;
  });
}
