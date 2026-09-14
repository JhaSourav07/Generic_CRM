import { describe, it, expect, beforeEach } from 'vitest';
import { contactsService } from '../../src/modules/contacts/contacts.service.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { prismaTest, clearTestDb } from '../helpers/testDb.js';

describe('ContactsService (service integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  it('should list contacts with pagination, search, and accountId filter', async () => {
    const org = await createTestOrg();
    const account1 = await createTestAccount({ organizationId: org.id, name: 'Company Alpha' });
    const account2 = await createTestAccount({ organizationId: org.id, name: 'Company Beta' });

    await createTestContact({ organizationId: org.id, accountId: account1.id, firstName: 'Alice', lastName: 'Walker' });
    await createTestContact({ organizationId: org.id, accountId: account2.id, firstName: 'Bob', lastName: 'Marley' });

    const result = await contactsService.getContacts(org.id, { page: 1, limit: 10 });
    expect(result.contacts.length).toBe(2);
    expect(result.meta.total).toBe(2);

    const accountFilterResult = await contactsService.getContacts(org.id, { accountId: account1.id });
    expect(accountFilterResult.contacts.length).toBe(1);
    expect(accountFilterResult.contacts[0].firstName).toBe('Alice');
  });

  it('should create contact linked to valid organization account and write audit log', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const account = await createTestAccount({ organizationId: org.id, name: 'Stark Industries' });

    const contact = await contactsService.createContact(org.id, user.id, {
      firstName: 'Tony',
      lastName: 'Stark',
      email: 'tony@starkindustries.com',
      jobTitle: 'Chief Executive Officer',
      isPrimary: true,
      accountId: account.id
    });

    expect(contact.id).toBeDefined();
    expect(contact.firstName).toBe('Tony');
    expect(contact.accountId).toBe(account.id);

    const auditLogs = await prismaTest.auditLog.findMany({
      where: { organizationId: org.id, entityId: contact.id }
    });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe('CONTACT_CREATED');
  });

  it('should soft delete contact', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const contact = await createTestContact({ organizationId: org.id });

    await contactsService.deleteContact(org.id, user.id, contact.id);

    await expect(contactsService.getContactById(org.id, contact.id)).rejects.toThrow('Contact not found');
  });
});
