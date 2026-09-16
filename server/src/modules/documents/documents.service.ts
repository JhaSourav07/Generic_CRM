import { prisma } from '../../config/prisma.js';
import { fileStorageService, FileStreamResult } from '../../storage/storage.service.js';
import { AuthContext } from '../../utils/rbac.js';
import { ListDocumentsQuery, UploadDocumentMetadata, UpdateDocumentInput } from './documents.validation.js';
import { assertCanModifyDocument } from '../../utils/auth-helpers.js';


interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export class DocumentsService {
  /**
   * List paginated documents within tenant boundary.
   */
  async listDocuments(context: AuthContext, query: ListDocumentsQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      mimeType,
      leadId,
      accountId,
      contactId,
      opportunityId,
      quoteId,
      orderId,
      supportCaseId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: context.organizationId,
      deletedAt: null
    };

    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }
    if (leadId) where.leadId = leadId;
    if (accountId) where.accountId = accountId;
    if (contactId) where.contactId = contactId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (quoteId) where.quoteId = quoteId;
    if (orderId) where.orderId = orderId;
    if (supportCaseId) where.supportCaseId = supportCaseId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          },
          account: {
            select: { id: true, name: true }
          },
          opportunity: {
            select: { id: true, name: true }
          },
          quote: {
            select: { id: true, quoteNumber: true }
          },
          order: {
            select: { id: true, orderNumber: true }
          },
          lead: {
            select: { id: true, firstName: true, lastName: true }
          },
          contact: {
            select: { id: true, firstName: true, lastName: true }
          },
          supportCase: {
            select: { id: true, subject: true }
          }
        }
      })
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single document metadata.
   */
  async getDocumentById(context: AuthContext, id: string) {
    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId: context.organizationId,
        deletedAt: null
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        account: {
          select: { id: true, name: true }
        },
        opportunity: {
          select: { id: true, name: true }
        },
        quote: {
          select: { id: true, quoteNumber: true }
        },
        order: {
          select: { id: true, orderNumber: true }
        },
        lead: {
          select: { id: true, firstName: true, lastName: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true }
        },
        supportCase: {
          select: { id: true, subject: true }
        }
      }
    });

    if (!document) {
      const err: AppError = new Error('Document not found in your organization.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return document;
  }

  /**
   * Upload file and persist document metadata atomically.
   */
  async uploadDocument(
    context: AuthContext,
    file: Express.Multer.File,
    metadata: UploadDocumentMetadata
  ) {
    // 1. File Validation
    const validation = fileStorageService.validateFile(file);
    if (!validation.valid) {
      const err: AppError = new Error(validation.error || 'Invalid file payload.');
      err.statusCode = 400;
      err.code = 'INVALID_FILE';
      throw err;
    }

    // 2. Cross-Tenant Relational Linking Verification
    if (metadata.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: metadata.leadId, organizationId: context.organizationId, deletedAt: null }
      });
      if (!lead) {
        const err: AppError = new Error('Referenced Lead was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: metadata.accountId, organizationId: context.organizationId, deletedAt: null }
      });
      if (!account) {
        const err: AppError = new Error('Referenced Account was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: metadata.contactId, organizationId: context.organizationId, deletedAt: null }
      });
      if (!contact) {
        const err: AppError = new Error('Referenced Contact was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: metadata.opportunityId, organizationId: context.organizationId, deletedAt: null }
      });
      if (!opportunity) {
        const err: AppError = new Error('Referenced Opportunity was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.quoteId) {
      const quote = await prisma.quote.findFirst({
        where: { id: metadata.quoteId, organizationId: context.organizationId }
      });
      if (!quote) {
        const err: AppError = new Error('Referenced Quote was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.orderId) {
      const order = await prisma.order.findFirst({
        where: { id: metadata.orderId, organizationId: context.organizationId }
      });
      if (!order) {
        const err: AppError = new Error('Referenced Order was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (metadata.supportCaseId) {
      const supportCase = await prisma.supportCase.findFirst({
        where: { id: metadata.supportCaseId, organizationId: context.organizationId, deletedAt: null }
      });
      if (!supportCase) {
        const err: AppError = new Error('Referenced Support Case was not found or belongs to another organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    // 3. Save physical file to storage
    const storageResult = await fileStorageService.saveFile(context.organizationId, file);

    // 4. Create database record with automatic cleanup rollback on failure
    try {
      const document = await prisma.document.create({
        data: {
          organizationId: context.organizationId,
          uploadedById: context.userId,
          name: metadata.name?.trim() || file.originalname,
          originalName: file.originalname,
          mimeType: storageResult.mimeType,
          size: storageResult.size,
          storageKey: storageResult.storageKey,
          leadId: metadata.leadId || null,
          accountId: metadata.accountId || null,
          contactId: metadata.contactId || null,
          opportunityId: metadata.opportunityId || null,
          quoteId: metadata.quoteId || null,
          orderId: metadata.orderId || null,
          supportCaseId: metadata.supportCaseId || null
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // 5. Audit Log
      await prisma.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'DOCUMENT_UPLOAD',
          entity: 'Document',
          entityId: document.id,
          newValue: {
            name: document.name,
            originalName: document.originalName,
            size: document.size,
            mimeType: document.mimeType
          }
        }
      });

      return document;
    } catch (dbError) {
      // Storage compensation: Delete uploaded file if DB record creation failed
      await fileStorageService.deleteFile(context.organizationId, storageResult.storageKey);
      throw dbError;
    }
  }

  /**
   * Retrieve file stream for download or safe preview.
   */
  async downloadDocument(context: AuthContext, id: string): Promise<FileStreamResult> {
    const document = await this.getDocumentById(context, id);

    const fileStream = await fileStorageService.getFileStream(
      context.organizationId,
      document.storageKey
    );

    if (!fileStream) {
      const err: AppError = new Error('Physical document file was not found in storage.');
      err.statusCode = 404;
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    // Record access in audit log
    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'DOCUMENT_DOWNLOAD',
        entity: 'Document',
        entityId: document.id,
        metadata: {
          filename: document.originalName,
          size: document.size
        }
      }
    });

    return {
      stream: fileStream.stream,
      size: document.size,
      mimeType: document.mimeType,
      filename: document.originalName
    };
  }

  /**
   * Update document name.
   */
  async updateDocument(context: AuthContext, id: string, input: UpdateDocumentInput) {
    const existing = await this.getDocumentById(context, id);
    assertCanModifyDocument(context, existing, 'update');

    const updated = await prisma.document.update({
      where: { id: existing.id },
      data: {
        name: input.name ? input.name.trim() : existing.name
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'DOCUMENT_UPDATE',
        entity: 'Document',
        entityId: updated.id,
        oldValue: { name: existing.name },
        newValue: { name: updated.name }
      }
    });

    return updated;
  }

  /**
   * Soft-delete document metadata and cleanup storage file.
   */
  async deleteDocument(context: AuthContext, id: string) {
    const document = await this.getDocumentById(context, id);
    assertCanModifyDocument(context, document, 'delete');

    await prisma.document.update({
      where: { id: document.id },
      data: { deletedAt: new Date() }
    });

    // Cleanup physical file
    await fileStorageService.deleteFile(context.organizationId, document.storageKey);

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'DOCUMENT_DELETE',
        entity: 'Document',
        entityId: document.id,
        oldValue: {
          name: document.name,
          originalName: document.originalName,
          storageKey: document.storageKey
        }
      }
    });

    return { success: true, message: 'Document removed successfully.' };
  }
}

export const documentsService = new DocumentsService();
