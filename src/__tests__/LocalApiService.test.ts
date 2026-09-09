import { describe, it, expect } from 'vitest'
import { isSafeId } from '../../src/infrastructure/external/LocalApiService'

describe('LocalApiService validation functions', () => {
  describe('isSafeId', () => {
    it('should return true for valid IDs', () => {
      expect(isSafeId('valid_id')).toBe(true)
      expect(isSafeId('Valid-ID_123')).toBe(true)
      expect(isSafeId('a')).toBe(true) // Minimum length
      expect(isSafeId('A'.repeat(64))).toBe(true) // Maximum length
    })

    it('should return false for invalid IDs', () => {
      expect(isSafeId('')).toBe(false) // Empty string
      expect(isSafeId('id with spaces')).toBe(false) // Spaces
      expect(isSafeId('id@invalid')).toBe(false) // Special character
      expect(isSafeId('A'.repeat(65))).toBe(false) // Too long
      // @ts-ignore
      expect(isSafeId(null)).toBe(false)
      // @ts-ignore
      expect(isSafeId(undefined)).toBe(false)
    })
  })
})