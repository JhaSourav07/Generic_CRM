import { ApiResponse } from '../types/index.ts';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    credentials: 'include', // Mandate HttpOnly cookie forwarding
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...customConfig
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let responseData: ApiResponse<T>;
  try {
    responseData = await response.json();
  } catch (_err) {
    throw new ApiError('Failed to parse response from server', 'INVALID_RESPONSE', response.status);
  }

  if (!response.ok || !responseData.success) {
    const errorMsg = responseData.error?.message || `Request failed with status ${response.status}`;
    const errorCode = responseData.error?.code || 'UNHANDLED_ERROR';
    throw new ApiError(errorMsg, errorCode, response.status);
  }

  return responseData.data as T;
}
