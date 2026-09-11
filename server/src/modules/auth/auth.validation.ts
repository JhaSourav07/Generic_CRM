import { z } from 'zod';

export const signupSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, { message: 'Organization name must be at least 2 characters' })
      .max(100),
    name: z
      .string()
      .trim()
      .min(2, { message: 'Full name must be at least 2 characters' })
      .max(100),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Password confirmation is required' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
