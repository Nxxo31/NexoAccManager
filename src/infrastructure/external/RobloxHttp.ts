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

// Un solo lugar para obtener CSRF token.
//
// EXT-001 (audit v4.0.7): el POST a /v2/logout usa `validateStatus: () => true`,
// así que axios NO lanza — resuelve con el response en el path de éxito. La versión
// previa solo buscaba el header dentro del catch block, por lo que NUNCA encontraba
// el token. Roblox responde 403 con `x-csrf-token` cuando el token CSRF falta o es
// inválido: ese response contiene el token justo en el camino de NO-error.
//
// EXT-002 (audit v4.0.7): se elimina `err.cookie = cookie` — el Error ya no arrastra
// la cookie cruda, evitando que se filtre en mensajes de IPC hacia el renderer.
const csrfCache = new Map<string, string>();

function extractCsrfToken(res: { headers?: Record<string, unknown> | unknown }): string | undefined {
  const headers = res.headers as Record<string, unknown> | undefined;
  const raw = headers?.['x-csrf-token'];
  if (Array.isArray(raw)) return typeof raw[0] === 'string' ? raw[0] : undefined;
  return typeof raw === 'string' ? raw : undefined;
}

export async function getCsrfToken(cookie: string): Promise<string> {
  const cached = csrfCache.get(cookie);
  if (cached) return cached;

  // validateStatus: () => true => axios never throws; the response (200, 403, etc.)
  // is returned. Roblox returns 403 with `x-csrf-token` when CSRF is missing.
  const res = await httpClient.post(`${AUTH_BASE}/v2/logout`, null, {
    headers: { Cookie: cookieHeader(cookie) },
    validateStatus: () => true,
  });
  const token = extractCsrfToken(res);
  if (token) {
    csrfCache.set(cookie, token);
    return token;
  }
  throw new Error('No se pudo obtener CSRF token');
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
