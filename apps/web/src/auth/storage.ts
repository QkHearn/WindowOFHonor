import type { User } from '../types';

const TOKEN_KEY = 'woh_token';
const USER_KEY = 'woh_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
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

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isSupervisor(role: string) {
  return role === 'supervisor' || role === 'super_admin';
}

export function defaultHomePath(role: string) {
  return isSupervisor(role) ? '/supervisor' : '/me';
}
