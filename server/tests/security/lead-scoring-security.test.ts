import { describe, it, expect, vi } from 'vitest';
import { createLeadSchema, updateLeadSchema } from '../../src/modules/leads/leads.validation.js';
import { leadScoringService } from '../../src/modules/leads/lead-scoring.service.js';
import { prisma } from '../../src/config/prisma.js';

describe('Lead Scoring — Security & Multi-Tenant Boundaries', () => {
  describe('Input Validation & Mass Assignment Protection', () => {
    it('should reject client-provided score attribute outside valid range (0-100)', () => {
      const maliciousPayload = {
        firstName: 'Hacker',
        lastName: 'User',
        email: 'hacker@example.com',
        score: 150 // Client attempting to set invalid score
      };

      expect(() => createLeadSchema.parse(maliciousPayload)).toThrow(
        /Score cannot exceed 100/
      );

      expect(() => createLeadSchema.parse({ ...maliciousPayload, score: -10 })).toThrow(
        /Score must be at least 0/
      );
    });

    it('should reject client-provided score attribute outside valid range on update', () => {
      const maliciousPayload = {
        company: 'Updated Corp',
        score: 999
      };

      expect(() => updateLeadSchema.parse(maliciousPayload)).toThrow(
        /Score cannot exceed 100/
      );
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should throw NOT_FOUND when attempting to calculate score for a lead in another organization', async () => {
      // Mock prisma.lead.findFirst to simulate not finding the lead in Org A
      const findFirstSpy = vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue(null as any);

      await expect(
        leadScoringService.calculateLeadScore('org-tenant-A', 'lead-from-org-B')
      ).rejects.toThrow('not found in organization org-tenant-A');

      expect(findFirstSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'lead-from-org-B',
            organizationId: 'org-tenant-A'
          })
        })
      );

      findFirstSpy.mockRestore();
    });

    it('should strictly filter linked opportunities by organizationId', async () => {
      const mockLead = {
        id: 'lead-1',
        organizationId: 'org-tenant-A',
        firstName: 'Sam',
        lastName: 'Adams',
        email: 'sam@acme.com',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
        activities: [],
        tasks: []
      };

      const findFirstSpy = vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue(mockLead as any);
      const findManyOppSpy = vi.spyOn(prisma.opportunity, 'findMany').mockResolvedValue([]);

      await leadScoringService.calculateLeadScore('org-tenant-A', 'lead-1');

      // Verify that opportunity query strictly scoped by organizationId = org-tenant-A
      expect(findManyOppSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-A'
          })
        })
      );

      findFirstSpy.mockRestore();
      findManyOppSpy.mockRestore();
    });
  });
});
