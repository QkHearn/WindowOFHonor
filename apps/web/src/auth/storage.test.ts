import { describe, expect, it } from 'vitest';
import { defaultHomePath, isMember, isSupervisor, saveSession, clearSession, getStoredToken } from './storage';

describe('auth/storage', () => {
  it('isSupervisor detects supervisor only', () => {
    expect(isSupervisor('supervisor')).toBe(true);
    expect(isSupervisor('super_admin')).toBe(false);
    expect(isSupervisor('employee')).toBe(false);
  });

  it('isMember includes supervisor and employee', () => {
    expect(isMember('supervisor')).toBe(true);
    expect(isMember('employee')).toBe(true);
    expect(isMember('super_admin')).toBe(false);
  });

  it('defaultHomePath routes by role', () => {
    expect(defaultHomePath('super_admin')).toBe('/system');
    expect(defaultHomePath('supervisor')).toBe('/supervisor');
    expect(defaultHomePath('employee')).toBe('/me');
  });

  it('saveSession persists token', () => {
    clearSession();
    saveSession('tok', { id: '1', username: 'a', displayName: 'A', role: 'employee', honorPoints: 0 });
    expect(getStoredToken()).toBe('tok');
    clearSession();
  });
});
