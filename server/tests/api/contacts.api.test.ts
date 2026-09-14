import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Contacts API Routes (/api/contacts) (API integration)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });
  });

  describe('GET /api/contacts', () => {
    it('should return 401 UNAUTHORIZED when no auth token provided', async () => {
      const res = await request(app).get('/api/contacts');
      expect(res.status).toBe(401);
    });

    it('should list contacts with pagination metadata', async () => {
      await createTestContact({ organizationId: org.id, firstName: 'Contact A' });
      await createTestContact({ organizationId: org.id, firstName: 'Contact B' });

      const res = await request(app)
        .get('/api/contacts')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create contact successfully', async () => {
      const account = await createTestAccount({ organizationId: org.id });
      const payload = {
        firstName: 'Bruce',
        lastName: 'Wayne',
        email: 'bruce@wayneenterprises.com',
        jobTitle: 'Chairman & CEO',
        isPrimary: true,
        accountId: account.id
      };

      const res = await request(app)
        .post('/api/contacts')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Bruce');
      expect(res.body.data.accountId).toBe(account.id);
    });

    it('should return 400 VALIDATION_ERROR when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ firstName: 'SoloNameOnly' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should return contact details by ID', async () => {
      const contact = await createTestContact({ organizationId: org.id, firstName: 'Lucius', lastName: 'Fox' });

      const res = await request(app)
        .get(`/api/contacts/${contact.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Lucius');
    });

    it('should return 404 NOT_FOUND for non-existent contact ID', async () => {
      const res = await request(app)
        .get('/api/contacts/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should soft delete contact record', async () => {
      const contact = await createTestContact({ organizationId: org.id });

      const res = await request(app)
        .delete(`/api/contacts/${contact.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
