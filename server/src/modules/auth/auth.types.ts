export interface JwtPayload {
  userId: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  email: string;
}

export interface AuthUserContext {
  userId: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  email: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
}

// Extend Express Request interface to include authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}
