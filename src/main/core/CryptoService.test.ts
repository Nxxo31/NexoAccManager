import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from './CryptoService';

describe('CryptoService', () => {
  let crypto: CryptoService;

  beforeEach(() => {
    crypto = new CryptoService();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = '_|WARNING:-DO-NOT-SHARE|_test_cookie_value_12345';
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext (random IV)', () => {
      const plaintext = 'test_data';
      const encrypted1 = crypto.encrypt(plaintext);
      const encrypted2 = crypto.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce encrypted format with 3 parts separated by colon', () => {
      const encrypted = crypto.encrypt('test');

      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle empty string', () => {
      const encrypted = crypto.encrypt('');
      const decrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Número ñ español 日本語 emoji 🔒';
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle very long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decrypt error handling', () => {
    it('should throw on invalid format (less than 3 parts)', () => {
      expect(() => crypto.decrypt('invalid')).toThrow('Formato');
    });

    it('should throw on invalid format (more than 3 parts)', () => {
      expect(() => crypto.decrypt('a:b:c:d')).toThrow('Formato');
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'test_data';
      const encrypted = crypto.encrypt(plaintext);
      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      const tampered = `${parts[0]}:${parts[1]}xyz:${parts[2]}`;

      expect(() => crypto.decrypt(tampered)).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const plaintext = 'test_data';
      const encrypted = crypto.encrypt(plaintext);
      const parts = encrypted.split(':');
      // Tamper with the auth tag
      const tampered = `${parts[0]}:${parts[1]}:00000000000000000000000000000000`;

      expect(() => crypto.decrypt(tampered)).toThrow();
    });

    it('should throw on invalid IV', () => {
      const plaintext = 'test_data';
      const encrypted = crypto.encrypt(plaintext);
      const parts = encrypted.split(':');
      // Use invalid IV
      const tampered = `zzzz:${parts[1]}:${parts[2]}`;

      expect(() => crypto.decrypt(tampered)).toThrow();
    });
  });

  describe('key rotation', () => {
    it('should return false (hardware-derived key cannot be rotated)', async () => {
      const result = await crypto.rotateKey();
      expect(result).toBe(false);
    });
  });

  describe('consistency', () => {
    it('should decrypt multiple encrypted values correctly', () => {
      const values = ['value1', 'value2', 'value3', '_|WARNING:-DO-NOT-SHARE|_cookie'];
      const encrypted = values.map(v => crypto.encrypt(v));
      const decrypted = encrypted.map(e => crypto.decrypt(e));

      expect(decrypted).toEqual(values);
    });

    it('same instance should decrypt its own encryptions', () => {
      const plaintext = 'consistency_test';
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);
      const reDecrypted = crypto.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(reDecrypted).toBe(plaintext);
    });
  });
});
