// Infrastructure: CryptoService
// AES-256-GCM encryption for cookies and passwords
//
// KEY MANAGEMENT (audit fix 2026-08-25):
//   The encryption key is derived (PBKDF2) from a local secret.
//   - If NAM_SECRET is set (env), it is used directly.
//   - If unset, a random 64-char hex key is generated once and persisted to a
//     restricted-permission file in the app's userData dir, so this
//     installation keeps a STABLE non-public key across restarts.
//   There is deliberately NO hardcoded fallback key — a public default key
//   would let anyone with DB access decrypt every stored cookie/password.

import crypto from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, chmodSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 16;
const PBKDF2_ITERATIONS = 100_000;
const SECRET_FILE = '.nam-secret';

// Resolve the source-of-truth secret. Sync + cached.
let cachedSecret: Buffer | null = null;

// Resolve a stable directory for the persisted secret file.
export function secretDir(): string {
  if (process.env.NAM_DATA_DIR && process.env.NAM_DATA_DIR.trim() !== '') {
    return process.env.NAM_DATA_DIR.trim();
  }
  // Prefer Electron's userData dir; fall back to cwd (tests/CLI).
  let dir = process.cwd();
  try {
    const { app } = require('electron');
    dir = app.getPath('userData');
  } catch {
    dir = process.cwd();
  }
  return dir;
}

function loadOrCreateSecret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.NAM_SECRET;
  if (fromEnv && fromEnv.trim().length >= 16) {
    cachedSecret = Buffer.from(fromEnv, 'utf8');
    return cachedSecret;
  }
  const secretPath = join(secretDir(), SECRET_FILE);
  try { mkdirSync(secretDir(), { recursive: true }); } catch { /* best-effort */ }
  if (existsSync(secretPath)) {
    cachedSecret = Buffer.from(readFileSync(secretPath, 'utf8').trim(), 'utf8');
    return cachedSecret;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    writeFileSync(secretPath, generated, { flag: 'wx', mode: 0o600 });
    chmodSync(secretPath, 0o600);
  } catch {
    // Concurrent creation or fs failure — still use the generated value for this run.
  }
  cachedSecret = Buffer.from(generated, 'utf8');
  return cachedSecret;
}

function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(loadOrCreateSecret(), salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
}

export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64');
  const salt = data.subarray(0, 16);
  const iv = data.subarray(16, 32);
  const tag = data.subarray(32, 48);
  const encrypted = data.subarray(48);
  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function hashCookie(cookie: string): string {
  // HMAC-SHA256 keyed with the local secret (not a public salt). Prevents
  // offline preimage/rainbow attacks and correlating identical cookies via
  // identical hashes. Output truncated to 16 hex chars (matches stored schema).
  return crypto
    .createHmac('sha256', loadOrCreateSecret())
    .update(cookie)
    .digest('hex')
    .substring(0, 16);
}
