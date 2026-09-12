import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { SignupInput, LoginInput } from './auth.validation.js';
import { JwtPayload, SafeUser } from './auth.types.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class AuthService {
  /**
   * Hash plaintext password securely using bcryptjs with cost factor 10
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare plaintext password with stored bcrypt passwordHash
   */
  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate signed JWT authentication token
   */
  public generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.AUTH_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify signed JWT authentication token
   */
  public verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.AUTH_SECRET) as JwtPayload;
    } catch (_err) {
      const error: AppError = new Error('Invalid or expired authentication token');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
  }

  /**
   * Format raw Prisma user into safe user response envelope
   */
  public sanitizeUser(user: any): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        currency: user.organization.currency
      },
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      }
    };
  }

  /**
   * Transactional Organization & Administrator Signup
   */
  public async signup(input: SignupInput): Promise<{ token: string; user: SafeUser }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Generate unique slug
    let baseSlug = slugify(input.organizationName);
    if (!baseSlug) baseSlug = 'org';

    let uniqueSlug = baseSlug;
    const existingOrg = await prisma.organization.findUnique({ where: { slug: uniqueSlug } });
    if (existingOrg) {
      uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Check if special platform Super Admin credentials match
    const isPlatformAdmin = normalizedEmail === env.ADMIN_EMAIL.toLowerCase();

    // Execute Organization + User + Role + Pipeline creation atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: input.organizationName.trim(),
          slug: uniqueSlug
        }
      });

      // 3. Find or create Organization Admin Role
      const roleName = isPlatformAdmin ? 'SUPER_ADMIN' : 'SALES_MANAGER';
      let role = await tx.role.findFirst({
        where: {
          organizationId: org.id,
          name: roleName
        }
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            organizationId: org.id,
            name: roleName,
            description: isPlatformAdmin 
              ? 'Super Admin platform supervisor' 
              : 'Organization Administrator and Sales Manager'
          }
        });
      }

      // 4. Hash password & Create User
      const passwordHash = await this.hashPassword(input.password);
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          roleId: role.id,
          name: input.name.trim(),
          email: normalizedEmail,
          passwordHash,
          isActive: true
        },
        include: {
          organization: true,
          role: true
        }
      });

      // 5. Initialize default Sales Pipeline & 5 Stages
      await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Standard Sales Pipeline',
          description: 'Default commercial deal tracking pipeline',
          isDefault: true,
          stages: {
            create: [
              { name: 'Qualification', order: 1, probability: 0.2 },
              { name: 'Value Proposal', order: 2, probability: 0.4 },
              { name: 'Negotiation', order: 3, probability: 0.7 },
              { name: 'Closed Won', order: 4, probability: 1.0 },
              { name: 'Closed Lost', order: 5, probability: 0.0 }
            ]
          }
        }
      });

      return user;
    });

    const safeUser = this.sanitizeUser(result);
    const token = this.generateToken({
      userId: result.id,
      organizationId: result.organizationId,
      roleId: result.roleId,
      roleName: result.role.name,
      email: result.email
    });

    return { token, user: safeUser };
  }

  /**
   * Authenticate User Login
   */
  public async login(input: LoginInput): Promise<{ token: string; user: SafeUser }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Query user across active organizations
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail
      },
      include: {
        organization: true,
        role: true
      }
    });

    // Generic 401 error to prevent email enumeration
    const genericAuthError = (): AppError => {
      const error: AppError = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return error;
    };

    if (!user) {
      throw genericAuthError();
    }

    if (!user.isActive) {
      const error: AppError = new Error('Your account has been deactivated. Please contact your organization administrator.');
      error.statusCode = 401;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    // Verify password hash
    const isPasswordValid = await this.comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw genericAuthError();
    }

    // Update lastLoginAt timestamp asynchronously
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const safeUser = this.sanitizeUser(user);
    const token = this.generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      roleId: user.roleId,
      roleName: user.role.name,
      email: user.email
    });

    return { token, user: safeUser };
  }

  /**
   * Fetch currently authenticated user context
   */
  public async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        role: true
      }
    });

    if (!user || !user.isActive) {
      const error: AppError = new Error('Authenticated user session not found or inactive');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService();
