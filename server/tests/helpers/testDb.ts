import { PrismaClient } from '@prisma/client';

const testDbUrl = process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5433/vynexa_crm_test?schema=public';

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl
    }
  }
});

/**
 * Cleanly resets all tables in the isolated test database.
 */
export async function clearTestDb(): Promise<void> {
  await prismaTest.$executeRawUnsafe(
    'TRUNCATE TABLE audit_logs, notifications, documents, campaign_leads, campaigns, support_cases, order_items, orders, quote_items, quotes, products, tasks, activities, opportunities, pipeline_stages, pipelines, contacts, leads, accounts, users, role_permissions, permissions, roles, organizations RESTART IDENTITY CASCADE;'
  );
}

/**
 * Seeds basic system permissions for tests.
 */
export async function seedTestPermissions(): Promise<void> {
  const resources = ['leads', 'accounts', 'contacts', 'opportunities', 'users'];
  const actions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

  for (const resource of resources) {
    for (const action of actions) {
      await prismaTest.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action, description: `${action} ${resource}` }
      });
    }
  }
}

/**
 * Disconnect test Prisma client.
 */
export async function disconnectTestDb(): Promise<void> {
  await prismaTest.$disconnect();
}
