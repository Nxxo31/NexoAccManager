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

  describe('loadOrCreateSecret — file system path (lines 55-71)', () => {
    // These tests exercise the non-env branch: NAM_SECRET unset → must
    // generate and persist a 32-byte hex secret to disk. Each test isolates
    // itself with vi.resetModules() + mocked fs so module-level
    // cachedSecret does not leak between cases.

    function freshModuleWithMocks(opts: {
          existsSyncImpl: (path: string) => boolean
          writeFileSyncImpl?: (path: string, data: string, opts?: any) => void
          readFileSyncImpl?: (path: string, enc?: string) => string
        }) {
          delete process.env.NAM_SECRET
          vi.resetModules()
          vi.doMock('node:fs', () => ({
            readFileSync: vi.fn(opts.readFileSyncImpl ?? (() => '')),
            writeFileSync: vi.fn(opts.writeFileSyncImpl ?? (() => {})),
            existsSync: vi.fn(opts.existsSyncImpl),
            chmodSync: vi.fn(),
            mkdirSync: vi.fn(),
          }))
          vi.doMock('electron', () => {
            throw new Error('no electron in tests')
          })
          // Return a Promise — every caller must `await` it.
          return import('../../src/infrastructure/database/CryptoService')
        }

        it('generates and persists a new 32-byte hex secret when none exists (line 55-58)', async () => {
          let writeArgs: any = null
          const mod = await freshModuleWithMocks({
            existsSyncImpl: () => false, // secret file does not yet exist
            writeFileSyncImpl: (path, data, opts) => {
              writeArgs = { path, data, opts }
            },
          })
          // Force loadOrCreateSecret by triggering an encrypt().
          mod.encrypt('seed')
          expect(writeArgs).not.toBeNull()
          expect(writeArgs.opts.flag).toBe('wx') // exclusive create
          expect(writeArgs.opts.mode).toBe(0o600)
          expect(writeArgs.data).toMatch(/^[a-f0-9]{64}$/) // 32 random bytes hex-encoded
        })

        it('reads existing secret file when one is already on disk (line 51-53)', async () => {
          const preKnown = 'b'.repeat(64) // any 64-hex value
          let readCount = 0
          const stored = preKnown
          const mod = await freshModuleWithMocks({
            existsSyncImpl: () => true,
            readFileSyncImpl: () => {
              readCount++
              return stored
            },
          })
          const ciphertext = mod.encrypt('x')
          expect(ciphertext).toBeTruthy()
          // readFileSync should have been invoked for the cached secret.
          expect(readCount).toBeGreaterThan(0)
        })

        it('recovers from race-condition writeFileSync EEXIST by re-reading the secret (line 59-67)', async () => {
          // First existsSync → false (no file).
          // writeFileSync throws EEXIST because another process beat us to it.
          // Second existsSync → true (the other process wrote it).
          // We then readFileSync to recover.
          let existsCalls = 0
          let readCalls = 0
          const preExistingSecret = 'c'.repeat(64)
          const mod = await freshModuleWithMocks({
            existsSyncImpl: () => {
              existsCalls++
              // 1st call (line 51): file does not exist → enter write branch.
              // 2nd call (line 64): file now exists (raced) → recover branch.
              return existsCalls >= 2
            },
            writeFileSyncImpl: () => {
              const e: any = new Error('EEXIST')
              e.code = 'EEXIST'
              throw e
            },
            readFileSyncImpl: () => {
              readCalls++
              return preExistingSecret
            },
          })
          const ciphertext = mod.encrypt('race-test')
          expect(ciphertext).toBeTruthy()
          expect(existsCalls).toBeGreaterThanOrEqual(2)
          expect(readCalls).toBeGreaterThanOrEqual(1)
        })

        it('falls back to generated secret when EEXIST but file vanished between exists calls (line 68-71)', async () => {
          // existsSync returns false both times (line 51: false → write branch;
          // line 64: false → "raro" branch → use generated for this run).
          let writeCalled = false
          let existsCalls = 0
          const mod = await freshModuleWithMocks({
            existsSyncImpl: () => {
              existsCalls++
              return false
            },
            writeFileSyncImpl: () => {
              writeCalled = true
              const e: any = new Error('EEXIST')
              e.code = 'EEXIST'
              throw e
            },
          })
          const ciphertext = mod.encrypt('vanished')
          expect(writeCalled).toBe(true)
          expect(existsCalls).toBeGreaterThanOrEqual(2)
          expect(ciphertext).toBeTruthy() // encryption proceeds with the in-memory generated secret
        })

    it('secretDir() honors NAM_DATA_DIR env var', async () => {
      vi.resetModules()
      vi.doMock('electron', () => {
        throw new Error('no electron in tests')
      })
      process.env.NAM_DATA_DIR = '/custom/data/dir'
      const mod = await import('../../src/infrastructure/database/CryptoService')
      expect(mod.secretDir()).toBe('/custom/data/dir')
      delete process.env.NAM_DATA_DIR
    })
  })
})