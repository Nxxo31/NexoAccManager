import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RobloxAuthService } from './RobloxAuthService';

let service: RobloxAuthService;

beforeEach(() => {
  service = new RobloxAuthService();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RobloxAuthService', () => {
  it('throws error when username or password missing', async () => {
    await expect(service.login('', 'password')).rejects.toThrow('Username y password son requeridos');
    await expect(service.login('username', '')).rejects.toThrow('Username y password son requeridos');
  });

  it('returns cookie when login succeeds', async () => {
    const axios = await import('axios');
    const postSpy = vi.spyOn(axios, 'post');
    const getSpy = vi.spyOn(axios, 'get');

    postSpy
      .mockResolvedValueOnce({ status: 403, headers: { 'x-csrf-token': 'test-csrf-token' } })
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          'set-cookie': ['.ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE|_12345ABCDEF; Path=/; HttpOnly'],
        },
        data: { user: { id: 67890, name: 'TestUser' } },
      });

    // The verifyCookie call (get) will be made after the login post
    getSpy.mockResolvedValueOnce({ status: 200 });

    const result = await service.login('testuser', 'testpass');
    expect(result).toEqual({
      cookie: '_|WARNING:-DO-NOT-SHARE|_12345ABCDEF',
      userId: 67890,
      username: 'TestUser',
    });
  });

  it('throws 2FA error when account requires 2FA', async () => {
    const axios = await import('axios');
    const postSpy = vi.spyOn(axios, 'post');

    postSpy
      .mockResolvedValueOnce({ status: 403, headers: { 'x-csrf-token': 'test-csrf-token' } })
      .mockResolvedValueOnce({
        status: 403,
        data: { errors: [{ code: 0, message: '2FA required' }] },
      });

    await expect(service.login('testuser', 'testpass')).rejects.toMatchObject({
      message: expect.stringContaining('verificación en dos pasos'),
      requires2FA: true,
    });
  });

  it('throws captcha error when account requires captcha', async () => {
    const axios = await import('axios');
    const postSpy = vi.spyOn(axios, 'post');

    postSpy
      .mockResolvedValueOnce({ status: 403, headers: { 'x-csrf-token': 'test-csrf-token' } })
      .mockResolvedValueOnce({
        status: 403,
        data: { errors: [{ code: 1, message: 'captcha required' }] },
      });

    await expect(service.login('testuser', 'testpass')).rejects.toMatchObject({
      message: expect.stringContaining('captcha'),
      requiresCaptcha: true,
    });
  });
});