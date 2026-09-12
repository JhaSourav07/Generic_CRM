import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../../src/modules/auth/auth.validation.js';

describe('Auth Validation Schemas (unit)', () => {
  describe('signupSchema', () => {
    it('should validate and normalize valid signup input', () => {
      const input = {
        organizationName: '  Acme Global  ',
        name: '  Alex Vance  ',
        email: '  Alex.Vance@Acme.COM  ',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizationName).toBe('Acme Global');
        expect(result.data.name).toBe('Alex Vance');
        expect(result.data.email).toBe('alex.vance@acme.com');
      }
    });

    it('should reject when organizationName is less than 2 characters', () => {
      const input = {
        organizationName: 'A',
        name: 'Alex Vance',
        email: 'alex@acme.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject when name is less than 2 characters', () => {
      const input = {
        organizationName: 'Acme',
        name: 'A',
        email: 'alex@acme.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email formats', () => {
      const input = {
        organizationName: 'Acme',
        name: 'Alex Vance',
        email: 'not-an-email',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const input = {
        organizationName: 'Acme',
        name: 'Alex Vance',
        email: 'alex@acme.com',
        password: 'short',
        confirmPassword: 'short'
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject when confirmPassword does not match password', () => {
      const input = {
        organizationName: 'Acme',
        name: 'Alex Vance',
        email: 'alex@acme.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate and normalize valid login input', () => {
      const input = {
        email: '  ALEX@ACME.COM  ',
        password: 'Password123!'
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('alex@acme.com');
      }
    });

    it('should reject malformed emails in login', () => {
      const input = {
        email: 'invalid-email',
        password: 'Password123!'
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty password in login', () => {
      const input = {
        email: 'alex@acme.com',
        password: ''
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
