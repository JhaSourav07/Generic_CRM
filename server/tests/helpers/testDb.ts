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
  await prismaTest.auditLog.deleteMany({});
  await prismaTest.notification.deleteMany({});
  await prismaTest.document.deleteMany({});
  await prismaTest.campaignLead.deleteMany({});
  await prismaTest.campaign.deleteMany({});
  await prismaTest.supportCase.deleteMany({});
  await prismaTest.orderItem.deleteMany({});
  await prismaTest.order.deleteMany({});
  await prismaTest.quoteItem.deleteMany({});
  await prismaTest.quote.deleteMany({});
  await prismaTest.product.deleteMany({});
  await prismaTest.task.deleteMany({});
  await prismaTest.activity.deleteMany({});
  await prismaTest.opportunity.deleteMany({});
  await prismaTest.pipelineStage.deleteMany({});
  await prismaTest.pipeline.deleteMany({});
  await prismaTest.contact.deleteMany({});
  await prismaTest.lead.deleteMany({});
  await prismaTest.account.deleteMany({});
  await prismaTest.user.deleteMany({});
  await prismaTest.rolePermission.deleteMany({});
  await prismaTest.permission.deleteMany({});
  await prismaTest.role.deleteMany({});
  await prismaTest.organization.deleteMany({});
}

/**
 * Seeds basic system permissions for tests.
 */
export async function seedTestPermissions(): Promise<void> {
  const resources = ['leads', 'accounts', 'contacts', 'opportunities', 'pipelines', 'users', 'roles', 'settings'];
  const actions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'APPROVE', 'EXPORT'];

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
