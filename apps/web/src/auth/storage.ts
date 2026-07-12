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

export function isSuperAdmin(role: string) {
  return role === 'super_admin';
}

export function isAdmin(role: string) {
  return role === 'supervisor';
}

export function isEmployee(role: string) {
  return role === 'employee';
}

/** 管理员或员工（可使用业务功能，非系统管理员） */
export function isMember(role: string) {
  return role === 'supervisor' || role === 'employee';
}

export function isSupervisor(role: string) {
  return role === 'supervisor';
}

export function defaultHomePath(role: string) {
  if (isSuperAdmin(role)) return '/system';
  return '/me';
}

export function roleLabel(role: string) {
  if (isSuperAdmin(role)) return '系统管理员';
  if (isAdmin(role)) return '管理员';
  return '员工';
}
