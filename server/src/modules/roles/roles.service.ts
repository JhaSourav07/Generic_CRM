import { PrismaClient, Prisma, Permission } from '@prisma/client';
import { CreateRoleInput, UpdateRoleInput } from './roles.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export type RoleWithDetails = Prisma.RoleGetPayload<{
  include: {
    _count: {
      select: { users: true };
    };
    rolePermissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  userCount: number;
  permissionCount: number;
  organizationId: string | null;
}

export interface PermissionDetail {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  userCount: number;
  organizationId: string | null;
  permissions: PermissionDetail[];
}

export interface GroupedPermission {
  resource: string;
  actions: Array<{
    id: string;
    action: string;
    description?: string | null;
  }>;
}

export class RolesService {
  /**
   * List all system & organization custom roles with assigned user counts
   */
  public async getRoles(organizationId: string): Promise<RoleListItem[]> {
    const roles: RoleWithDetails[] = await prisma.role.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null } // System roles
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true }
        },
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return roles.map((role: RoleWithDetails): RoleListItem => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.organizationId === null,
      userCount: role._count.users,
      permissionCount: role.rolePermissions.length,
      organizationId: role.organizationId
    }));
  }

  /**
   * Get single role details with full permission list
   */
  public async getRoleById(organizationId: string, roleId: string): Promise<RoleDetail> {
    const role: RoleWithDetails | null = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [{ organizationId }, { organizationId: null }]
      },
      include: {
        _count: {
          select: { users: true }
        },
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      const error: AppError = new Error('Role not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.organizationId === null,
      userCount: role._count.users,
      organizationId: role.organizationId,
      permissions: role.rolePermissions.map((rp: RoleWithDetails['rolePermissions'][number]): PermissionDetail => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      }))
    };
  }

  /**
   * Create custom organization role atomically inside Prisma transaction
   */
  public async createRole(
    organizationId: string,
    currentUserId: string,
    input: CreateRoleInput
  ): Promise<RoleDetail> {
    const roleName = input.name.trim();

    // Check duplicate role name within organization
    const existing = await prisma.role.findFirst({
      where: { organizationId, name: roleName }
    });

    if (existing) {
      const error: AppError = new Error('A role with this name already exists in your organization');
      error.statusCode = 409;
      error.code = 'DUPLICATE_ROLE_NAME';
      throw error;
    }

    // Atomic transaction for Role + RolePermission creation
    const newRole = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const role = await tx.role.create({
        data: {
          organizationId,
          name: roleName,
          description: input.description?.trim() || null
        }
      });

      if (input.permissionIds && input.permissionIds.length > 0) {
        // Verify valid permissions
        const validPerms = await tx.permission.findMany({
          where: { id: { in: input.permissionIds } },
          select: { id: true }
        });

        const rolePermData = validPerms.map((p: { id: string }) => ({
          roleId: role.id,
          permissionId: p.id
        }));

        if (rolePermData.length > 0) {
          await tx.rolePermission.createMany({
            data: rolePermData
          });
        }
      }

      return role;
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'ROLE_CREATED',
        entity: 'Role',
        entityId: newRole.id,
        newValue: { name: newRole.name, permissionCount: input.permissionIds?.length || 0 }
      }
    });

    return this.getRoleById(organizationId, newRole.id);
  }

  /**
   * Update custom organization role & permissions atomically inside Prisma transaction
   */
  public async updateRole(
    organizationId: string,
    currentUserId: string,
    roleId: string,
    input: UpdateRoleInput
  ): Promise<RoleDetail> {
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId }
    });

    if (!role) {
      const error: AppError = new Error('Role not found or is a system role that cannot be edited');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // System role protection
    if (role.organizationId === null) {
      const error: AppError = new Error('System-level roles cannot be modified');
      error.statusCode = 403;
      error.code = 'SYSTEM_ROLE_PROTECTED';
      throw error;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update basic fields if provided
      if (input.name || input.description !== undefined) {
        await tx.role.update({
          where: { id: roleId },
          data: {
            ...(input.name ? { name: input.name.trim() } : {}),
            ...(input.description !== undefined ? { description: input.description?.trim() || null } : {})
          }
        });
      }

      // 2. Replace permissions atomically if provided
      if (input.permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        if (input.permissionIds.length > 0) {
          const validPerms = await tx.permission.findMany({
            where: { id: { in: input.permissionIds } },
            select: { id: true }
          });

          await tx.rolePermission.createMany({
            data: validPerms.map((p: { id: string }) => ({
              roleId,
              permissionId: p.id
            }))
          });
        }
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'ROLE_UPDATED',
        entity: 'Role',
        entityId: roleId,
        newValue: { name: input.name || role.name, permissionCount: input.permissionIds?.length }
      }
    });

    return this.getRoleById(organizationId, roleId);
  }

  /**
   * Delete custom role with user assignment safety check
   */
  public async deleteRole(organizationId: string, currentUserId: string, roleId: string): Promise<void> {
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [{ organizationId }, { organizationId: null }]
      },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!role) {
      const error: AppError = new Error('Role not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // System role protection
    if (role.organizationId === null) {
      const error: AppError = new Error('System-level roles cannot be deleted');
      error.statusCode = 403;
      error.code = 'SYSTEM_ROLE_PROTECTED';
      throw error;
    }

    // Active user assignment check
    if (role._count.users > 0) {
      const error: AppError = new Error(
        `Cannot delete role because ${role._count.users} active user(s) are assigned to it. Please reassign users first.`
      );
      error.statusCode = 400;
      error.code = 'ROLE_IN_USE';
      throw error;
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'ROLE_DELETED',
        entity: 'Role',
        entityId: roleId,
        oldValue: { name: role.name }
      }
    });
  }

  /**
   * Get all system permissions
   */
  public async getPermissions(): Promise<PermissionDetail[]> {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });

    return permissions.map((p: Permission): PermissionDetail => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description
    }));
  }
}

export const rolesService = new RolesService();
