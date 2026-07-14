import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures the mock fns exist before vi.mock runs (which is hoisted to top)
const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { post: mockPost, get: mockGet },
  AxiosError: class AxiosError extends Error {},
}));

import { RobloxAuthService } from './RobloxAuthService';

let service: RobloxAuthService;

beforeEach(() => {
  service = new RobloxAuthService();
  mockPost.mockClear();
  mockGet.mockClear();
});

describe('RobloxAuthService', () => {
  it('throws error when username or password missing', async () => {
    await expect(service.login('', 'password')).rejects.toThrow('Username y password son requeridos');
    await expect(service.login('username', '')).rejects.toThrow('Username y password son requeridos');
  });

  it('returns cookie when login succeeds', async () => {
    // First post: get CSRF token (403 + x-csrf-token header)
    mockPost.mockResolvedValueOnce({
      status: 403,
      headers: { 'x-csrf-token': 'test-csrf-token' },
      data: {},
    });

    // Second post: actual login (200 + set-cookie)
    mockPost.mockResolvedValueOnce({
      status: 200,
      headers: {
        'set-cookie': ['.ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE|_12345ABCDEF; Path=/; HttpOnly'],
      },
      data: { user: { id: 67890, name: 'TestUser' } },
    });

    // get: verify cookie
    mockGet.mockResolvedValueOnce({ status: 200, data: { id: 67890, name: 'TestUser' } });

    const result = await service.login('testuser', 'testpass');
    expect(result).toEqual({
      cookie: '_|WARNING:-DO-NOT-SHARE|_12345ABCDEF',
      userId: 67890,
      username: 'TestUser',
    });
  });

  it('throws 2FA error when account requires 2FA', async () => {
    mockPost.mockResolvedValueOnce({
      status: 403,
      headers: { 'x-csrf-token': 'test-csrf-token' },
      data: {},
    });

    mockPost.mockResolvedValueOnce({
      status: 403,
      data: { errors: [{ code: 0, message: '2FA required' }] },
    });

    await expect(service.login('testuser', 'testpass')).rejects.toMatchObject({
      message: expect.stringContaining('verificación en dos pasos'),
      requires2FA: true,
    });
  });

  it('throws captcha error when account requires captcha', async () => {
    mockPost.mockResolvedValueOnce({
      status: 403,
      headers: { 'x-csrf-token': 'test-csrf-token' },
      data: {},
    });

    mockPost.mockResolvedValueOnce({
      status: 403,
      data: { errors: [{ code: 1, message: 'captcha required' }] },
    });

    await expect(service.login('testuser', 'testpass')).rejects.toMatchObject({
      message: expect.stringContaining('captcha'),
      requiresCaptcha: true,
    });
  });
});
