import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

const mockState = vi.hoisted(() => {
  // Captures the HTTP handler + WS upgrade handler + connection handler
  // so tests can invoke them directly with fake req/res without binding a port.
  const captured: {
    httpHandler: ((req: any, res: any) => void) | null
    wsConnectionHandler: ((ws: any) => void) | null
    wsUpgradeListener: ((req: any, socket: any, head: any) => void) | null
    serverErrorHandler: ((err: any) => void) | null
  } = {
    httpHandler: null,
    wsConnectionHandler: null,
    wsUpgradeListener: null,
    serverErrorHandler: null,
  }
  return {
    captured,
    accounts: new Map<string, any>(),
    lastBottingStatus: { running: false, accounts: [] as string[] },
    launchCalls: [] as Array<{ placeId: string; jobId: string; cookie: string }>,
    refreshCalls: [] as Array<{ oldCookie: string; newCookie: string }>,
    updateCalls: [] as Array<{ id: string; partial: any }>,
    updateLastUsedCalls: [] as string[],
    killCalls: [] as string[],
    startBottingCalls: [] as Array<{ accountId: string; placeId: string; interval: number }>,
    stopBottingCalls: 0,
    tasklistOutput: '"PID eq 1234","name","session"\r\n"1234","Roblox","1"\r\n',
  }
})

// Mock electron (LocalApiService does not import electron directly but the
// file at top-level imports AccountRepositoryImpl which does — keep it safe).
vi.mock('electron', () => ({}))

vi.mock('../../src/infrastructure/database/AccountRepositoryImpl', () => ({
  AccountRepositoryImpl: class MockAccountRepo {
    async getAll() {
      return Array.from(mockState.accounts.values())
    }
    async getById(id: string) {
      return mockState.accounts.get(id) ?? null
    }
    async update(id: string, partial: any) {
      mockState.updateCalls.push({ id, partial })
      const existing = mockState.accounts.get(id)
      if (existing) mockState.accounts.set(id, { ...existing, ...partial })
    }
    async updateLastUsed(id: string) {
      mockState.updateLastUsedCalls.push(id)
      const existing = mockState.accounts.get(id)
      if (existing) mockState.accounts.set(id, { ...existing, lastUsed: new Date() })
    }
  },
}))

vi.mock('../../src/infrastructure/external/RobloxBottingService', () => ({
  launchRobloxDirect: vi.fn(async (placeId: string, jobId: string, cookie: string) => {
    mockState.launchCalls.push({ placeId, jobId, cookie })
    return 4242
  }),
  startBotting: vi.fn(async (accountId: string, placeId: string, interval: number) => {
    mockState.startBottingCalls.push({ accountId, placeId, interval })
  }),
  stopBotting: vi.fn(async () => {
    mockState.stopBottingCalls++
  }),
  getBottingStatus: vi.fn(() => mockState.lastBottingStatus),
}))

vi.mock('../../src/infrastructure/external/MultiRobloxService', () => ({
  killInstance: vi.fn(async (accountId: string) => {
    mockState.killCalls.push(accountId)
  }),
}))

vi.mock('../../src/infrastructure/external/RobloxCookieService', () => ({
  refreshCookie: vi.fn(async (oldCookie: string) => {
    mockState.refreshCalls.push({ oldCookie, newCookie: oldCookie + '_refreshed' })
    return oldCookie + '_refreshed'
  }),
}))

vi.mock('../../src/infrastructure/database/CryptoService', () => ({
  decrypt: (s: string) => s.replace(/^ENC:/, ''),
  encrypt: (s: string) => 'ENC:' + s,
  hashCookie: (s: string) => 'HASH:' + s.slice(0, 8),
  secretDir: () => '/tmp/test',
}))

vi.mock('../../src/infrastructure/logging/logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}))

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}))

// LocalApiService does `const execAsync = promisify(exec)` at top level.
// promisify() runs at import time — we mock util.promisify to return a function
// that resolves with our tasklist output string. The handler then calls
// `output.trim()` directly, so we must hand back a string (a pre-existing latent bug
// in LocalApiService.ts:230 — flagged but not fixed here).
vi.mock('node:util', () => ({
  // promisify(exec) resolves to {stdout, stderr} — match that shape.
  promisify: vi.fn(() => vi.fn(async () => ({ stdout: mockState.tasklistOutput, stderr: '' }))),
}))

// Mock node:http — capture the request handler.
vi.mock('node:http', () => ({
  default: {
    createServer: (handler: any) => {
      mockState.captured.httpHandler = handler
      const emitter = new EventEmitter() as any
      emitter.listen = (_port: any, _host: any, cb: any) => {
        setImmediate(cb)
        return emitter
      }
      emitter.close = (cb: any) => cb?.()
      return emitter
    },
  },
}))

// Mock ws — capture connection + upgrade handlers.
vi.mock('ws', () => ({
  WebSocketServer: class MockWSS {
    private connHandler: ((ws: any) => void) | null = null
    on(evt: string, h: any) {
      if (evt === 'connection') mockState.captured.wsConnectionHandler = h
      return this
    }
    emit(_evt: string, ..._args: any[]) {
      return true
    }
    handleUpgrade(_req: any, _socket: any, _head: any, cb: any) {
      cb({ send: () => {}, on: () => {}, readyState: 1 })
    }
    close(cb?: any) {
      cb?.()
    }
  },
  WebSocket: { OPEN: 1 },
}))

import { start, stop, broadcastStatus, isSafeId } from '../../src/infrastructure/external/LocalApiService'

function makeRes() {
  let statusCode = 200
  let body = ''
  const headers: Record<string, string> = {}
  return {
    setHeader(k: string, v: string) {
      headers[k] = v
    },
    end(payload: string) {
      body = payload
    },
    get statusCode() {
      return statusCode
    },
    set statusCode(v: number) {
      statusCode = v
    },
    get body() {
      return body
    },
    get headers() {
      return headers
    },
  } as any
}

function makeReq(overrides: Partial<{
  method: string
  url: string
  headers: Record<string, string>
  body: string
}> = {}) {
  const req = new EventEmitter() as any
  req.method = overrides.method ?? 'GET'
  req.url = overrides.url ?? '/'
  req.headers = overrides.headers ?? {}
  // body is delivered via 'data'/'end' events synchronously by default
  if (overrides.body !== undefined) {
    setImmediate(() => {
      req.emit('data', Buffer.from(overrides.body!))
      req.emit('end')
    })
  } else {
    setImmediate(() => req.emit('end'))
  }
  return req
}

beforeEach(() => {
  mockState.accounts.clear()
  mockState.captured.httpHandler = null
  mockState.captured.wsConnectionHandler = null
  mockState.captured.wsUpgradeListener = null
  mockState.captured.serverErrorHandler = null
  mockState.lastBottingStatus = { running: false, accounts: [] as string[] }
  mockState.launchCalls.length = 0
  mockState.refreshCalls.length = 0
  mockState.updateCalls.length = 0
  mockState.updateLastUsedCalls.length = 0
  mockState.killCalls.length = 0
  mockState.startBottingCalls.length = 0
  mockState.stopBottingCalls = 0
})

afterEach(async () => {
  await stop()
})

describe('LocalApiService — start()', () => {
  it('rejects a port not in the allow-list', async () => {
    await expect(start(1234)).rejects.toThrow(/Puerto invalido/)
  })

  it('rejects privileged ports (22, 80, 443)', async () => {
    await expect(start(22)).rejects.toThrow(/Puerto invalido/)
    await expect(start(80)).rejects.toThrow(/Puerto invalido/)
    await expect(start(443)).rejects.toThrow(/Puerto invalido/)
  })

  it('rejects non-integer ports', async () => {
    // @ts-ignore — intentionally wrong type
    await expect(start(3.14)).rejects.toThrow()
    // @ts-ignore
    await expect(start('31415')).rejects.toThrow()
    // @ts-ignore
    await expect(start(null)).rejects.toThrow()
  })

  it('rejects out-of-range integer ports (< 1024, > 65535)', async () => {
    await expect(start(80)).rejects.toThrow()
    await expect(start(70000)).rejects.toThrow()
  })

  it('accepts an allowed port and returns a 64-char hex token', async () => {
    const result = await start(31415)
    expect(result.port).toBe(31415)
    expect(result.token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('rotates the token on each start()', async () => {
    const a = await start(31415)
    await stop()
    const b = await start(31417)
    expect(a.token).not.toBe(b.token)
  })
})

describe('LocalApiService — HTTP handlers', () => {
  let token: string

  beforeEach(async () => {
    const r = await start(31415)
    token = r.token
  })

  it('GET /health is public (no auth required) and returns ok', async () => {
    const req = makeReq({ method: 'GET', url: '/health' })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' })
  })

  it('rejects requests without X-NAM-Token with 401', async () => {
    const req = makeReq({ method: 'GET', url: '/accounts' })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects requests with wrong X-NAM-Token', async () => {
    const req = makeReq({
      method: 'GET',
      url: '/accounts',
      headers: { 'x-nam-token': 'deadbeef' },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rejects requests with non-loopback Origin with 403', async () => {
    const req = makeReq({
      method: 'GET',
      url: '/accounts',
      headers: { 'x-nam-token': token, origin: 'https://evil.example.com' },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body)).toEqual({ error: 'Forbidden' })
  })

  it('allows loopback Origin (127.0.0.1, localhost)', async () => {
    for (const origin of ['http://127.0.0.1', 'https://localhost:8080', 'http://localhost']) {
      const req = makeReq({
        method: 'GET',
        url: '/accounts',
        headers: { 'x-nam-token': token, origin },
      })
      const res = makeRes()
      await mockState.captured.httpHandler!(req, res)
      expect(res.statusCode).not.toBe(403)
    }
  })

  it('GET /accounts returns sanitized account list', async () => {
    mockState.accounts.set('acc1', {
      id: 'acc1', username: 'alice', robloxUserId: 111, group: 'A', lastUsed: new Date('2024-01-01'),
      encryptedCookie: 'ENC:secret', cookieHash: 'h', savedPlaceId: '123', savedJobId: 'abc',
    })
    const req = makeReq({ method: 'GET', url: '/accounts', headers: { 'x-nam-token': token } })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.accounts).toHaveLength(1)
    expect(body.accounts[0]).not.toHaveProperty('encryptedCookie')
    expect(body.accounts[0].username).toBe('alice')
    expect(body.accounts[0].lastUsed).toBe('2024-01-01T00:00:00.000Z')
  })

  it('GET /accounts/:id returns sanitized single account', async () => {
    mockState.accounts.set('acc1', {
      id: 'acc1', username: 'bob', robloxUserId: 222, group: 'B', lastUsed: null,
      encryptedCookie: 'ENC:secret', cookieHash: 'h', savedPlaceId: '123', savedJobId: 'abc',
    })
    const req = makeReq({
      method: 'GET',
      url: '/accounts/acc1',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.account).toBeDefined()
    expect(body.account.id).toBe('acc1')
    expect(body.account).not.toHaveProperty('encryptedCookie')
    expect(body.account.lastUsed).toBeNull()
  })

  it('GET /accounts/:id returns 404 for unknown id', async () => {
    const req = makeReq({
      method: 'GET',
      url: '/accounts/unknown',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(404)
  })

  it('GET /accounts/:id returns 400 for invalid id', async () => {
    const req = makeReq({
      method: 'GET',
      url: '/accounts/has%20space',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('POST /accounts/:id/launch calls launchRobloxDirect + updateLastUsed', async () => {
    mockState.accounts.set('acc1', {
      id: 'acc1', username: 'alice', robloxUserId: 111, group: 'A',
      encryptedCookie: 'ENC:mycookie', cookieHash: 'h',
      savedPlaceId: '1234567', savedJobId: 'jobid',
    })
    const req = makeReq({
      method: 'POST',
      url: '/accounts/acc1/launch',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ success: true })
    expect(mockState.launchCalls).toHaveLength(1)
    expect(mockState.launchCalls[0]).toEqual({ placeId: '1234567', jobId: 'jobid', cookie: 'mycookie' })
    expect(mockState.updateLastUsedCalls).toEqual(['acc1'])
  })

  it('POST /accounts/:id/kill calls killInstance', async () => {
    const req = makeReq({
      method: 'POST',
      url: '/accounts/acc1/kill',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockState.killCalls).toEqual(['acc1'])
  })

  it('GET /accounts/:id/status checks tasklist on win32', async () => {
    const id = 'status-running-' + Date.now()
    mockState.accounts.set(id, { id, username: 'x', encryptedCookie: 'ENC:c', savedPlaceId: '1' })
    const launchReq = makeReq({
      method: 'POST',
      url: `/accounts/${id}/launch`,
      headers: { 'x-nam-token': token },
    })
    await mockState.captured.httpHandler!(launchReq, makeRes())

    mockState.tasklistOutput = '"PID eq 4242","name","session"\r\n"4242","Roblox","1"\r\n'
    const req = makeReq({
      method: 'GET',
      url: `/accounts/${id}/status`,
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.running).toBe(true)
    expect(body.pid).toBe(4242)
  })

  it('GET /accounts/:id/status reports not running when tasklist returns no PID', async () => {
    // Use an id that has NOT been launched — runningInstances lookup returns undefined
    const id = 'never-launched-' + Date.now()
    mockState.tasklistOutput = 'INFO: No tasks are running\r\n'
    const req = makeReq({
      method: 'GET',
      url: `/accounts/${id}/status`,
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).running).toBe(false)
    expect(JSON.parse(res.body).pid).toBeUndefined()
  })

  it('POST /accounts/:id/refresh-cookie updates cookie when refresh differs', async () => {
    mockState.accounts.set('acc1', {
      id: 'acc1', username: 'x', encryptedCookie: 'ENC:old', cookieHash: 'h-old',
    })
    const req = makeReq({
      method: 'POST',
      url: '/accounts/acc1/refresh-cookie',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockState.refreshCalls).toEqual([{ oldCookie: 'old', newCookie: 'old_refreshed' }])
    expect(mockState.updateCalls).toHaveLength(1)
    expect(mockState.updateCalls[0].id).toBe('acc1')
  })

  it('POST /accounts/:id/refresh-cookie skips update when cookie unchanged', async () => {
    // Override the mock so refreshCookie returns same input
    const { refreshCookie } = await import('../../src/infrastructure/external/RobloxCookieService')
    vi.mocked(refreshCookie).mockResolvedValueOnce('old')
    mockState.accounts.set('acc1', {
      id: 'acc1', username: 'x', encryptedCookie: 'ENC:old', cookieHash: 'h-old',
    })
    const req = makeReq({
      method: 'POST',
      url: '/accounts/acc1/refresh-cookie',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockState.updateCalls).toHaveLength(0)
  })

  it('GET /botting/status returns botting service status', async () => {
    mockState.lastBottingStatus = { running: true, accounts: ['acc1', 'acc2'] }
    const req = makeReq({
      method: 'GET',
      url: '/botting/status',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ status: { running: true, accounts: ['acc1', 'acc2'] } })
  })

  it('POST /botting/start validates accountId, placeId, interval', async () => {
    const cases = [
      { body: JSON.stringify({ accountId: 'has space', placeId: '123', interval: 5 }), expect400: true },
      { body: JSON.stringify({ accountId: 'acc1', placeId: 'abc', interval: 5 }), expect400: true },
      { body: JSON.stringify({ accountId: 'acc1', placeId: '123', interval: 0 }), expect400: true },
      { body: JSON.stringify({ accountId: 'acc1', placeId: '123', interval: 9999 }), expect400: true },
      { body: JSON.stringify({ accountId: 'acc1', placeId: '123', interval: 5 }), expect400: false },
    ]
    for (const c of cases) {
      const req = makeReq({
        method: 'POST',
        url: '/botting/start',
        headers: { 'x-nam-token': token, 'content-length': String(Buffer.byteLength(c.body)) },
        body: c.body,
      })
      const res = makeRes()
      await mockState.captured.httpHandler!(req, res)
      if (c.expect400) expect(res.statusCode).toBe(400)
      else expect(res.statusCode).toBe(200)
    }
  })

  it('POST /botting/start with malformed JSON returns 400', async () => {
    const body = '{ not valid json'
    const req = makeReq({
      method: 'POST',
      url: '/botting/start',
      headers: { 'x-nam-token': token, 'content-length': String(body.length) },
      body,
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'Invalid JSON body' })
  })

  it('POST /botting/start with oversized content-length returns 413', async () => {
    const req = makeReq({
      method: 'POST',
      url: '/botting/start',
      headers: { 'x-nam-token': token, 'content-length': String(2 * 1024 * 1024) },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(413)
    expect(JSON.parse(res.body)).toEqual({ error: 'Payload too large' })
  })

  it('POST /botting/stop calls stopBotting', async () => {
    const req = makeReq({
      method: 'POST',
      url: '/botting/stop',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockState.stopBottingCalls).toBe(1)
  })

  it('returns 404 for unknown routes', async () => {
    const req = makeReq({
      method: 'GET',
      url: '/no/such/path',
      headers: { 'x-nam-token': token },
    })
    const res = makeRes()
    await mockState.captured.httpHandler!(req, res)
    expect(res.statusCode).toBe(404)
  })
})

describe('LocalApiService — isSafeId', () => {
  it('accepts safe ids', () => {
    expect(isSafeId('abc_123')).toBe(true)
    expect(isSafeId('A'.repeat(64))).toBe(true)
  })

  it('rejects unsafe ids', () => {
    expect(isSafeId('has space')).toBe(false)
    expect(isSafeId('A'.repeat(65))).toBe(false)
    // @ts-ignore
    expect(isSafeId(null)).toBe(false)
    // @ts-ignore
    expect(isSafeId(undefined)).toBe(false)
  })
})

describe('LocalApiService — broadcastStatus + stop', () => {
  it('broadcastStatus is a no-op when WS server is not started', () => {
    // wss is null — should not throw
    expect(() => broadcastStatus('acc1', { foo: 'bar' })).not.toThrow()
  })

  it('stop() resolves even when never started', async () => {
    await expect(stop()).resolves.toBeUndefined()
  })

  it('stop() after start() clears the auth token', async () => {
    await start(31415)
    await stop()
    // Subsequent start uses a fresh token
    const r = await start(31416)
    expect(r.token).toMatch(/^[a-f0-9]{64}$/)
  })
})
