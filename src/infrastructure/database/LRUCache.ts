// Infrastructure: Generic LRU Cache with TTL
// Replaces the 4 duplicated LRU caches in Presence, Games, Servers, AccountSettings

export class LRUCache<K, V> {
  private map = new Map<K, { value: V; expires: number }>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 100, defaultTtlMs = 60_000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtlMs;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, { value, expires: Date.now() + (ttlMs ?? this.defaultTtl) });
  }

  invalidate(key: K): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
