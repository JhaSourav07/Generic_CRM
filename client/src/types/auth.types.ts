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

export interface SignupPayload {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: SafeUser;
  token?: string;
}
