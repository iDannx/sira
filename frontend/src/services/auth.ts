import api, { TOKEN_KEY, USER_KEY } from './api';
import type { ApiSuccess, LoginResponse, User } from '../types/api';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<ApiSuccess<LoginResponse>>('/auth/login', { email, password });
  localStorage.setItem(TOKEN_KEY, data.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  return data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Backend es stateless — si falla, descartamos el token localmente igual.
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data.data));
  return data.data;
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}
