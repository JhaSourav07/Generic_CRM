import { env } from '../config/env.js';

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

/**
  Checks if the given authentication context belongs to a Super Admin user
  or matches the configured privileged admin credentials.
 */
export function isSuperAdmin(context: AuthContext): boolean {
  if (context.role === SUPER_ADMIN_ROLE) {
    return true;
  }
  if (context.email && context.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return false;
}

/**
  Validates if a user context has permission for an action.
  Super Admin always returns `true` (unlimited system access across all resources/tenants).
 */
export function hasPermission(
  context: AuthContext,
  _requiredPermission: string
): boolean {
  // Super Admin bypass — unlimited system access
  if (isSuperAdmin(context)) {
    return true;
  }

  // Standard RBAC logic will be evaluated here in Phase 6
  return false;
}
