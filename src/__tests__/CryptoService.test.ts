import { describe, it, expect, vi, beforeEach } from 'vitest'
import { encrypt, decrypt, hashCookie } from '../../src/infrastructure/database/CryptoService'

describe('CryptoService', () => {
  beforeEach(() => {
    // Reset cached secret before each test
    // @ts-ignore
    vi.resetModules()
  })

  describe('encrypt/decrypt roundtrip', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'test password 123!@#'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
      expect(encrypted).not.toBe(plaintext) // Should be different
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('hashCookie', () => {
    it('should produce consistent hash for same input', () => {
      const cookie = 'test_cookie_value'
      const hash1 = hashCookie(cookie)
      const hash2 = hashCookie(cookie)
      
      expect(hash1).toBe(hash2)
      expect(hash1.length).toBe(16) // Should be truncated to 16 hex chars
    })

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashCookie('cookie1')
      const hash2 = hashCookie('cookie2')
      
      expect(hash1).not.toBe(hash2)
    })
  })
})