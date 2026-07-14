import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { afterEach as afterEachReact } from 'vitest';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock window.api (Electron contextBridge) for renderer tests
const mockApi = {
  account: {
    add: vi.fn().mockResolvedValue({ success: true }),
    login: vi.fn().mockResolvedValue({ success: true }),
    remove: vi.fn().mockResolvedValue({ success: true }),
    list: vi.fn().mockResolvedValue({ success: true, data: [] }),
    moveAccount: vi.fn().mockResolvedValue(undefined),
    setField: vi.fn().mockResolvedValue({ success: true }),
    getProfile: vi.fn().mockResolvedValue({ success: true, data: {} }),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
    getAvatarThumbnail: vi.fn().mockResolvedValue(null),
    getFriends: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getFriendRequests: vi.fn().mockResolvedValue({ success: true, data: [] }),
    respondFriendRequest: vi.fn().mockResolvedValue(true),
    getBlocked: vi.fn().mockResolvedValue({ success: true, data: [] }),
    blockUser: vi.fn().mockResolvedValue(true),
    unblockUser: vi.fn().mockResolvedValue(true),
    followUser: vi.fn().mockResolvedValue(true),
    unfollowUser: vi.fn().mockResolvedValue(true),
  },
  roblox: {
    launch: vi.fn().mockResolvedValue({ success: true }),
    searchGame: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getServers: vi.fn().mockResolvedValue({ success: true, data: [] }),
    joinServer: vi.fn().mockResolvedValue({ success: true }),
    distributeAccounts: vi.fn().mockResolvedValue({ success: true }),
  },
  settings: {
    get: vi.fn().mockResolvedValue({ success: true, data: '' }),
    set: vi.fn().mockResolvedValue({ success: true }),
    getPrivacy: vi.fn().mockResolvedValue({ success: true, data: {} }),
    updatePrivacy: vi.fn().mockResolvedValue(true),
    getNotifications: vi.fn().mockResolvedValue({ success: true, data: {} }),
    updateNotification: vi.fn().mockResolvedValue(true),
  },
  security: {
    getSessions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    logoutSession: vi.fn().mockResolvedValue(true),
    logoutAll: vi.fn().mockResolvedValue(true),
    changePassword: vi.fn().mockResolvedValue(true),
    get2FA: vi.fn().mockResolvedValue({ success: true, data: {} }),
    set2FA: vi.fn().mockResolvedValue(true),
  },
  presence: {
    getPresence: vi.fn().mockResolvedValue({ success: true, data: [] }),
    startPolling: vi.fn().mockResolvedValue({ success: true }),
    stopPolling: vi.fn().mockResolvedValue({ success: true }),
    getRecentGames: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getRobuxBalance: vi.fn().mockResolvedValue({ success: true, data: 0 }),
  },
  advanced: {
    clearCache: vi.fn().mockResolvedValue(undefined),
    exportData: vi.fn().mockResolvedValue({ success: true, data: {} }),
    deleteAllAccounts: vi.fn().mockResolvedValue({ success: true }),
  },
  shell: {
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  theme: {
    get: vi.fn().mockResolvedValue({ success: true, data: { settings: { theme: 'dark', primaryColor: '#DE350D', accentColor: '#6347FF', fontSize: 'medium', uiDensity: 'normal', animationsEnabled: true } } }),
    set: vi.fn().mockResolvedValue({ success: true, data: { settings: { theme: 'dark' } } }),
    getCss: vi.fn().mockResolvedValue(''),
  },
  language: {
    get: vi.fn().mockResolvedValue({ success: true, data: 'es' }),
    set: vi.fn().mockResolvedValue({ success: true }),
  },
  checkAccount: vi.fn().mockResolvedValue({ success: true }),
  cookieEvents: {
    onExpiring: vi.fn().mockReturnValue(() => {}),
    onExpired: vi.fn().mockReturnValue(() => {}),
  },
};

// Global mock for window.api
if (typeof window !== 'undefined') {
  (window as any).api = mockApi;
}

export { mockApi };
