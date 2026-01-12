import Cookies from 'js-cookie';
import type { ApiResponse, ApiError as ApiErrorType } from '@myautowhiz/shared';

interface ApiErrorResponse {
  error?: ApiErrorType;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = Cookies.get('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const error = (await response.json()) as ApiErrorResponse;
      throw new ApiError(
        error.error?.message || 'An error occurred',
        response.status,
        error.error?.code
      );
    }
    throw new ApiError('An error occurred', response.status);
  }

  if (isJson) {
    const data = (await response.json()) as ApiResponse<T>;
    return data.data as T;
  }

  return {} as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;

    Cookies.set('accessToken', newAccessToken, {
      expires: 1 / 96, // 15 minutes
      sameSite: 'strict',
    });

    if (data.data.refreshToken) {
      Cookies.set('refreshToken', data.data.refreshToken, {
        expires: 30,
        sameSite: 'strict',
      });
    }

    return newAccessToken;
  } catch {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...init } = options;

  // Build URL with query params
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers = await getAuthHeaders();

  try {
    let response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
    });

    // Handle token refresh
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await fetch(url, {
          ...init,
          headers: {
            ...headers,
            ...init.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // Multipart form data for file uploads
  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const accessToken = Cookies.get('accessToken');
    const headers: Record<string, string> = {};

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse<T>(response);
  },

  // Streaming endpoint for chat
  stream: async function* (
    endpoint: string,
    data: unknown
  ): AsyncGenerator<string> {
    const accessToken = Cookies.get('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError('Stream error', response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiError('No response body', 500);
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  },
};

export default api;
