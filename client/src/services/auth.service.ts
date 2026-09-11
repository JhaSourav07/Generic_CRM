import { request } from './api.js';
import { SignupPayload, LoginPayload, AuthResponseData, SafeUser } from '../types/auth.types.js';

export const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponseData> {
    return request<AuthResponseData>('/auth/signup', {
      method: 'POST',
      data: payload
    });
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    return request<AuthResponseData>('/auth/login', {
      method: 'POST',
      data: payload
    });
  },

  async logout(): Promise<void> {
    await request<void>('/auth/logout', {
      method: 'POST'
    });
  },

  async getMe(): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>('/auth/me', {
      method: 'GET'
    });
  }
};
