import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';


export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

/**
 * Checks if the given authentication context belongs to a Super Admin user
 * or matches the configured privileged admin credentials.
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
 * Validates if a user context has permission for a specific resource & action.
 * Super Admin returns `true` (unlimited system access).
 */
export async function hasPermission(
  context: AuthContext,
  resource: string,
  action: string
): Promise<boolean> {
  // 1. Super Admin bypass — unlimited platform access
  if (isSuperAdmin(context)) {
    return true;
  }

  // 2. Query user role permissions from PostgreSQL database
  const user = await prisma.user.findUnique({
    where: { id: context.userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive || !user.role) {
    return false;
  }

  if (user.role.name === SUPER_ADMIN_ROLE) {
    return true;
  }

  // 3. Match against role permissions
  const targetResource = resource.toLowerCase();
  const targetAction = action.toUpperCase();

  // Tenant admin role default permission for audit_logs
  if (targetResource === 'audit_logs' && targetAction === 'VIEW' && ['SUPER_ADMIN', 'SALES_MANAGER'].includes(user.role.name)) {
    return true;
  }

  const match = user.role.rolePermissions.some(
    (rp: { permission: { resource: string; action: string } }) =>
      rp.permission.resource.toLowerCase() === targetResource &&
      rp.permission.action.toUpperCase() === targetAction
  );

  return match;
}
