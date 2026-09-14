import { describe, it, expect } from 'vitest';
import {
  getLeadsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema
} from '../../src/modules/leads/leads.validation.js';

describe('Leads Validation Schemas (unit)', () => {
  describe('getLeadsQuerySchema', () => {
    it('should parse empty query with default values', () => {
      const parsed = getLeadsQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.sortBy).toBe('createdAt');
      expect(parsed.sortOrder).toBe('desc');
    });

    it('should transform numeric page and limit parameters', () => {
      const parsed = getLeadsQuerySchema.parse({ page: '2', limit: '25' });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(25);
    });

    it('should cap limit at 100 max', () => {
      const parsed = getLeadsQuerySchema.parse({ limit: '500' });
      expect(parsed.limit).toBe(100);
    });
  });

  describe('createLeadSchema', () => {
    it('should validate valid lead input', () => {
      const valid = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@acme.com',
        company: 'Acme Corp',
        score: 75
      };
      const parsed = createLeadSchema.parse(valid);
      expect(parsed.firstName).toBe('Alice');
      expect(parsed.status).toBe('NEW');
    });

    it('should throw error when firstName is missing', () => {
      expect(() => createLeadSchema.parse({ lastName: 'Smith' })).toThrow();
    });

    it('should throw error on invalid email address', () => {
      expect(() => createLeadSchema.parse({ firstName: 'A', lastName: 'B', email: 'invalid-email' })).toThrow();
    });

    it('should throw error on invalid score range (>100 or <0)', () => {
      expect(() => createLeadSchema.parse({ firstName: 'A', lastName: 'B', score: 150 })).toThrow();
    });
  });

  describe('convertLeadSchema', () => {
    it('should parse optional conversion options', () => {
      const input = {
        account: { name: 'Acme Enterprise' },
        createOpportunity: true,
        opportunity: { name: 'Acme Software License', value: 15000 }
      };
      const parsed = convertLeadSchema.parse(input);
      expect(parsed.account?.name).toBe('Acme Enterprise');
      expect(parsed.createOpportunity).toBe(true);
      expect(parsed.opportunity?.value).toBe(15000);
    });
  });
});
