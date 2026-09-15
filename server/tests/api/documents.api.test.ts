import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestDocument } from '../factories/document.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Documents API Routes (/api/documents)', () => {
  let org: any;
  let role: any;
  let user: any;
  let authToken: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: role.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: user.email
    });
  });

  describe('GET /api/documents', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(401);
    });

    it('should list documents with pagination metadata', async () => {
      await createTestDocument({ organizationId: org.id, uploadedById: user.id, name: 'Doc A' });
      await createTestDocument({ organizationId: org.id, uploadedById: user.id, name: 'Doc B' });

      const res = await request(app)
        .get('/api/documents')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter documents by search keyword', async () => {
      await createTestDocument({ organizationId: org.id, uploadedById: user.id, name: 'Quarterly Proposal' });
      await createTestDocument({ organizationId: org.id, uploadedById: user.id, name: 'Invoice Receipt' });

      const res = await request(app)
        .get('/api/documents?search=proposal')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Quarterly Proposal');
    });
  });

  describe('POST /api/documents/upload', () => {
    it('should upload a valid PDF document with metadata', async () => {
      const account = await createTestAccount({ organizationId: org.id });

      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .field('name', 'Service Agreement')
        .field('accountId', account.id)
        .attach('file', Buffer.from('%PDF-1.4 test document content'), 'agreement.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Service Agreement');
      expect(res.body.data.originalName).toBe('agreement.pdf');
      expect(res.body.data.mimeType).toBe('application/pdf');
      expect(res.body.data.accountId).toBe(account.id);
    });

    it('should reject upload without a file', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .field('name', 'Missing File Doc');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_REQUIRED');
    });

    it('should reject invalid or executable file extension', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .attach('file', Buffer.from('#!/bin/sh echo bad'), 'script.sh');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });
  });

  describe('GET /api/documents/:id/download', () => {
    it('should stream document file with attachment header', async () => {
      // Upload document first to have real physical file
      const uploadRes = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .field('name', 'Downloadable Contract')
        .attach('file', Buffer.from('%PDF-1.4 contract data'), 'contract.pdf');

      expect(uploadRes.status).toBe(201);
      const docId = uploadRes.body.data.id;

      const res = await request(app)
        .get(`/api/documents/${docId}/download`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('contract.pdf');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should soft delete document and remove from list', async () => {
      const doc = await createTestDocument({
        organizationId: org.id,
        uploadedById: user.id,
        name: 'Obsolete Doc'
      });

      const res = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbDoc = await prismaTest.document.findUnique({
        where: { id: doc.id }
      });
      expect(dbDoc?.deletedAt).not.toBeNull();
    });
  });
});
