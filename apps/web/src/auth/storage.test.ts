import { describe, expect, it } from 'vitest';
import { defaultHomePath, isSupervisor, saveSession, clearSession, getStoredToken } from './storage';

describe('auth/storage', () => {
  it('isSupervisor detects supervisor roles', () => {
    expect(isSupervisor('supervisor')).toBe(true);
    expect(isSupervisor('super_admin')).toBe(true);
    expect(isSupervisor('employee')).toBe(false);
  });

  it('defaultHomePath routes by role', () => {
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
