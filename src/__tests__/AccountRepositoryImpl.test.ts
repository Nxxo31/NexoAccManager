// AccountRepositoryImpl — suite 6 (autorizada por el operador 2026-10-08).
// Fake SQLite en memoria: ejecuta el SQL real del repo contra estructuras en
// memoria. Mismo patrón que BackupRepositoryImpl.test.ts (better-sqlite3 no
// tiene binario para Node 24 sin VS Build Tools C++ workload).

import { describe, it, expect, vi, beforeEach } from 'vitest'

type Row = Record<string, unknown>

const mockState = vi.hoisted(() => {
  const tables = new Map<string, Row[]>()
  const ensure = (name: string) => {
    const key = name.toLowerCase()
    if (!tables.has(key)) tables.set(key, [])
    return tables.get(key)!
  }
  const rowsFor = (sql: string): { table: string; rows: Row[] } => {
    const m = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i)
    if (!m) throw new Error(`fake-db: no tabla en ${sql}`)
    return { table: m[1], rows: ensure(m[1]) }
  }
  const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim().toUpperCase()

  // Matches a WHERE clause and returns a predicate over a row.
  // Supports `col = ?` (positional param) and `col = <literal>` (e.g. is_favorite = 1).
  function whereMatcher(sql: string, params: unknown[], paramOffset = 0): (r: Row) => boolean {
    const clauses: { col: string; value: unknown }[] = []
    const re = /(\w+)\s*=\s*(\?|[^)\s]+)/gi
    const whereIdx = sql.search(/\bWHERE\b/i)
    if (whereIdx < 0) return () => true
    const whereSql = sql.slice(whereIdx)
    // UPDATE statements pass SET values before the WHERE params, so the caller
    // tells us how many leading positional params the WHERE clause must skip.
    let paramIdx = paramOffset
    let m: RegExpExecArray | null
    while ((m = re.exec(whereSql))) {
      let value: unknown
      if (m[2] === '?') {
        value = params[paramIdx++]
      } else {
        const raw = m[2].replace(/^'|'$/g, '')
        value = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw
      }
      clauses.push({ col: m[1].toLowerCase(), value })
    }
    return (r) => clauses.every((c) => r[c.col] === c.value)
  }

  function runDelete(sql: string, params: unknown[]) {
    const { rows } = rowsFor(sql)
    const matches = whereMatcher(sql, params)
    const before = rows.length
    for (let i = rows.length - 1; i >= 0; i--) {
      if (matches(rows[i])) rows.splice(i, 1)
    }
    return { changes: before - rows.length }
  }

  function runUpdate(sql: string, params: unknown[]) {
    const { rows } = rowsFor(sql)
    const setPart = sql.match(/SET\s+(.+?)\s+WHERE\s+(\w+)\s*=\s*\?/i)
    if (!setPart) throw new Error(`fake-db: UPDATE no soportado: ${sql}`)
    const assigns = setPart[1].split(',').map((a) => a.trim().split(/\s*=\s*/))
    const matches = whereMatcher(sql, params, assigns.length)
    const row = rows.find(matches)
    if (!row) return { changes: 0 }
    assigns.forEach(([col], i) => { row[col.toLowerCase()] = params[i] })
    return { changes: 1 }
  }

  function runInsert(sql: string, params: unknown[]) {
    const { table, rows } = rowsFor(sql)
    const m = normalize(sql).match(/^INSERT INTO \w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/)
    if (!m) throw new Error(`fake-db: INSERT no soportado: ${sql}`)
    const cols = m[1].split(',').map((c) => c.trim().toLowerCase())
    const placeholders = m[2].split(',').map((c) => c.trim())
    const row: Row = {}
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) {
      // Named-parameter form (@robloxUserId, @group, ...). The placeholder name is
      // the source of truth for the object key; the column list only gives order.
      const named = params[0] as Row
      // normalize() upper-cases the SQL, so @robloxUserId arrives as @ROBLOXUSERID.
      // Build a lowercase view of the named object to match case-insensitively,
      // mirroring better-sqlite3's real named-parameter behavior.
      const namedLower: Row = {}
      for (const [k, v] of Object.entries(named)) namedLower[k.toLowerCase()] = v
      placeholders.forEach((ph, i) => {
        if (!ph.startsWith('@')) throw new Error(`fake-db: named INSERT con ${ph}`)
        row[cols[i]] = namedLower[ph.slice(1).toLowerCase()]
      })
    } else {
      // Positional form (?, ?, ...).
      placeholders.forEach((ph, i) => {
        const col = ph.startsWith('@') ? ph.slice(1).toLowerCase() : cols[i]
        row[col] = params[i]
      })
    }
    rows.push(row)
    return { changes: 1 }
  }

  const fakeDb = {
    pragma(_p: string) {},
    exec(sql: string) {
      const re = /CREATE TABLE(?: IF NOT EXISTS)? (\w+)/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(sql))) ensure(m[1])
    },
    prepare(sql: string) {
      const upper = normalize(sql)
      return {
        get(...params: unknown[]) {
          if (upper.startsWith('SELECT COUNT(*)')) {
            const { table } = rowsFor(sql)
            return { count: ensure(table).length }
          }
          const { rows } = rowsFor(sql)
          return rows.find(whereMatcher(sql, params)) ?? undefined
        },
        all(...params: unknown[]) {
          const { rows } = rowsFor(sql)
          let out = rows.filter(whereMatcher(sql, params))
          const order = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i)
          if (order) {
            const col = order[1].toLowerCase()
            const dir = order[2].toUpperCase() === 'DESC' ? -1 : 1
            out.sort((a, b) => {
              const av = a[col] as string | number
              const bv = b[col] as string | number
              if (av === bv) return 0
              return (av > bv ? 1 : -1) * dir
            })
          }
          const limit = sql.match(/LIMIT\s+\?/i)
          if (limit && typeof params[params.length - 1] === 'number') {
            out = out.slice(0, params[params.length - 1] as number)
          }
          return out.map((r) => ({ ...r }))
        },
        run(...params: unknown[]) {
          if (upper.startsWith('DELETE')) return runDelete(sql, params)
          if (upper.startsWith('UPDATE')) return runUpdate(sql, params)
          if (upper.startsWith('INSERT')) return runInsert(sql, params)
          throw new Error(`fake-db: run no soportado: ${sql}`)
        },
      }
    },
    close() { tables.clear() },
    __tables: tables,
  }

  return { userDataPath: 'C:/fake-userdata', fakeDb }
})

vi.mock('electron', () => ({
  app: {
    getPath: () => mockState.userDataPath,
    getVersion: () => '5.0.0-test',
  },
}))

vi.mock('better-sqlite3', () => ({
  default: function () { return mockState.fakeDb },
}))

import { AccountRepositoryImpl } from '../infrastructure/database/AccountRepositoryImpl'
import { closeDb } from '../infrastructure/database/DatabaseManager'
import { createAccount } from '../domain/entities/Account'
import { makeEncryptedString } from '../domain/types/EncryptedString'
import type { Account, RecentGame, FavoriteGame } from '../domain/entities/Account'

function makeAccount(overrides: Partial<Account> = {}): Account {
  return createAccount({
    id: 'acc-1',
    robloxUserId: 1001,
    username: 'tester',
    encryptedCookie: makeEncryptedString('enc-cookie'),
    cookieHash: 'hash-1',
    ...overrides,
  })
}

function makeRecent(accountId: string, overrides: Partial<RecentGame> = {}): RecentGame {
  return {
    id: 'rg-1',
    gameId: 777,
    name: 'Brookhaven',
    icon: 'http://icon',
    lastPlayed: new Date('2026-01-02T00:00:00.000Z'),
    placeId: 'place-1',
    placeName: 'Brookhaven RP',
    universeId: 999,
    ...overrides,
  }
}

function makeFavorite(accountId: string, overrides: Partial<FavoriteGame> = {}): FavoriteGame {
  return {
    id: 'fg-1',
    gameId: 777,
    name: 'Brookhaven',
    icon: 'http://icon',
    addedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

const repo = new AccountRepositoryImpl()

beforeEach(() => {
  closeDb()
  mockState.fakeDb.__tables.clear()
})

describe('AccountRepositoryImpl', () => {
  describe('create / count / getAll', () => {
    it('count returns 0 on an empty table', async () => {
      expect(await repo.count()).toBe(0)
    })

    it('create persists all account fields and count reflects the row', async () => {
      const account = makeAccount({
        group: 'Main',
        description: 'cuenta principal',
        displayName: 'Tester Display',
        savedPlaceId: 'place-9',
        savedJobId: 'job-9',
        password: makeEncryptedString('enc-pass'),
        autoRelaunch: true,
        isFavorite: true,
        fields: { email: 'a@b.com' },
        browserTrackerId: 'tracker-1',
      })
      await repo.create(account)
      expect(await repo.count()).toBe(1)
    })

    it('getAll returns created accounts ordered favorites first', async () => {
      await repo.create(makeAccount({ id: 'a', username: 'normal', isFavorite: false }))
      await repo.create(makeAccount({ id: 'b', username: 'fav', isFavorite: true }))

      const all = await repo.getAll()
      expect(all).toHaveLength(2)
      expect(all[0].id).toBe('b')
      expect(all[1].id).toBe('a')
    })

    it('getAll maps optional DB columns to account defaults', async () => {
      await repo.create(makeAccount({ id: 'sparse', displayName: 'override' }))
      const [account] = await repo.getAll()
      expect(account.cookieExpiresAt).toBeNull()
      expect(account.fields).toEqual({})
      expect(account.recentGames).toEqual([])
      expect(account.favoriteGames).toEqual([])
    })
  })

  describe('getById / getByGroup / getFavorites', () => {
    it('getById returns null when the id does not exist', async () => {
      expect(await repo.getById('nope')).toBeNull()
    })

    it('getById returns the persisted account with dates deserialized', async () => {
      const created = makeAccount({ id: 'acc-2' })
      created.createdAt = new Date('2026-03-01T10:00:00.000Z')
      await repo.create(created)

      const found = await repo.getById('acc-2')
      expect(found?.id).toBe('acc-2')
      expect(found?.username).toBe('tester')
      expect(found?.createdAt).toBeInstanceOf(Date)
      expect(found?.createdAt.toISOString()).toBe('2026-03-01T10:00:00.000Z')
    })

    it('getByGroup returns only accounts in that group', async () => {
      await repo.create(makeAccount({ id: 'g1', group: 'Main' }))
      await repo.create(makeAccount({ id: 'g2', group: 'Alt' }))
      const main = await repo.getByGroup('Main')
      expect(main.map((a) => a.id)).toEqual(['g1'])
    })

    it('getFavorites returns only accounts flagged favorite', async () => {
      await repo.create(makeAccount({ id: 'fav', isFavorite: true }))
      await repo.create(makeAccount({ id: 'plain', isFavorite: false }))
      const favs = await repo.getFavorites()
      expect(favs.map((a) => a.id)).toEqual(['fav'])
    })
  })

  describe('update', () => {
    it('update writes only the changed columns', async () => {
      await repo.create(makeAccount({ id: 'u1', description: 'antes' }))
      await repo.update('u1', { description: 'despues' })

      const found = await repo.getById('u1')
      expect(found?.description).toBe('despues')
      expect(found?.username).toBe('tester')
    })

    it('update supports boolean flags converting to integer', async () => {
      await repo.create(makeAccount({ id: 'u2', isFavorite: false, autoRelaunch: false }))
      await repo.update('u2', { isFavorite: true, autoRelaunch: true })

      const found = await repo.getById('u2')
      expect(found?.isFavorite).toBe(true)
      expect(found?.autoRelaunch).toBe(true)
    })

    it('update serializes the fields object as JSON', async () => {
      await repo.create(makeAccount({ id: 'u3' }))
      await repo.update('u3', { fields: { email: 'nuevo@correo.com', tier: 'pro' } })

      const found = await repo.getById('u3')
      expect(found?.fields).toEqual({ email: 'nuevo@correo.com', tier: 'pro' })
    })

    it('update stores cookieExpiresAt null when the Date is cleared', async () => {
      await repo.create(makeAccount({ id: 'u4', cookieExpiresAt: new Date('2026-12-31T00:00:00.000Z') }))
      await repo.update('u4', { cookieExpiresAt: null })
      expect((await repo.getById('u4'))?.cookieExpiresAt).toBeNull()
    })

    it('update with no recognized fields is a no-op', async () => {
      await repo.create(makeAccount({ id: 'u5', description: 'intacta' }))
      await repo.update('u5', {})
      expect((await repo.getById('u5'))?.description).toBe('intacta')
    })
  })

  describe('delete / updateLastUsed', () => {
    it('delete removes the account row', async () => {
      await repo.create(makeAccount({ id: 'd1' }))
      await repo.delete('d1')
      expect(await repo.getById('d1')).toBeNull()
      expect(await repo.count()).toBe(0)
    })

    it('updateLastUsed writes a timestamp for the account', async () => {
      await repo.create(makeAccount({ id: 'lu1' }))
      await repo.updateLastUsed('lu1')
      const found = await repo.getById('lu1')
      expect(found?.lastUsed).toBeInstanceOf(Date)
    })
  })

  describe('recent games', () => {
    it('saveRecentGame then getRecentGames returns the stored row', async () => {
      await repo.saveRecentGame('r1', makeRecent('r1'))
      const games = await repo.getRecentGames('r1')
      expect(games).toHaveLength(1)
      expect(games[0].gameId).toBe(777)
      expect(games[0].lastPlayed).toBeInstanceOf(Date)
    })

    it('getRecentGames scopes rows to the requested account', async () => {
      await repo.saveRecentGame('r1', makeRecent('r1'))
      await repo.saveRecentGame('r2', makeRecent('r2', { id: 'rg-2' }))
      expect(await repo.getRecentGames('r1')).toHaveLength(1)
    })

    it('getRecentGames respects the limit argument', async () => {
      await repo.saveRecentGame('r1', makeRecent('r1', { id: 'old', lastPlayed: new Date('2026-01-01') }))
      await repo.saveRecentGame('r1', makeRecent('r1', { id: 'new', lastPlayed: new Date('2026-05-01') }))
      const games = await repo.getRecentGames('r1', 1)
      expect(games).toHaveLength(1)
      expect(games[0].id).toBe('new')
    })
  })

  describe('favorite games', () => {
    it('saveFavoriteGame then getFavoriteGames returns the stored row', async () => {
      await repo.saveFavoriteGame('f1', makeFavorite('f1'))
      const games = await repo.getFavoriteGames('f1')
      expect(games).toHaveLength(1)
      expect(games[0].gameId).toBe(777)
      expect(games[0].addedAt).toBeInstanceOf(Date)
    })

    it('removeFavoriteGame deletes only the matching game for that account', async () => {
      await repo.saveFavoriteGame('f1', makeFavorite('f1', { gameId: 1 }))
      await repo.saveFavoriteGame('f1', makeFavorite('f1', { id: 'fg-2', gameId: 2 }))
      await repo.saveFavoriteGame('other', makeFavorite('other', { id: 'fg-3', gameId: 1 }))

      await repo.removeFavoriteGame('f1', 1)

      expect((await repo.getFavoriteGames('f1')).map((g) => g.gameId)).toEqual([2])
      expect(await repo.getFavoriteGames('other')).toHaveLength(1)
    })

    it('getFavoriteGames returns empty array when none stored', async () => {
      expect(await repo.getFavoriteGames('none')).toEqual([])
    })
  })
})
