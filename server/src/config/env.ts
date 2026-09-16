import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root project directory if available
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const DEFAULT_AUTH_SECRET = 'vynexa-crm-super-secret-key-change-in-production';
export const DEFAULT_ADMIN_PASSWORD = 'super-secret-admin-password-change-in-production';

export const envSchema = z
  .object({
    PORT: z
      .string()
      .default('5000')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
        message: 'PORT must be a valid port number (1-65535)'
      }),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z
      .string()
      .default('http://localhost:5173')
      .refine(
        (val) => {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'CLIENT_URL must be a valid URL string' }
      ),
    CORS_ORIGIN: z.string().optional(),
    DATABASE_URL: z
      .string()
      .optional()
      .default('postgresql://postgres:postgres@localhost:5432/vynexa_crm?schema=public'),
    AUTH_SECRET: z.string().default(DEFAULT_AUTH_SECRET),
    ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address').default('admin@vynexa.com'),
    ADMIN_PASSWORD: z.string().min(8).default(DEFAULT_ADMIN_PASSWORD),
    ADMIN_SECRET_KEY: z.string().optional().default('vynexa-super-admin-bypass-key'),
    STORAGE_PATH: z.string().optional(),
    MAX_FILE_SIZE_MB: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
        message: 'MAX_FILE_SIZE_MB must be between 1 and 100 MB'
      })
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DATABASE_URL || data.DATABASE_URL.includes('localhost:5432/vynexa_crm')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'Production requires a valid external DATABASE_URL and cannot use the development default'
        });
      }

      if (data.AUTH_SECRET === DEFAULT_AUTH_SECRET || data.AUTH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_SECRET'],
          message:
            'Production AUTH_SECRET cannot use the development default and must be at least 32 characters in length'
        });
      }

      if (data.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_PASSWORD'],
          message: 'Production ADMIN_PASSWORD cannot use the development default password'
        });
      }
    }
  });

export function parseEnv(environmentData: Record<string, any> = process.env) {
  const parseResult = envSchema.safeParse(environmentData);

  if (!parseResult.success) {
    console.error('Invalid environment variable configuration:');
    console.error(parseResult.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parseResult.data;
}

export const env = parseEnv(process.env);
