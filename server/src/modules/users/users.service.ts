import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GetUsersQuery, CreateUserInput, UpdateUserInput } from './users.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    organization: true;
    role: true;
  };
}>;

export interface SafeUserDetail {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  roleId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
}

export class UsersService {
  /**
   * Format raw Prisma user into safe response envelope (strips passwordHash)
   */
  public sanitizeUser(user: UserWithRelations): SafeUserDetail {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      organizationId: user.organizationId,
      roleId: user.roleId || user.role?.id,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug
      },
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      }
    };
  }

  /**
   * List organization users with server-side pagination, search, and filtering
   */
  public async getUsers(organizationId: string, query: GetUsersQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.UserWhereInput = {
      organizationId
    };

    if (query.search) {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    if (query.roleId) {
      whereClause.roleId = query.roleId;
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    const [total, users]: [number, UserWithRelations[]] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          organization: true,
          role: true
        }
      })
    ]);

    const sanitizedUsers: SafeUserDetail[] = users.map((u: UserWithRelations): SafeUserDetail => this.sanitizeUser(u));

    return {
      users: sanitizedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single user by ID within tenant boundary
   */
  public async getUserById(organizationId: string, userId: string): Promise<SafeUserDetail> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: {
        organization: true,
        role: true
      }
    });

    if (!user) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Create new organization user
   */
  public async createUser(
    organizationId: string,
    currentUserId: string,
    input: CreateUserInput
  ): Promise<SafeUserDetail> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check unique email constraint within tenant
    const existing = await prisma.user.findFirst({
      where: { organizationId, email: normalizedEmail }
    });

    if (existing) {
      const error: AppError = new Error('A user with this email address already exists in your organization');
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // Verify role belongs to organization or is system role
    const role = await prisma.role.findFirst({
      where: {
        id: input.roleId,
        OR: [{ organizationId }, { organizationId: null }]
      }
    });

    if (!role) {
      const error: AppError = new Error('Selected role does not exist or belong to your organization');
      error.statusCode = 400;
      error.code = 'INVALID_ROLE';
      throw error;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const newUser = await prisma.user.create({
      data: {
        organizationId,
        roleId: role.id,
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        isActive: input.isActive ?? true
      },
      include: {
        organization: true,
        role: true
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: newUser.id,
        newValue: { name: newUser.name, email: newUser.email, roleName: role.name }
      }
    });

    return this.sanitizeUser(newUser);
  }

  /**
   * Update existing user details
   */
  public async updateUser(
    organizationId: string,
    currentUserId: string,
    targetUserId: string,
    input: UpdateUserInput
  ): Promise<SafeUserDetail> {
    const existingUser = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
      include: { role: true }
    });

    if (!existingUser) {
      const error: AppError = new Error('User not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updateData: Prisma.UserUncheckedUpdateInput = {};

    if (input.name) {
      updateData.name = input.name.trim();
    }

    if (input.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: input.roleId,
          OR: [{ organizationId }, { organizationId: null }]
        }
      });

      if (!role) {
        const error: AppError = new Error('Selected role is invalid or unauthorized');
        error.statusCode = 400;
        error.code = 'INVALID_ROLE';
        throw error;
      }
      updateData.roleId = role.id;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: {
        organization: true,
        role: true
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: targetUserId,
        oldValue: { name: existingUser.name, roleId: existingUser.roleId },
        newValue: { name: updated.name, roleId: updated.roleId }
      }
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Activate / Deactivate user status with Last Admin Protection Rule
   */
  public async toggleUserStatus(
    organizationId: string,
    currentUserId: string,
    targetUserId: string,
    isActive: boolean
  ): Promise<SafeUserDetail> {
    const existingUser = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
      include: { role: true }
    });

    if (!existingUser) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Last Admin Safety Rule: If deactivating an admin user, verify organization has another active admin
    if (!isActive && existingUser.isActive) {
      const isAdminRole = ['SUPER_ADMIN', 'SALES_MANAGER'].includes(existingUser.role.name);
      if (isAdminRole) {
        const activeAdminCount = await prisma.user.count({
          where: {
            organizationId,
            isActive: true,
            role: {
              name: { in: ['SUPER_ADMIN', 'SALES_MANAGER'] }
            }
          }
        });

        if (activeAdminCount <= 1) {
          const error: AppError = new Error(
            'Cannot deactivate the last active administrator of the organization. Please assign another administrator first.'
          );
          error.statusCode = 400;
          error.code = 'LAST_ADMIN_PROTECTION';
          throw error;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      include: {
        organization: true,
        role: true
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'USER_STATUS_CHANGED',
        entity: 'User',
        entityId: targetUserId,
        oldValue: { isActive: existingUser.isActive },
        newValue: { isActive: updated.isActive }
      }
    });

    return this.sanitizeUser(updated);
  }
}

export const usersService = new UsersService();
