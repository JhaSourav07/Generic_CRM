import { PrismaClient, Prisma } from '@prisma/client';
import { GetContactsQuery, CreateContactInput, UpdateContactInput } from './contacts.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class ContactsService {
  /**
   * List organization contacts with server-side pagination, search, and filtering.
   */
  public async getContacts(organizationId: string, query: Partial<GetContactsQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null
    };

    // 1. Search across firstName, lastName, email, phone, jobTitle, department
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      const parts = searchTerm.split(' ').filter(p => p.length > 0);

      if (parts.length >= 2) {
        whereClause.OR = [
          {
            AND: [
              { firstName: { contains: parts[0], mode: 'insensitive' } },
              { lastName: { contains: parts[1], mode: 'insensitive' } }
            ]
          },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { jobTitle: { contains: searchTerm, mode: 'insensitive' } }
        ];
      } else {
        whereClause.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }
    }

    // 2. Filters
    if (query.accountId) {
      whereClause.accountId = query.accountId;
    }

    if (query.jobTitle) {
      whereClause.jobTitle = { equals: query.jobTitle, mode: 'insensitive' };
    }

    // 3. Sorting
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where: whereClause }),
      prisma.contact.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              industry: true,
              email: true
            }
          }
        }
      })
    ]);

    return {
      contacts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single Contact by ID in tenant scope.
   */
  public async getContactById(organizationId: string, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
        deletedAt: null
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
            email: true,
            phone: true
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

    if (!contact) {
      const error: AppError = new Error('Contact not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return contact;
  }

  /**
   * Create a new Contact record with strict cross-tenant account verification.
   */
  public async createContact(organizationId: string, currentUserId: string, input: CreateContactInput) {
    // 1. Cross-Tenant Account Attack Prevention
    if (input.accountId && input.accountId.trim() !== '') {
      const targetAccount = await prisma.account.findFirst({
        where: {
          id: input.accountId,
          organizationId,
          deletedAt: null
        }
      });

      if (!targetAccount) {
        const error: AppError = new Error('Target customer account does not exist in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_ACCOUNT';
        throw error;
      }
    }

    // 2. Duplicate Check on Email within Tenant
    if (input.email && input.email.trim() !== '') {
      const existingEmail = await prisma.contact.findFirst({
        where: {
          organizationId,
          email: { equals: input.email.trim(), mode: 'insensitive' },
          deletedAt: null
        }
      });

      if (existingEmail) {
        const error: AppError = new Error(`Potential duplicate contact already exists with email '${input.email}'`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_CONTACT';
        throw error;
      }
    }

    // 3. Persist Contact
    const contact = await prisma.contact.create({
      data: {
        organizationId,
        accountId: input.accountId && input.accountId.trim() !== '' ? input.accountId : null,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email && input.email.trim() !== '' ? input.email.trim() : null,
        phone: input.phone || null,
        jobTitle: input.jobTitle || null,
        department: input.department || null,
        isPrimary: input.isPrimary ?? false,
        notes: input.notes || null
      },
      include: {
        account: { select: { id: true, name: true } }
      }
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CONTACT_CREATED',
        entity: 'Contact',
        entityId: contact.id,
        newValue: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          accountId: contact.accountId
        }
      }
    });

    return contact;
  }

  /**
   * Update an existing Contact record with cross-tenant account verification.
   */
  public async updateContact(organizationId: string, currentUserId: string, contactId: string, input: UpdateContactInput) {
    const existing = await this.getContactById(organizationId, contactId);

    // Cross-Tenant Account Attack Prevention on Update
    if (input.accountId && input.accountId !== existing.accountId) {
      const targetAccount = await prisma.account.findFirst({
        where: {
          id: input.accountId,
          organizationId,
          deletedAt: null
        }
      });

      if (!targetAccount) {
        const error: AppError = new Error('Target customer account does not exist in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_ACCOUNT';
        throw error;
      }
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email && input.email.trim() !== '' ? input.email.trim() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle || null } : {}),
        ...(input.department !== undefined ? { department: input.department || null } : {}),
        ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId && input.accountId.trim() !== '' ? input.accountId : null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {})
      },
      include: {
        account: { select: { id: true, name: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CONTACT_UPDATED',
        entity: 'Contact',
        entityId: contactId,
        oldValue: { firstName: existing.firstName, lastName: existing.lastName, accountId: existing.accountId },
        newValue: { firstName: updated.firstName, lastName: updated.lastName, accountId: updated.accountId }
      }
    });

    return updated;
  }

  /**
   * Soft delete a Contact record.
   */
  public async deleteContact(organizationId: string, currentUserId: string, contactId: string) {
    const contact = await this.getContactById(organizationId, contactId);

    await prisma.contact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'CONTACT_DELETED',
        entity: 'Contact',
        entityId: contactId,
        oldValue: { firstName: contact.firstName, lastName: contact.lastName, email: contact.email }
      }
    });

    return { success: true, message: 'Contact soft-deleted successfully' };
  }
}

export const contactsService = new ContactsService();
