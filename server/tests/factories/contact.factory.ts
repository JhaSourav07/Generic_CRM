import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateContactOptions {
  organizationId: string;
  accountId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  isPrimary?: boolean;
  notes?: string;
}

export async function createTestContact(options: CreateContactOptions) {
  const uid = crypto.randomUUID();
  const firstName = options.firstName || `Jane_${uid.slice(0, 8)}`;
  const lastName = options.lastName || `Smith_${uid.slice(0, 8)}`;
  const email = options.email !== undefined ? options.email : `contact_${uid.slice(0, 8)}@test.com`;

  return prismaTest.contact.create({
    data: {
      organizationId: options.organizationId,
      accountId: options.accountId || null,
      firstName,
      lastName,
      email,
      phone: options.phone || '+1 555-019-9999',
      jobTitle: options.jobTitle || 'VP of Engineering',
      department: options.department || 'Engineering',
      isPrimary: options.isPrimary ?? false,
      notes: options.notes || 'Test contact decision maker'
    }
  });
}
