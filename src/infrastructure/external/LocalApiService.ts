import http from 'node:http';
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
const runningInstances = new Map<string, number>(); // accountId -> PID

// Maximum allowed body size for HTTP requests — 1 MiB
const MAX_BODY_BYTES = 1048576;

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

export function start(port: number = 31415): Promise<void> {
  return new Promise((resolve) => {
    server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.setHeader('Content-Type', 'application/json');
      const { method, url } = req;

      try {
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
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Account ID required' }));
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
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Account ID required' }));
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
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Account ID required' }));
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
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Account ID required' }));
            return;
          }
          const pid = runningInstances.get(id);
          let running = false;
          if (pid !== undefined && Number.isInteger(pid) && pid > 0) {
            try {
              const output = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
              const lines = output.trim().split('\n');
              running = lines.length > 0 && !lines[0].includes('INFO: No tasks are running');
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
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Account ID required' }));
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
          const { accountId, placeId, interval } = body as { accountId: string; placeId: string; interval: number };
          if (!accountId || !placeId || !interval) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing required fields: accountId, placeId, interval' }));
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
        wss!.handleUpgrade(req, socket, head, (ws: WebSocket) => {
          wss!.emit('connection', ws, req);
        });
      });
      wss.on('connection', (ws: WebSocket) => {
        ws.on('message', async (raw: Buffer | ArrayBuffer | Buffer[]) => {
          const text = Buffer.isBuffer(raw) ? raw.toString() : Buffer.from(raw as ArrayBuffer).toString();
          let msg: { id?: number; accountId?: string; command?: string };
          try { msg = JSON.parse(text); }
          catch { return; /* malformed — drop silently */ }
          if (typeof msg.id !== 'number' || typeof msg.accountId !== 'string' || typeof msg.command !== 'string') return;

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
              if (pid !== undefined && Number.isInteger(pid) && pid > 0) {
                try {
                  const output = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                  const lines = output.trim().split('\n');
                  running = lines.length > 0 && !lines[0].includes('INFO: No tasks are running');
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
            ws.send(JSON.stringify({ id: msg.id, ok: false, error: String(e) }));
          }
        });
      });
      resolve();
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