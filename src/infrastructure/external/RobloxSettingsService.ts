// Infrastructure: RobloxSettingsService — profile, security, privacy, notifications
//
// DT-4 (DIP): se añade `RobloxSettingsApiImpl implements RobloxSettingsPort` que
// envuelve las funciones exportadas. La class es el adaptador formal del port;
// las funciones sueltas se mantienen para no romper imports existentes en IPCAdapter.ts.

import { apiGet, apiPost } from './RobloxHttp';
import type { RobloxSettingsPort } from '../../domain/repositories/RobloxApiPort';

export async function getProfile(cookie: string): Promise<{ displayName: string; description: string }> {
  if (!cookie || !cookie.trim()) throw new Error('Cookie required');
  const data = await apiGet<{ id: number; name: string; displayName: string; description: string }>(
    'https://users.roblox.com/v1/users/authenticated',
    cookie
  );
  return { displayName: data.displayName ?? '', description: data.description ?? '' };
}

export async function updateProfile(cookie: string, updates: { displayName?: string; description?: string }): Promise<void> {
  await apiPost('https://users.roblox.com/v1/users/authenticated/profile', cookie, updates);
}

export async function get2FAStatus(cookie: string): Promise<{ enabled: boolean; method: string }> {
  const data = await apiGet<{ enabled: boolean; method: string }>('https://twostepverification.roblox.com/v1/metadata', cookie);
  return { enabled: data.enabled ?? false, method: data.method ?? 'None' };
}

export async function toggle2FA(cookie: string, enable: boolean): Promise<void> {
  if (enable) await apiPost('https://twostepverification.roblox.com/v1/enable', cookie);
  else await apiPost('https://twostepverification.roblox.com/v1/disable', cookie);
}

export async function getActiveSessions(cookie: string): Promise<{ id: string; device: string; lastActive: Date }[]> {
  const data = await apiGet<{ sessions: { id: string; deviceName: string; lastActive: string }[] }>(
    'https://auth.roblox.com/v1/sessions',
    cookie
  );
  return (data.sessions || []).map(s => ({ id: s.id, device: s.deviceName, lastActive: new Date(s.lastActive) }));
}

export async function logoutSession(cookie: string, sessionId: string): Promise<void> {
  await apiPost(`https://auth.roblox.com/v1/sessions/${sessionId}/logout`, cookie);
}

export async function logoutAllSessions(cookie: string): Promise<void> {
  await apiPost('https://auth.roblox.com/v1/sessions/logout-all', cookie);
}

export async function changePassword(cookie: string, current: string, next: string): Promise<void> {
  await apiPost('https://auth.roblox.com/v1/user/passwords/change', cookie, { currentPassword: current, newPassword: next });
}

export async function getPrivacySettings(cookie: string): Promise<Record<string, string | boolean>> {
  const data = await apiGet<Record<string, string | boolean>>('https://accountsettings.roblox.com/v1/privacy-settings', cookie);
  return data ?? {};
}

export async function updatePrivacySetting(cookie: string, key: string, value: string | boolean): Promise<void> {
  await apiPost('https://accountsettings.roblox.com/v1/privacy-settings', cookie, { [key]: value });
}

export async function getNotificationSettings(cookie: string): Promise<Record<string, boolean>> {
  const data = await apiGet<Record<string, boolean>>('https://accountsettings.roblox.com/v1/notification-settings', cookie);
  return data ?? {};
}

export async function updateNotificationSetting(cookie: string, key: string, value: boolean): Promise<void> {
  await apiPost('https://accountsettings.roblox.com/v1/notification-settings', cookie, { [key]: value });
}

// ─────────────────────────────────────────────────────────────────────────────
// DT-4 (DIP): Adapter class que implementa RobloxSettingsPort.
// Envuelve las funciones sueltas para que el puerto pueda inyectarse como
// dependencia en tests/use-cases sin reescribir imports de IPCAdapter.ts.
// ─────────────────────────────────────────────────────────────────────────────
export class RobloxSettingsApiImpl implements RobloxSettingsPort {
  public getProfile = getProfile;
  public updateProfile = updateProfile;
  public get2FAStatus = get2FAStatus;
  public toggle2FA = toggle2FA;
  public getActiveSessions = getActiveSessions;
  public logoutSession = logoutSession;
  public logoutAllSessions = logoutAllSessions;
  public changePassword = changePassword;
  public getPrivacySettings = getPrivacySettings;
  public updatePrivacySetting = updatePrivacySetting;
  public getNotificationSettings = getNotificationSettings;
  public updateNotificationSetting = updateNotificationSetting;
}

// Instancia singleton exportada para consumers que quieran inyectar por DI.
export const robloxSettingsApi = new RobloxSettingsApiImpl();
