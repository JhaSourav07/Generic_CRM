import { PrismaClient, Prisma, LeadStatus } from '@prisma/client';
import { GetLeadsQuery, CreateLeadInput, UpdateLeadInput, ConvertLeadInput } from './leads.validation.js';
import { AppError } from '../../middleware/errorHandler.js';
import { notificationsService } from '../notifications/notifications.service.js';

const prisma = new PrismaClient();

export class LeadsService {
  /**
   * List organization leads with server-side pagination, multi-field search, filtering, and sorting.
   */
  public async getLeads(organizationId: string, query: Partial<GetLeadsQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.LeadWhereInput = {
      organizationId,
      deletedAt: null
    };

    // 1. Search across firstName, lastName, email, company, phone
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // 2. Filters
    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.source) {
      whereClause.source = { equals: query.source, mode: 'insensitive' };
    }

    if (query.ownerId) {
      whereClause.ownerId = query.ownerId;
    }

    if (query.minScore !== undefined || query.maxScore !== undefined) {
      whereClause.score = {
        ...(query.minScore !== undefined ? { gte: query.minScore } : {}),
        ...(query.maxScore !== undefined ? { lte: query.maxScore } : {})
      };
    }

    // 3. Sorting
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where: whereClause }),
      prisma.lead.findMany({
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
          convertedAccount: {
            select: {
              id: true,
              name: true
            }
          },
          convertedContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    return {
      leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single lead by ID within organization scope.
   */
  public async getLeadById(organizationId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
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
        convertedAccount: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            industry: true
          }
        },
        convertedContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true
          }
        }
      }
    });

    if (!lead) {
      const error: AppError = new Error('Lead not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return lead;
  }

  /**
   * Create a new lead with duplicate protection and tenant owner verification.
   */
  public async createLead(organizationId: string, currentUserId: string, input: CreateLeadInput) {
    // 1. Duplicate Lead Protection
    if (input.email && input.email.trim() !== '') {
      const existingEmail = await prisma.lead.findFirst({
        where: {
          organizationId,
          email: { equals: input.email.trim(), mode: 'insensitive' },
          deletedAt: null
        }
      });

      if (existingEmail) {
        const error: AppError = new Error(`Potential duplicate lead already exists with email '${input.email}'`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_LEAD';
        throw error;
      }
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

    // 3. Persist Lead
    const lead = await prisma.lead.create({
      data: {
        organizationId,
        ownerId: input.ownerId || null,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email && input.email.trim() !== '' ? input.email.trim() : null,
        phone: input.phone || null,
        company: input.company || null,
        jobTitle: input.jobTitle || null,
        source: input.source || null,
        status: input.status || LeadStatus.NEW,
        score: input.score ?? 0,
        notes: input.notes || null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 4. Record Audit Event
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'LEAD_CREATED',
        entity: 'Lead',
        entityId: lead.id,
        newValue: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          company: lead.company,
          status: lead.status,
          ownerId: lead.ownerId
        }
      }
    });

    return lead;
  }

  /**
   * Update an existing lead.
   */
  public async updateLead(organizationId: string, currentUserId: string, leadId: string, input: UpdateLeadInput) {
    const existing = await this.getLeadById(organizationId, leadId);

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

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.email !== undefined ? { email: input.email && input.email.trim() !== '' ? input.email.trim() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.company !== undefined ? { company: input.company || null } : {}),
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle || null } : {}),
        ...(input.source !== undefined ? { source: input.source || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId || null } : {})
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        convertedAccount: { select: { id: true, name: true } },
        convertedContact: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'LEAD_UPDATED',
        entity: 'Lead',
        entityId: leadId,
        oldValue: { status: existing.status, ownerId: existing.ownerId, company: existing.company },
        newValue: { status: updated.status, ownerId: updated.ownerId, company: updated.company }
      }
    });

    return updated;
  }

  /**
   * Assign lead to a tenant team member.
   */
  public async assignLead(organizationId: string, currentUserId: string, leadId: string, ownerId: string) {
    const lead = await this.getLeadById(organizationId, leadId);

    const owner = await prisma.user.findFirst({
      where: { id: ownerId, organizationId, isActive: true }
    });

    if (!owner) {
      const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
      error.statusCode = 400;
      error.code = 'INVALID_OWNER';
      throw error;
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'LEAD_ASSIGNED',
        entity: 'Lead',
        entityId: leadId,
        oldValue: { ownerId: lead.ownerId },
        newValue: { ownerId: owner.id, ownerName: owner.name }
      }
    });

    await notificationsService.createNotification({
      organizationId,
      userId: ownerId,
      type: 'LEAD_ASSIGNED',
      title: 'Lead Assigned',
      message: `Lead ${lead.firstName} ${lead.lastName} has been assigned to you.`
    });

    return updated;
  }

  /**
   * Update lead lifecycle status with transition controls.
   */
  public async changeLeadStatus(organizationId: string, currentUserId: string, leadId: string, newStatus: LeadStatus) {
    const lead = await this.getLeadById(organizationId, leadId);

    if (lead.status === LeadStatus.CONVERTED && newStatus !== LeadStatus.CONVERTED) {
      const error: AppError = new Error('Converted leads cannot be reverted to un-converted status');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'LEAD_STATUS_CHANGED',
        entity: 'Lead',
        entityId: leadId,
        oldValue: { status: lead.status },
        newValue: { status: newStatus }
      }
    });

    return updated;
  }

  /**
   * Soft delete a lead record.
   */
  public async deleteLead(organizationId: string, currentUserId: string, leadId: string) {
    const lead = await this.getLeadById(organizationId, leadId);

    await prisma.lead.update({
      where: { id: leadId },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'LEAD_DELETED',
        entity: 'Lead',
        entityId: leadId,
        oldValue: { firstName: lead.firstName, lastName: lead.lastName, email: lead.email }
      }
    });

    return { success: true, message: 'Lead soft-deleted successfully' };
  }

  /**
   * Execute ATOMIC Lead Conversion transaction into Account, Contact, and optional Opportunity.
   */
  public async convertLead(organizationId: string, currentUserId: string, leadId: string, input: Partial<ConvertLeadInput> = {}) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch Lead in tenant scope
      const lead = await tx.lead.findFirst({
        where: { id: leadId, organizationId, deletedAt: null }
      });

      if (!lead) {
        const error: AppError = new Error('Lead not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // 2. Prevent Double Conversion
      if (lead.status === LeadStatus.CONVERTED || lead.convertedAt !== null) {
        const error: AppError = new Error('Lead has already been converted');
        error.statusCode = 409;
        error.code = 'ALREADY_CONVERTED';
        throw error;
      }

      // 3. Resolve or Create Account (Customer)
      let accountId: string;
      const accountName = input.account?.name?.trim() || lead.company?.trim() || `${lead.firstName} ${lead.lastName} Account`;

      const existingAccount = await tx.account.findFirst({
        where: {
          organizationId,
          name: { equals: accountName, mode: 'insensitive' },
          deletedAt: null
        }
      });

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const newAccount = await tx.account.create({
          data: {
            organizationId,
            ownerId: lead.ownerId || currentUserId,
            name: accountName,
            industry: input.account?.industry || null,
            website: input.account?.website || null,
            email: input.account?.email || lead.email || null,
            phone: input.account?.phone || lead.phone || null,
            address: input.account?.address || null,
            city: input.account?.city || null,
            state: input.account?.state || null,
            country: input.account?.country || null,
            postalCode: input.account?.postalCode || null,
            status: 'ACTIVE'
          }
        });
        accountId = newAccount.id;
      }

      // 4. Resolve or Create Contact
      let contactId: string;
      const contactFirstName = input.contact?.firstName?.trim() || lead.firstName;
      const contactLastName = input.contact?.lastName?.trim() || lead.lastName;
      const contactEmail = input.contact?.email?.trim() || lead.email || null;

      const existingContact = contactEmail
        ? await tx.contact.findFirst({
            where: {
              organizationId,
              email: { equals: contactEmail, mode: 'insensitive' },
              deletedAt: null
            }
          })
        : null;

      if (existingContact) {
        contactId = existingContact.id;
        if (!existingContact.accountId) {
          await tx.contact.update({
            where: { id: contactId },
            data: { accountId }
          });
        }
      } else {
        const newContact = await tx.contact.create({
          data: {
            organizationId,
            accountId,
            firstName: contactFirstName,
            lastName: contactLastName,
            email: contactEmail,
            phone: input.contact?.phone || lead.phone || null,
            jobTitle: input.contact?.jobTitle || lead.jobTitle || null
          }
        });
        contactId = newContact.id;
      }

      // 5. Optional Opportunity Creation
      let opportunityId: string | undefined;
      if (input.createOpportunity) {
        let pipelineId = input.opportunity?.pipelineId;
        let stageId = input.opportunity?.stageId;

        if (!pipelineId || !stageId) {
          const defaultPipeline = await tx.pipeline.findFirst({
            where: { organizationId, isDefault: true },
            include: { stages: { orderBy: { order: 'asc' } } }
          });

          if (defaultPipeline && defaultPipeline.stages.length > 0) {
            pipelineId = defaultPipeline.id;
            stageId = defaultPipeline.stages[0].id;
          } else {
            const anyPipeline = await tx.pipeline.findFirst({
              where: { organizationId },
              include: { stages: { orderBy: { order: 'asc' } } }
            });

            if (!anyPipeline || anyPipeline.stages.length === 0) {
              const error: AppError = new Error('No valid sales pipeline or stage available for opportunity creation');
              error.statusCode = 400;
              error.code = 'PIPELINE_NOT_FOUND';
              throw error;
            }

            pipelineId = anyPipeline.id;
            stageId = anyPipeline.stages[0].id;
          }
        } else {
          // Verify provided pipeline and stage belong to tenant
          const validStage = await tx.pipelineStage.findFirst({
            where: {
              id: stageId,
              pipeline: {
                id: pipelineId,
                organizationId
              }
            }
          });

          if (!validStage) {
            const error: AppError = new Error('Invalid pipeline or stage for this organization');
            error.statusCode = 400;
            error.code = 'INVALID_PIPELINE_STAGE';
            throw error;
          }
        }

        const oppName = input.opportunity?.name?.trim() || `${accountName} Deal`;
        const oppValue = input.opportunity?.value ?? 0;
        const expectedCloseDate = input.opportunity?.expectedCloseDate ? new Date(input.opportunity.expectedCloseDate) : null;

        const newOpp = await tx.opportunity.create({
          data: {
            organizationId,
            accountId,
            contactId,
            ownerId: lead.ownerId || currentUserId,
            pipelineId,
            stageId,
            name: oppName,
            value: oppValue,
            expectedCloseDate
          }
        });
        opportunityId = newOpp.id;
      }

      // 6. Update Lead to CONVERTED
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedAccountId: accountId,
          convertedContactId: contactId
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          convertedAccount: true,
          convertedContact: true
        }
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'LEAD_CONVERTED',
          entity: 'Lead',
          entityId: leadId,
          newValue: {
            status: 'CONVERTED',
            accountId,
            contactId,
            opportunityId
          }
        }
      });

      return {
        lead: updatedLead,
        accountId,
        contactId,
        opportunityId
      };
    });
  }
}

export const leadsService = new LeadsService();
