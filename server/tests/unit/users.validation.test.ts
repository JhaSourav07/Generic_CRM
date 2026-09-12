import { describe, it, expect } from 'vitest';
import {
  getUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema
} from '../../src/modules/users/users.validation.js';

describe('Users Validation Schemas (unit)', () => {
  describe('getUsersQuerySchema', () => {
    it('should parse empty object with defaults', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
        expect(result.data.isActive).toBeUndefined();
      }
    });

    it('should parse valid query strings and transform values', () => {
      const input = {
        page: '3',
        limit: '25',
        search: 'john',
        roleId: '3c8e4202-6b94-4d87-8fb2-e3e7f415ef41',
        isActive: 'true',
        sortBy: 'name',
        sortOrder: 'asc'
      };
      const result = getUsersQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
        expect(result.data.search).toBe('john');
        expect(result.data.roleId).toBe('3c8e4202-6b94-4d87-8fb2-e3e7f415ef41');
        expect(result.data.isActive).toBe(true);
        expect(result.data.sortBy).toBe('name');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should transform isActive "false" to false', () => {
      const result = getUsersQuerySchema.safeParse({ isActive: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });

    it('should bound page and limit numbers cleanly', () => {
      const result = getUsersQuerySchema.safeParse({ page: '-5', limit: '500' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(100);
      }
    });
  });

  describe('createUserSchema', () => {
    it('should validate valid user input', () => {
      const input = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123',
        roleId: '3c8e4202-6b94-4d87-8fb2-e3e7f415ef41'
      };
      const result = createUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate optional updates', () => {
      const result = updateUserSchema.safeParse({ name: 'Jane Updated' });
      expect(result.success).toBe(true);
    });
  });

  describe('toggleUserStatusSchema', () => {
    it('should validate boolean isActive status', () => {
      const result = toggleUserStatusSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });
  });
});
