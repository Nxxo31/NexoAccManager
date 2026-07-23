// Infrastructure: CryptoService
// AES-256-GCM encryption for cookies and passwords
// Preservado del código original — ya estaba bien encapsulado

import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 16;
const TAG_LEN = 16;
const PBKDF2_ITERATIONS = 100_000;

function deriveKey(salt: Buffer): Buffer {
  const secret = process.env.NAM_SECRET || 'nexoacc-default-salt-DO-NOT-CHANGE';
  return crypto.pbkdf2Sync(secret, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
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
  return crypto.createHash('sha256').update(cookie).digest('hex').substring(0, 16);
}
