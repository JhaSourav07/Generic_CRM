import { prisma } from '../../config/prisma.js';
import { UpdateOrganizationInput } from './organization.validation.js';
import { AppError } from '../../middleware/errorHandler.js';


export class OrganizationService {
  /**
   * Get organization profile for current tenant
   */
  public async getOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!org) {
      const error: AppError = new Error('Organization not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      website: org.website,
      logo: org.logo,
      timezone: org.timezone,
      currency: org.currency,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString()
    };
  }

  /**
   * Update organization metadata with slug uniqueness validation
   */
  public async updateOrganization(
    organizationId: string,
    currentUserId: string,
    input: UpdateOrganizationInput
  ) {
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!existingOrg) {
      const error: AppError = new Error('Organization not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Slug uniqueness check if modified
    if (input.slug && input.slug !== existingOrg.slug) {
      const slugOwner = await prisma.organization.findUnique({
        where: { slug: input.slug }
      });

      if (slugOwner && slugOwner.id !== organizationId) {
        const error: AppError = new Error('Organization slug is already in use by another tenant');
        error.statusCode = 409;
        error.code = 'DUPLICATE_SLUG';
        throw error;
      }
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.slug ? { slug: input.slug.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
        ...(input.logo !== undefined ? { logo: input.logo } : {}),
        ...(input.timezone ? { timezone: input.timezone.trim() } : {}),
        ...(input.currency ? { currency: input.currency.trim().toUpperCase() } : {})
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'ORGANIZATION_UPDATED',
        entity: 'Organization',
        entityId: organizationId,
        oldValue: { name: existingOrg.name, slug: existingOrg.slug, currency: existingOrg.currency },
        newValue: { name: updated.name, slug: updated.slug, currency: updated.currency }
      }
    });

    return this.getOrganization(organizationId);
  }
}

export const organizationService = new OrganizationService();
