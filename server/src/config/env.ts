import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root project directory if available
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:postgres@localhost:5432/vynexa_crm?schema=public'),
  AUTH_SECRET: z.string().default('vynexa-crm-super-secret-key-change-in-production'),
  ADMIN_EMAIL: z.string().email().default('admin@vynexa.com'),
  ADMIN_PASSWORD: z.string().min(8).default('super-secret-admin-password-change-in-production'),
  ADMIN_SECRET_KEY: z.string().default('vynexa-super-admin-bypass-key')
});

export function parseEnv(environmentData: Record<string, any> = process.env) {
  const parseResult = envSchema.safeParse(environmentData);

  if (!parseResult.success) {
    console.error('❌ Invalid environment variable configuration:');
    console.error(parseResult.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parseResult.data;
}

export const env = parseEnv(process.env);
