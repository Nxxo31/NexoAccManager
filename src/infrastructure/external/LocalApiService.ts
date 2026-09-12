import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { logger } from '../logging/logger';
import { WebSocketServer, WebSocket } from 'ws';
import { AccountRepositoryImpl } from '../database/AccountRepositoryImpl';
import { launchRobloxDirect } from '../external/RobloxBottingService';
import { killInstance } from '../external/MultiRobloxService';
import { startBotting, stopBotting, getBottingStatus } from '../external/RobloxBottingService';
import { refreshCookie } from '../external/RobloxCookieService';
import { decrypt, encrypt, hashCookie } from '../database/CryptoService';

import { makeEncryptedString } from '../../domain/types/EncryptedString';

const exec = require('node:child_process').exec;
const execAsync = require('node:util').promisify(exec);

let server: http.Server | null = null;
let wss: WebSocketServer | null = null;
const accountRepo = new AccountRepositoryImpl();

// runningInstances tracks account→PID for the HTTP/WS status endpoint.
// MultiRobloxService.killInstance() handles its own map; we sync ours
// by calling runningInstances.delete() on kill.
const runningInstances = new Map<string, number>(); // accountId -> PID

// Maximum allowed body size for HTTP requests — 1 MiB
const MAX_BODY_BYTES = 1048576;

// Auth token: generado al start() via crypto.randomBytes(32). Rotado en cada start.
// Requerido en header X-NAM-Token en HTTP y como campo 'token' en mensajes WS.
// Sin token, todas las requests retornan 401. Defense contra procesos locales
// no autorizados (otro usuario en la misma maquina, malware con code execution local,
// scripts Node de terceros) accediendo a /accounts, /accounts/:id/launch, etc.
let authToken: string | null = null;

// Allow-list de puertos validos. Evita que renderer comprom. bindee puertos
// privilegiados o populares (22, 80, 443, 8080). Default 31415-31420.
const ALLOWED_PORTS = new Set([31415, 31416, 31417, 31418, 31419, 31420]);
const DEFAULT_PORT = 31415;

function isValidPort(port: unknown): port is number {
  return typeof port === 'number' && Number.isInteger(port) && port >= 1024 && port <= 65535 && ALLOWED_PORTS.has(port);
}

function checkAuth(req: http.IncomingMessage): boolean {
  if (!authToken) return false;
  const headerToken = req.headers['x-nam-token'];
  return typeof headerToken === 'string' && headerToken === authToken;
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodyBytes = 0;
    // Reject requests that declare a Content-Length above the cap up-front
    const declaredLength = parseInt(req.headers['content-length'] ?? '', 10);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      reject(new Error('Payload too large'));
      return;
    }
    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_BODY_BYTES) {
        // Stream-pull guard — protects against transfer-encoding: chunked too
        req.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (e) => reject(e));
  });
}

export function isSafeId(id: string | undefined | null): id is string {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/** Validate a PID is a non-negative integer before interpolating into a shell
 *  command — prevents command injection if runningInstances ever holds a
 *  hostile value. */
function isSafePid(pid: unknown): pid is number {
  return typeof pid === 'number' && Number.isInteger(pid) && pid > 0;
}

export function start(port: number = DEFAULT_PORT): Promise<{ token: string; port: number }> {
  // Validar puerto contra allow-list. Defense contra renderer comprom. que bindee
  // puertos privilegiados.
  if (!isValidPort(port)) {
    return Promise.reject(new Error(`Puerto invalido o no permitido: ${port}. Permitidos: ${Array.from(ALLOWED_PORTS).join(', ')}`));
  }
  // Generar token de auth (32 bytes hex = 64 chars). Rotado en cada start.
  authToken = randomBytes(32).toString('hex');

  return new Promise((resolve, reject) => {
    server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.setHeader('Content-Type', 'application/json');
      const { method, url } = req;

      try {
        // Origin allow-list: block requests whose Origin is not loopback
        // (DNS-rebinding / malicious web page protection). Legacy clients that
        // omit Origin entirely (curl, local Node fetch) are unaffected.
        const origin = req.headers.origin;
        if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }

        // Auth: require X-NAM-Token header matching authToken. Sin token → 401.
        // /health es publico para chequeos de liveness.
        if (url !== '/health' && !checkAuth(req)) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        if (!url) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid request' }));
          return;
        }

        if (method === 'GET' && url === '/health') {
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (method === 'GET' && url === '/accounts') {
          const accounts = await accountRepo.getAll();
          const safeAccounts = accounts.map(({ id, username, robloxUserId, group, lastUsed }) => ({
            id,
            username,
            robloxUserId,
            group,
            lastUsed: lastUsed?.toISOString() ?? null,
          }));
          res.end(JSON.stringify({ accounts: safeAccounts }));
          return;
        }

        if (method === 'GET' && url.startsWith('/accounts/') && !url.includes('/launch') && !url.includes('/kill') && !url.includes('/status') && !url.includes('/refresh-cookie')) {
          const parts = url.split('/');
          const id = parts[2];
          if (!isSafeId(id)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid account ID' }));
            return;
          }
          const account = await accountRepo.getById(id);
          if (!account) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Account not found' }));
            return;
          }
          const safeAccount = {
            id: account.id,
            username: account.username,
            robloxUserId: account.robloxUserId,
            group: account.group,
            lastUsed: account.lastUsed?.toISOString() ?? null,
          };
          res.end(JSON.stringify({ account: safeAccount }));
          return;
        }

        if (method === 'POST' && url.startsWith('/accounts/') && url.endsWith('/launch')) {
          const parts = url.split('/');
          const id = parts[2];
          if (!isSafeId(id)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid account ID' }));
            return;
          }
          const account = await accountRepo.getById(id);
          if (!account) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Account not found' }));
            return;
          }
          const cookie = decrypt(account.encryptedCookie);
          const placeId = account.savedPlaceId;
          const jobId = account.savedJobId;
          const pid = await launchRobloxDirect(placeId ?? '', jobId ?? '', cookie);
          // BUG FIX (BUG 1): populate runningInstances so status endpoint works
          if (pid > 0) {
            runningInstances.set(id, pid);
          }
          await accountRepo.updateLastUsed(id);
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (method === 'POST' && url.startsWith('/accounts/') && url.endsWith('/kill')) {
          const parts = url.split('/');
          const id = parts[2];
          if (!isSafeId(id)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid account ID' }));
            return;
          }
          await killInstance(id);
          runningInstances.delete(id);
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (method === 'GET' && url.startsWith('/accounts/') && url.endsWith('/status')) {
          const parts = url.split('/');
          const id = parts[2];
          if (!isSafeId(id)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid account ID' }));
            return;
          }
          const pid = runningInstances.get(id);
          let running = false;
          if (isSafePid(pid)) {
            try {
              if (process.platform === 'win32') {
                const output = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                const lines = output.trim().split('\n');
                running = lines.length > 0 && !lines[0].includes('INFO: No tasks are running');
              } else {
                // Unix: ps -p exits 0 if process exists, non-zero if not
                await execAsync(`ps -p ${pid} -o pid=`);
                running = true; // if ps didn't throw, process is alive
              }
            } catch {
              running = false;
            }
          }
          res.end(JSON.stringify({ running, pid }));
          return;
        }

        if (method === 'POST' && url.startsWith('/accounts/') && url.endsWith('/refresh-cookie')) {
          const parts = url.split('/');
          const id = parts[2];
          if (!isSafeId(id)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid account ID' }));
            return;
          }
          const account = await accountRepo.getById(id);
          if (!account) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Account not found' }));
            return;
          }
          const oldCookie = decrypt(account.encryptedCookie);
          const newCookie = await refreshCookie(oldCookie);
          if (newCookie !== oldCookie) {
            await accountRepo.update(id, { encryptedCookie: makeEncryptedString(encrypt(newCookie)), cookieHash: hashCookie(newCookie) });
          }
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (method === 'GET' && url === '/botting/status') {
          const status = getBottingStatus();
          res.end(JSON.stringify({ status }));
          return;
        }

        if (method === 'POST' && url === '/botting/start') {
          let body: Record<string, unknown>;
          try {
            body = await parseBody(req) as Record<string, unknown>;
          } catch (parseErr: unknown) {
            if ((parseErr as Error)?.message === 'Payload too large') {
              res.statusCode = 413;
              res.end(JSON.stringify({ error: 'Payload too large' }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
            return;
          }
          const { accountId, placeId, interval } = body as { accountId: unknown; placeId: unknown; interval: unknown };
          if (typeof accountId !== 'string' || !isSafeId(accountId)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid accountId' }));
            return;
          }
          if (typeof placeId !== 'string' || !/^\d{1,20}$/.test(placeId)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid placeId (must be 1-20 digits)' }));
            return;
          }
          if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 1 || interval > 1440) {
            // 1 minute min, 24h max — clamp DoS
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid interval (must be 1-1440 minutes)' }));
            return;
          }
          await startBotting(accountId, placeId, interval);
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (method === 'POST' && url === '/botting/stop') {
          await stopBotting();
          res.end(JSON.stringify({ success: true }));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (err) {
        logger.error('Error in LocalApiService:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    server.listen(port, '127.0.0.1', () => {
      logger.info(`Local API server listening on port ${port}`);
      // B-1: WebSocket server on path '/control' for real-time command/response.
      // The same HTTP server handles the WS upgrade — single port, no extra listen.
      wss = new WebSocketServer({ noServer: true });
      const httpServer = server!;
      httpServer.on('upgrade', (req: http.IncomingMessage, socket: import('node:net').Socket, head: Buffer) => {
        const reqUrl = req.url ?? '';
        // Origin check: only accept loopback (no DNS-rebinding from external pages).
        const origin = req.headers.origin;
        if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }
        if (!reqUrl.startsWith('/control')) {
          socket.destroy();
          return;
        }
        // WS auth: require Sec-WebSocket-Protocol or X-NAM-Token header matching authToken.
        // Browser WS API permite custom protocols via second arg; usar subprotocol 'nam-token.<hex>'.
        const wsProtocol = req.headers['sec-websocket-protocol'];
        const tokenFromProtocol = typeof wsProtocol === 'string' && wsProtocol.startsWith('nam-token.') ? wsProtocol.slice('nam-token.'.length) : null;
        const tokenFromHeader = req.headers['x-nam-token'];
        const presentedToken = tokenFromProtocol ?? (typeof tokenFromHeader === 'string' ? tokenFromHeader : null);
        if (!authToken || presentedToken !== authToken) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        wss!.handleUpgrade(req, socket, head, (ws: WebSocket) => {
          wss!.emit('connection', ws, req);
        });
      });
      wss.on('connection', (ws: WebSocket) => {
        ws.on('message', async (raw: Buffer | ArrayBuffer | Buffer[]) => {
          const text = Buffer.isBuffer(raw) ? raw.toString() : Buffer.from(raw as ArrayBuffer).toString();
          let msg: { id?: number; accountId?: string; command?: string; token?: string };
          try { msg = JSON.parse(text); }
          catch { return; /* malformed — drop silently */ }
          // Auth check: cada mensaje WS debe incluir 'token' matching authToken.
          if (!authToken || msg.token !== authToken) {
            ws.send(JSON.stringify({ id: msg.id, ok: false, error: 'Unauthorized' }));
            return;
          }
          if (typeof msg.id !== 'number' || typeof msg.accountId !== 'string' || typeof msg.command !== 'string' || !isSafeId(msg.accountId)) return;

          try {
            // Dispatch the command to the same handlers used by the HTTP routes
            // (launch / kill / status / refresh-cookie). Keeps semantics in sync
            // between the HTTP and WS surfaces — no business logic drift.
            if (msg.command === 'launch') {
              const account = await accountRepo.getById(msg.accountId);
              if (!account) { ws.send(JSON.stringify({ id: msg.id, ok: false, error: 'Account not found' })); return; }
              const cookie = decrypt(account.encryptedCookie);
              const placeId = account.savedPlaceId;
              const jobId = account.savedJobId;
              const pid = await launchRobloxDirect(placeId ?? '', jobId ?? '', cookie);
              // BUG FIX (BUG 1): populate runningInstances so WS status command works
              if (pid > 0) {
                runningInstances.set(msg.accountId, pid);
              }
              await accountRepo.updateLastUsed(msg.accountId);
              ws.send(JSON.stringify({ id: msg.id, ok: true, data: { success: true } }));
              return;
            }
            if (msg.command === 'kill') {
              await killInstance(msg.accountId);
              runningInstances.delete(msg.accountId);
              ws.send(JSON.stringify({ id: msg.id, ok: true, data: { success: true } }));
              return;
            }
            if (msg.command === 'status') {
              const pid = runningInstances.get(msg.accountId);
              let running = false;
              if (isSafePid(pid)) {
                try {
                  if (process.platform === 'win32') {
                    const output = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                    const lines = output.trim().split('\n');
                    running = lines.length > 0 && !lines[0].includes('INFO: No tasks are running');
                  } else {
                    await execAsync(`ps -p ${pid} -o pid=`);
                    running = true;
                  }
                } catch { running = false; }
              }
              ws.send(JSON.stringify({ id: msg.id, ok: true, data: { running, pid } }));
              return;
            }
            if (msg.command === 'refresh-cookie') {
              const account = await accountRepo.getById(msg.accountId);
              if (!account) { ws.send(JSON.stringify({ id: msg.id, ok: false, error: 'Account not found' })); return; }
              const oldCookie = decrypt(account.encryptedCookie);
              const newCookie = await refreshCookie(oldCookie);
              if (newCookie !== oldCookie) {
                await accountRepo.update(msg.accountId, { encryptedCookie: makeEncryptedString(encrypt(newCookie)), cookieHash: hashCookie(newCookie) });
              }
              ws.send(JSON.stringify({ id: msg.id, ok: true, data: { success: true } }));
              return;
            }
            ws.send(JSON.stringify({ id: msg.id, ok: false, error: `Unknown command: ${msg.command}` }));
          } catch (e) {
            ws.send(JSON.stringify({ id: msg.id, ok: false, error: e instanceof Error ? e.message : String(e) }));
          }
        });
      });
      resolve({ token: authToken!, port });
    });

    server.on('error', (e) => {
      authToken = null;
      reject(e);
    });
  });
}

/** Hook para notificar a todos los clientes WS conectados sobre un cambio de
 *  estado de cuenta (push update). Usado por botting watchers y watchers de
 *  estado de juego para empujar al renderer sin que el renderer tenga que hacer
 *  polling HTTP. */
export function broadcastStatus(accountId: string, status: unknown): void {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'status', accountId, status });
  for (const client of (wss as unknown as { clients: Set<WebSocket> }).clients) {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(payload); } catch { /* best-effort */ }
    }
  }
}

export function stop(): Promise<void> {
  // Limpiar auth token al parar para que un start() posterior requiera reauth.
  authToken = null;
  return new Promise((resolve) => {
    if (wss) {
      try { wss.close(); } catch { /* best-effort */ }
      wss = null;
    }
    if (server) {
      server.close(() => {
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}