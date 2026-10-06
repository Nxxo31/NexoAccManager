import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache } from '../infrastructure/database/LRUCache'

describe('LRUCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic get/set', () => {
    it('returns undefined for missing keys', () => {
      const cache = new LRUCache<string, number>()
      expect(cache.get('nope')).toBeUndefined()
    })

    it('stores and retrieves a value', () => {
      const cache = new LRUCache<string, number>()
      cache.set('a', 1)
      expect(cache.get('a')).toBe(1)
    })

    it('overwrites the value when the same key is set twice', () => {
      const cache = new LRUCache<string, number>()
      cache.set('a', 1)
      cache.set('a', 2)
      expect(cache.get('a')).toBe(2)
    })

    it('reports size', () => {
      const cache = new LRUCache<string, number>()
      expect(cache.size).toBe(0)
      cache.set('a', 1)
      cache.set('b', 2)
      expect(cache.size).toBe(2)
    })
  })

  describe('TTL expiry', () => {
    it('returns undefined after default TTL elapses', () => {
      const cache = new LRUCache<string, number>(10, 1000)
      cache.set('a', 1)
      expect(cache.get('a')).toBe(1)
      vi.advanceTimersByTime(1001)
      expect(cache.get('a')).toBeUndefined()
    })

    it('honors a per-call TTL override', () => {
      const cache = new LRUCache<string, number>(10, 10_000)
      cache.set('a', 1, 500)
      vi.advanceTimersByTime(501)
      expect(cache.get('a')).toBeUndefined()
    })

    it('removes the expired entry from the underlying map', () => {
      const cache = new LRUCache<string, number>(10, 1000)
      cache.set('a', 1)
      vi.advanceTimersByTime(1001)
      cache.get('a')
      expect(cache.size).toBe(0)
    })
  })

  describe('LRU eviction (maxSize)', () => {
    it('evicts the oldest entry when capacity is exceeded', () => {
      const cache = new LRUCache<string, number>(2)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3) // should evict 'a'
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
    })

    it('promotes a touched key to most-recently-used', () => {
      const cache = new LRUCache<string, number>(2)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.get('a') // touches 'a', so 'b' becomes the oldest
      cache.set('c', 3) // evicts 'b' instead of 'a'
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('c')).toBe(3)
    })

    it('handles maxSize of 1', () => {
      const cache = new LRUCache<string, number>(1)
      cache.set('a', 1)
      cache.set('b', 2)
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
      expect(cache.size).toBe(1)
    })
  })

  describe('invalidate / clear', () => {
    it('invalidate removes a single key', () => {
      const cache = new LRUCache<string, number>()
      cache.set('a', 1)
      cache.set('b', 2)
      cache.invalidate('a')
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
      expect(cache.size).toBe(1)
    })

    it('invalidate is a no-op for missing keys', () => {
      const cache = new LRUCache<string, number>()
      cache.set('a', 1)
      cache.invalidate('missing')
      expect(cache.get('a')).toBe(1)
      expect(cache.size).toBe(1)
    })

    it('clear empties the cache', () => {
      const cache = new LRUCache<string, number>()
      cache.set('a', 1)
      cache.set('b', 2)
      cache.clear()
      expect(cache.size).toBe(0)
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBeUndefined()
    })
  })
})