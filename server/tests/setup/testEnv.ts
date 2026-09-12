import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for test execution
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5433/vynexa_crm_test?schema=public';
process.env.AUTH_SECRET = 'vynexa-test-secret-jwt-key';
process.env.ADMIN_EMAIL = 'admin@vynexa.com';
process.env.ADMIN_PASSWORD = 'super-secret-admin-password-change-in-production';
process.env.ADMIN_SECRET_KEY = 'vynexa-super-admin-bypass-key';
