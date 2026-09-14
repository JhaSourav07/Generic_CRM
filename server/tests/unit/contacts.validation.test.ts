import { describe, it, expect } from 'vitest';
import {
  getContactsQuerySchema,
  createContactSchema,
  updateContactSchema
} from '../../src/modules/contacts/contacts.validation.js';

describe('Contacts Validation Schemas (unit)', () => {
  describe('getContactsQuerySchema', () => {
    it('should parse empty query with default values', () => {
      const parsed = getContactsQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.sortBy).toBe('createdAt');
      expect(parsed.sortOrder).toBe('desc');
    });

    it('should transform numeric page and limit parameters', () => {
      const parsed = getContactsQuerySchema.parse({ page: '2', limit: '15' });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(15);
    });
  });

  describe('createContactSchema', () => {
    it('should validate valid contact input', () => {
      const valid = {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 's.connor@cyberdyne.com',
        jobTitle: 'Security Director',
        isPrimary: true
      };
      const parsed = createContactSchema.parse(valid);
      expect(parsed.firstName).toBe('Sarah');
      expect(parsed.lastName).toBe('Connor');
      expect(parsed.isPrimary).toBe(true);
    });

    it('should throw error when firstName is missing', () => {
      expect(() => createContactSchema.parse({ lastName: 'Connor' })).toThrow();
    });

    it('should throw error when lastName is missing', () => {
      expect(() => createContactSchema.parse({ firstName: 'Sarah' })).toThrow();
    });

    it('should throw error on invalid email address', () => {
      expect(() => createContactSchema.parse({ firstName: 'A', lastName: 'B', email: 'invalid-email' })).toThrow();
    });
  });
});
