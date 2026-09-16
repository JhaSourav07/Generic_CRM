import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageResult {
  storageKey: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface FileStreamResult {
  stream: fs.ReadStream;
  size: number;
  mimeType: string;
  filename: string;
}

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const MAX_FILE_SIZE_BYTES = (
  process.env.MAX_FILE_SIZE_MB
    ? parseInt(process.env.MAX_FILE_SIZE_MB, 10)
    : 10
) * 1024 * 1024;

export class FileStorageService {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || process.env.STORAGE_PATH || path.resolve(process.cwd(), 'uploads', 'documents');
    this.ensureBaseDir();
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getOrgDir(organizationId: string): string {
    // Sanitize organizationId to alphanumeric + hyphens only
    const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
    const orgDir = path.resolve(this.baseDir, sanitizedOrgId);
    
    // Traversal check: orgDir must stay within baseDir
    if (!orgDir.startsWith(this.baseDir)) {
      throw new Error('Directory traversal attempt detected in organization path.');
    }

    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }
    return orgDir;
  }

  public validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds maximum permitted limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
      };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `File extension '${ext}' is not permitted. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
      };
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      return {
        valid: false,
        error: `File MIME type '${file.mimetype}' is not permitted.`
      };
    }

    // Filename traversal & null byte sanitization
    if (file.originalname.includes('\0') || file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return {
        valid: false,
        error: 'Invalid filename containing illegal characters or path traversal sequences.'
      };
    }

    return { valid: true };
  }

  public async saveFile(organizationId: string, file: Express.Multer.File): Promise<StorageResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file payload');
    }

    const orgDir = this.getOrgDir(organizationId);
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `${crypto.randomUUID()}${ext}`;
    const filePath = path.resolve(orgDir, uniqueKey);

    // Ensure path resolves inside orgDir
    if (!filePath.startsWith(orgDir)) {
      throw new Error('Path traversal sequence detected in storage key.');
    }

    // Write file to target destination
    if (file.buffer) {
      await fs.promises.writeFile(filePath, file.buffer);
    } else if (file.path) {
      // If multer stored it in a temp path, move it
      await fs.promises.rename(file.path, filePath);
    } else {
      throw new Error('File data buffer or path not found');
    }

    return {
      storageKey: uniqueKey,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  }

  public async getFileStream(
    organizationId: string,
    storageKey: string
  ): Promise<FileStreamResult | null> {
    // Sanitize storageKey: only allow alphanumeric, hyphens, underscores and dots
    const sanitizedKey = path.basename(storageKey);
    const orgDir = this.getOrgDir(organizationId);
    const filePath = path.resolve(orgDir, sanitizedKey);

    if (!filePath.startsWith(orgDir)) {
      throw new Error('Access denied: Traversal sequence in storage key');
    }

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = await fs.promises.stat(filePath);
    const ext = path.extname(sanitizedKey).toLowerCase();

    // Map common extension to MIME
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.txt') mimeType = 'text/plain';
    else if (ext === '.csv') mimeType = 'text/csv';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const stream = fs.createReadStream(filePath);
    return {
      stream,
      size: stats.size,
      mimeType,
      filename: sanitizedKey
    };
  }

  public async deleteFile(organizationId: string, storageKey: string): Promise<boolean> {
    try {
      const sanitizedKey = path.basename(storageKey);
      const orgDir = this.getOrgDir(organizationId);
      const filePath = path.resolve(orgDir, sanitizedKey);

      if (!filePath.startsWith(orgDir)) {
        throw new Error('Access denied: Traversal sequence in storage key');
      }

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  }
}

export const fileStorageService = new FileStorageService();
