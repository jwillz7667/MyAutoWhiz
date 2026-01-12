import Cookies from 'js-cookie';
import { api } from './api';
import type { User, LoginResponse, RefreshTokenResponse } from '@myautowhiz/shared';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  fullName: string;
}

function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set('accessToken', accessToken, {
    expires: 1 / 96, // 15 minutes
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  Cookies.set('refreshToken', refreshToken, {
    expires: 30, // 30 days
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

function clearTokens() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
}

export function getAccessToken(): string | undefined {
  return Cookies.get('accessToken');
}

export function getRefreshToken(): string | undefined {
  return Cookies.get('refreshToken');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

export async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/register', data);

  if (response.tokens?.accessToken && response.tokens?.refreshToken) {
    setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  }

  return response;
}

export async function login(credentials: AuthCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', credentials);

  if (response.tokens?.accessToken && response.tokens?.refreshToken) {
    setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  }

  return response;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore errors on logout
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/auth/me');
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

export async function refreshToken(): Promise<RefreshTokenResponse | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken: refresh,
    });

    if (response.accessToken) {
      setTokens(response.accessToken, refresh);
    }

    return response;
  } catch {
    clearTokens();
    return null;
  }
}

export function getGoogleOAuthUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`;
}

export function getAppleOAuthUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/apple`;
}
