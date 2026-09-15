import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { FileStorageService } from '../../src/storage/storage.service.js';

describe('FileStorageService Unit Tests', () => {
  const testDir = path.resolve(process.cwd(), 'tests-storage-scratch');
  let storage: FileStorageService;

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    storage = new FileStorageService(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate allowed business formats (PDF, DOCX, PNG, CSV)', () => {
    const mockPdf = {
      originalname: 'contract.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 50,
      buffer: Buffer.from('%PDF-1.4 test content')
    } as Express.Multer.File;

    const result = storage.validateFile(mockPdf);
    expect(result.valid).toBe(true);
  });

  it('should reject dangerous or executable file extensions (.exe, .sh, .bat, .php)', () => {
    const mockExe = {
      originalname: 'malware.exe',
      mimetype: 'application/x-msdownload',
      size: 1024,
      buffer: Buffer.from('malicious payload')
    } as Express.Multer.File;

    const result = storage.validateFile(mockExe);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("File extension '.exe' is not permitted");
  });

  it('should reject MIME type spoofing or disallowed MIME types', () => {
    const mockSpoof = {
      originalname: 'script.txt',
      mimetype: 'application/x-sh',
      size: 1024,
      buffer: Buffer.from('echo test')
    } as Express.Multer.File;

    const result = storage.validateFile(mockSpoof);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('MIME type');
  });

  it('should reject path traversal attempts in original filename', () => {
    const mockTraversal = {
      originalname: '../../../etc/passwd.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('malicious')
    } as Express.Multer.File;

    const result = storage.validateFile(mockTraversal);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('path traversal');
  });

  it('should reject oversized files exceeding maximum permitted limit', () => {
    const mockOversized = {
      originalname: 'bigfile.pdf',
      mimetype: 'application/pdf',
      size: 50 * 1024 * 1024, // 50MB > 10MB default
      buffer: Buffer.from('big')
    } as Express.Multer.File;

    const result = storage.validateFile(mockOversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum permitted limit');
  });

  it('should store file with a unique safe UUID key and stream it back', async () => {
    const content = Buffer.from('excel spreadsheet contents');
    const mockFile = {
      originalname: 'quarterly_report.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: content.length,
      buffer: content
    } as Express.Multer.File;

    const orgId = 'org-test-uuid-123';
    const saved = await storage.saveFile(orgId, mockFile);

    expect(saved.storageKey).toMatch(/^[0-9a-fA-F-]+\.xlsx$/);
    expect(saved.size).toBe(content.length);
    expect(saved.originalName).toBe('quarterly_report.xlsx');

    // Retrieve stream and read it
    const fileResult = await storage.getFileStream(orgId, saved.storageKey);
    expect(fileResult).not.toBeNull();
    expect(fileResult?.size).toBe(content.length);

    // Consume the stream before deleting file
    await new Promise<void>((resolve, reject) => {
      fileResult?.stream.on('data', () => {});
      fileResult?.stream.on('end', () => resolve());
      fileResult?.stream.on('error', reject);
    });

    // Delete file
    const deleted = await storage.deleteFile(orgId, saved.storageKey);
    expect(deleted).toBe(true);

    // Stream should now be null
    const missing = await storage.getFileStream(orgId, saved.storageKey);
    expect(missing).toBeNull();
  });
});
