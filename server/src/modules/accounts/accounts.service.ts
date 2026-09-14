import { PrismaClient, Prisma } from '@prisma/client';
import { GetAccountsQuery, CreateAccountInput, UpdateAccountInput } from './accounts.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class AccountsService {
  /**
   * List organization accounts with server-side pagination, search, filtering, and relation counts.
   */
  public async getAccounts(organizationId: string, query: Partial<GetAccountsQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.AccountWhereInput = {
      organizationId,
      deletedAt: null
    };

    // 1. Search across name, email, phone, website, industry, city
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { website: { contains: searchTerm, mode: 'insensitive' } },
        { industry: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // 2. Filters
    if (query.industry) {
      whereClause.industry = { equals: query.industry, mode: 'insensitive' };
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.ownerId) {
      whereClause.ownerId = query.ownerId;
    }

    // 3. Sorting
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, accounts] = await Promise.all([
      prisma.account.count({ where: whereClause }),
      prisma.account.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          _count: {
            select: {
              contacts: {
                where: { deletedAt: null }
              },
              opportunities: {
                where: { deletedAt: null }
              }
            }
          }
        }
      })
    ]);

    return {
      accounts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single Account / Customer by ID within tenant scope.
   */
  public async getAccountById(organizationId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        organizationId,
        deletedAt: null
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        contacts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            stage: true
          }
        },
        convertedFromLeads: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            convertedAt: true
          }
        }
      }
    });

    if (!account) {
      const error: AppError = new Error('Customer account not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return account;
  }

  /**
   * Create a new Customer / Account record with duplicate protection.
   */
  public async createAccount(organizationId: string, currentUserId: string, input: CreateAccountInput) {
    // 1. Duplicate check
    const existingName = await prisma.account.findFirst({
      where: {
        organizationId,
        name: { equals: input.name.trim(), mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existingName) {
      const error: AppError = new Error(`Potential duplicate customer account already exists with name '${input.name}'`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_ACCOUNT';
      throw error;
    }

    // 2. Validate ownerId if provided
    if (input.ownerId) {
      const owner = await prisma.user.findFirst({
        where: {
          id: input.ownerId,
          organizationId,
          isActive: true
        }
      });

      if (!owner) {
        const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_OWNER';
        throw error;
      }
    }

    // 3. Persist Account
    const account = await prisma.account.create({
      data: {
        organizationId,
        ownerId: input.ownerId || currentUserId,
        name: input.name.trim(),
        industry: input.industry || null,
        website: input.website || null,
        email: input.email && input.email.trim() !== '' ? input.email.trim() : null,
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        country: input.country || null,
        postalCode: input.postalCode || null,
        status: input.status || 'ACTIVE',
        notes: input.notes || null
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CUSTOMER_CREATED',
        entity: 'Account',
        entityId: account.id,
        newValue: {
          name: account.name,
          email: account.email,
          industry: account.industry,
          ownerId: account.ownerId
        }
      }
    });

    return account;
  }

  /**
   * Update an existing Customer / Account.
   */
  public async updateAccount(organizationId: string, currentUserId: string, accountId: string, input: UpdateAccountInput) {
    const existing = await this.getAccountById(organizationId, accountId);

    if (input.ownerId && input.ownerId !== existing.ownerId) {
      const owner = await prisma.user.findFirst({
        where: { id: input.ownerId, organizationId, isActive: true }
      });
      if (!owner) {
        const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_OWNER';
        throw error;
      }
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.industry !== undefined ? { industry: input.industry || null } : {}),
        ...(input.website !== undefined ? { website: input.website || null } : {}),
        ...(input.email !== undefined ? { email: input.email && input.email.trim() !== '' ? input.email.trim() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.address !== undefined ? { address: input.address || null } : {}),
        ...(input.city !== undefined ? { city: input.city || null } : {}),
        ...(input.state !== undefined ? { state: input.state || null } : {}),
        ...(input.country !== undefined ? { country: input.country || null } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId || null } : {})
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CUSTOMER_UPDATED',
        entity: 'Account',
        entityId: accountId,
        oldValue: { name: existing.name, ownerId: existing.ownerId, industry: existing.industry },
        newValue: { name: updated.name, ownerId: updated.ownerId, industry: updated.industry }
      }
    });

    return updated;
  }

  /**
   * Reassign Account owner.
   */
  public async assignAccount(organizationId: string, currentUserId: string, accountId: string, ownerId: string) {
    const account = await this.getAccountById(organizationId, accountId);

    const owner = await prisma.user.findFirst({
      where: { id: ownerId, organizationId, isActive: true }
    });

    if (!owner) {
      const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
      error.statusCode = 400;
      error.code = 'INVALID_OWNER';
      throw error;
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CUSTOMER_ASSIGNED',
        entity: 'Account',
        entityId: accountId,
        oldValue: { ownerId: account.ownerId },
        newValue: { ownerId: owner.id, ownerName: owner.name }
      }
    });

    return updated;
  }

  /**
   * Soft delete a customer account.
   */
  public async deleteAccount(organizationId: string, currentUserId: string, accountId: string) {
    const account = await this.getAccountById(organizationId, accountId);

    await prisma.account.update({
      where: { id: accountId },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CUSTOMER_DELETED',
        entity: 'Account',
        entityId: accountId,
        oldValue: { name: account.name, email: account.email }
      }
    });

    return { success: true, message: 'Customer account soft-deleted successfully' };
  }
}

export const accountsService = new AccountsService();
