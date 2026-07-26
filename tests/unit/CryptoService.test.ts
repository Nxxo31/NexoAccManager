/**
 * Unit tests — CryptoService (AES-256-GCM)
 * Verifica el round-trip encrypt → decrypt, determinismo de hashCookie,
 * y robustez ante tampering (modificación del ciphertext).
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hashCookie } from '../../src/infrastructure/database/CryptoService';

describe('CryptoService', () => {
  describe('encrypt + decrypt round-trip', () => {
    it('roundtrip de string simple', () => {
      const plaintext = 'hello world';
      const ciphertext = encrypt(plaintext);
      expect(ciphertext).not.toBe(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it('roundtrip de cookie .ROBLOSECURITY largo', () => {
      const cookie = '|CookieStuff|123456789|987654321|abcdef0123456789|verylongstringhere';
      const ciphertext = encrypt(cookie);
      expect(decrypt(ciphertext)).toBe(cookie);
    });

    it('roundtrip de string vacío', () => {
      const plaintext = '';
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe('');
    });

    it('roundtrip de unicode (emoji, acentos)', () => {
      const plaintext = 'Sebastián — ñoño — 🎮 — 日本語';
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it('cifra diferente cada vez (IV aleatorio)', () => {
      const plaintext = 'same-input';
      const c1 = encrypt(plaintext);
      const c2 = encrypt(plaintext);
      expect(c1).not.toBe(c2);
      // Ambos descifran al mismo original
      expect(decrypt(c1)).toBe(plaintext);
      expect(decrypt(c2)).toBe(plaintext);
    });

    it('ciphertext es base64 válido', () => {
      const ciphertext = encrypt('test');
      // base64: solo A-Z a-z 0-9 + / =
      expect(ciphertext).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    });
  });

  describe('decrypt — tampering detection', () => {
    it('falla si se modifica un byte del ciphertext (GCM auth tag)', () => {
      const ciphertext = encrypt('secreto');
      // Decodificar base64, mutar un byte del cuerpo cifrado (offset 48+), re-encode
      const buf = Buffer.from(ciphertext, 'base64');
      // Mutar el primer byte AFTER the 48-byte header (salt+iv+tag)
      if (buf.length > 48) {
        buf[48] = buf[48] ^ 0xff;
      }
      const tampered = buf.toString('base64');
      expect(() => decrypt(tampered)).toThrow();
    });

    it('falla con base64 inválido', () => {
      expect(() => decrypt('!!!not-base64!!!')).toThrow();
    });
  });

  describe('hashCookie', () => {
    it('es determinista — mismo input, mismo output', () => {
      const cookie = '.ROBLOSECURITY|12345';
      expect(hashCookie(cookie)).toBe(hashCookie(cookie));
    });

    it('distinto input → distinto output', () => {
      expect(hashCookie('cookie-a')).not.toBe(hashCookie('cookie-b'));
    });

    it('output es hex string de 16 chars (64 bits)', () => {
      const hash = hashCookie('test');
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });
});
