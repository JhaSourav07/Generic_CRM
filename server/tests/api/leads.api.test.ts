import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Lead API Routes (/api/leads) (API integration)', () => {
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

  describe('GET /api/leads', () => {
    it('should return 401 UNAUTHORIZED when no auth token provided', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(401);
    });

    it('should list leads with pagination metadata', async () => {
      await createTestLead({ organizationId: org.id, firstName: 'Lead 1' });
      await createTestLead({ organizationId: org.id, firstName: 'Lead 2' });

      const res = await request(app)
        .get('/api/leads')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('POST /api/leads', () => {
    it('should create lead successfully', async () => {
      const payload = {
        firstName: 'Michael',
        lastName: 'Scott',
        email: 'michael@dundermifflin.com',
        company: 'Dunder Mifflin',
        score: 90
      };

      const res = await request(app)
        .post('/api/leads')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Michael');
    });

    it('should return 400 VALIDATION_ERROR on missing required fields', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ company: 'No Name Corp' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return lead details by ID', async () => {
      const lead = await createTestLead({ organizationId: org.id, firstName: 'Dwight' });

      const res = await request(app)
        .get(`/api/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Dwight');
    });

    it('should return 404 NOT_FOUND for non-existent lead ID', async () => {
      const res = await request(app)
        .get('/api/leads/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should update lead record', async () => {
      const lead = await createTestLead({ organizationId: org.id, firstName: 'Jim' });

      const res = await request(app)
        .patch(`/api/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ firstName: 'James' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('James');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should soft-delete lead', async () => {
      const lead = await createTestLead({ organizationId: org.id, firstName: 'Pam' });

      const res = await request(app)
        .delete(`/api/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);

      // Verify soft deletion in database
      const dbLead = await prismaTest.lead.findUnique({ where: { id: lead.id } });
      expect(dbLead?.deletedAt).not.toBeNull();
    });
  });
});
