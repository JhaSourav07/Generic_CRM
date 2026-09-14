import { describe, it, expect } from 'vitest';
import {
  getAccountsQuerySchema,
  createAccountSchema,
  updateAccountSchema,
  assignAccountSchema
} from '../../src/modules/accounts/accounts.validation.js';

describe('Accounts / Customers Validation Schemas (unit)', () => {
  describe('getAccountsQuerySchema', () => {
    it('should parse empty query with default values', () => {
      const parsed = getAccountsQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.sortBy).toBe('createdAt');
      expect(parsed.sortOrder).toBe('desc');
    });

    it('should transform numeric page and limit parameters', () => {
      const parsed = getAccountsQuerySchema.parse({ page: '3', limit: '20' });
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(20);
    });

    it('should cap limit at 100 max', () => {
      const parsed = getAccountsQuerySchema.parse({ limit: '250' });
      expect(parsed.limit).toBe(100);
    });
  });

  describe('createAccountSchema', () => {
    it('should validate valid account input', () => {
      const valid = {
        name: 'Apex Technologies',
        industry: 'Software',
        email: 'info@apextech.com',
        website: 'https://apextech.com',
        status: 'active'
      };
      const parsed = createAccountSchema.parse(valid);
      expect(parsed.name).toBe('Apex Technologies');
      expect(parsed.status).toBe('active');
    });

    it('should throw error when account name is missing', () => {
      expect(() => createAccountSchema.parse({ industry: 'Finance' })).toThrow();
    });

    it('should throw error on invalid email address', () => {
      expect(() => createAccountSchema.parse({ name: 'Acme', email: 'not-an-email' })).toThrow();
    });
  });

  describe('assignAccountSchema', () => {
    it('should validate valid owner assignment', () => {
      const valid = { ownerId: '123e4567-e89b-12d3-a456-426614174000' };
      const parsed = assignAccountSchema.parse(valid);
      expect(parsed.ownerId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error when ownerId is missing or empty', () => {
      expect(() => assignAccountSchema.parse({})).toThrow();
    });
  });
});
