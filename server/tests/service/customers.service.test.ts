import { describe, it, expect, beforeEach } from 'vitest';
import { accountsService } from '../../src/modules/accounts/accounts.service.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { prismaTest, clearTestDb } from '../helpers/testDb.js';

describe('AccountsService / CustomersService (service integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  it('should list accounts with pagination, search, and industry filter', async () => {
    const org = await createTestOrg();
    await createTestAccount({ organizationId: org.id, name: 'Acme Global', industry: 'Technology' });
    await createTestAccount({ organizationId: org.id, name: 'Beta Health', industry: 'Healthcare' });

    const result = await accountsService.getAccounts(org.id, { page: 1, limit: 10 });
    expect(result.accounts.length).toBe(2);
    expect(result.meta.total).toBe(2);

    const searchResult = await accountsService.getAccounts(org.id, { search: 'Acme' });
    expect(searchResult.accounts.length).toBe(1);
    expect(searchResult.accounts[0].name).toBe('Acme Global');

    const industryResult = await accountsService.getAccounts(org.id, { industry: 'Healthcare' });
    expect(industryResult.accounts.length).toBe(1);
    expect(industryResult.accounts[0].industry).toBe('Healthcare');
  });

  it('should create account and write audit log', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });

    const account = await accountsService.createAccount(org.id, user.id, {
      name: 'Omni Consumer Products',
      industry: 'Robotics',
      email: 'info@ocp.com',
      website: 'https://ocp.com',
      status: 'active'
    });

    expect(account.id).toBeDefined();
    expect(account.name).toBe('Omni Consumer Products');

    // Audit Log Check
    const auditLogs = await prismaTest.auditLog.findMany({
      where: { organizationId: org.id, entityId: account.id }
    });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe('CUSTOMER_CREATED');
  });

  it('should assign account owner', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user1 = await createTestUser({ organizationId: org.id, roleId: role.id });
    const user2 = await createTestUser({ organizationId: org.id, roleId: role.id });

    const account = await createTestAccount({ organizationId: org.id, ownerId: user1.id });

    const assigned = await accountsService.assignAccount(org.id, user1.id, account.id, user2.id);
    expect(assigned.ownerId).toBe(user2.id);
  });

  it('should soft delete account', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const account = await createTestAccount({ organizationId: org.id });

    await accountsService.deleteAccount(org.id, user.id, account.id);

    await expect(accountsService.getAccountById(org.id, account.id)).rejects.toThrow('Customer account not found');
  });
});
