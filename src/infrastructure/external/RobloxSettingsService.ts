// Infrastructure: RobloxSettingsService — profile, security, privacy, notifications

import { apiGet, apiPost } from './RobloxHttp';

export async function getProfile(cookie: string): Promise<{ displayName: string; description: string }> {
  const data = await apiGet<{ displayName: string; description: string }>('https://users.roblox.com/v1/users/authenticated', cookie);
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
