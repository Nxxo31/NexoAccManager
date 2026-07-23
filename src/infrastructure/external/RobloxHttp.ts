// Infrastructure: Shared Roblox HTTP helpers
// ELIMINA la duplicación de: CSRF token (6 copias), cookie header (22+ copias), 401/403 pattern (3 copias)

import axios, { type AxiosInstance } from 'axios';

const ROBLOX_BASE = 'https://www.roblox.com';
const AUTH_BASE = 'https://auth.roblox.com';

// Un solo client HTTP reutilizable
const httpClient: AxiosInstance = axios.create({ timeout: 15_000 });

// Un solo lugar para construir el cookie header
export function cookieHeader(cookie: string): string {
  return `.ROBLOSECURITY=${cookie};`;
}

// Un solo lugar para obtener CSRF token
const csrfCache = new Map<string, string>();

export async function getCsrfToken(cookie: string): Promise<string> {
  if (csrfCache.has(cookie)) return csrfCache.get(cookie)!;
  try {
    await httpClient.post(`${AUTH_BASE}/v2/logout`, null, {
      headers: { Cookie: cookieHeader(cookie) },
      validateStatus: () => true,
    });
  } catch (err: unknown) {
    const headers = (err as { response?: { headers?: Record<string, string> } }).response?.headers;
    const token = headers?.['x-csrf-token'];
    if (token) {
      csrfCache.set(cookie, token);
      return token;
    }
  }
  const err = new Error('No se pudo obtener CSRF token') as Error & { cookie?: string };
  err.cookie = cookie;
  throw err;
}

// GET wrapper con manejo de 401/403 unificado
export async function apiGet<T>(url: string, cookie?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (cookie) headers.Cookie = cookieHeader(cookie);
  try {
    const res = await httpClient.get<T>(url, { headers });
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 || status === 403) throw new Error('Cookie inválida o expirada');
    throw err;
  }
}

// POST wrapper con CSRF + cookie + error handling unificado
export async function apiPost<T>(url: string, cookie: string, body?: unknown): Promise<T> {
  const csrf = await getCsrfToken(cookie);
  try {
    const res = await httpClient.post<T>(url, body, {
      headers: { Cookie: cookieHeader(cookie), 'X-CSRF-TOKEN': csrf, 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 || status === 403) throw new Error('Cookie inválida o expirada');
    throw err;
  }
}

export { httpClient, ROBLOX_BASE, AUTH_BASE };
