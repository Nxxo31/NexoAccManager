import http from 'node:http';
import { AccountRepositoryImpl } from '../database/AccountRepositoryImpl';
import { launchRobloxDirect } from '../external/RobloxBottingService';
import { launchMulti, killInstance, getRunningInstances } from '../external/MultiRobloxService';
import { startBotting, stopBotting, getBottingStatus } from '../external/RobloxBottingService';
import { refreshCookie } from '../external/RobloxCookieService';
import { decrypt, encrypt, hashCookie } from '../database/CryptoService';
import { Account } from '../../domain/entities/Account';

const exec = require('node:child_process').exec;
const execAsync = require('node:util').promisify(exec);

let server: http.Server | null = null;
const accountRepo = new AccountRepositoryImpl();
const runningInstances = new Map<string, number>(); // accountId -> PID

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
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
          await launchRobloxDirect(placeId ?? '', jobId ?? '', cookie);
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
          if (pid !== undefined) {
            try {
              const output = await execAsync(`tasklist /FI \"PID eq ${pid}\" /FO CSV /NH`);
              const lines = output.trim().split('\n');
              running = lines.length > 0 && !lines[0].includes('INFO: No tasks are running');
            } catch (_) {
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
            await accountRepo.update(id, { encryptedCookie: encrypt(newCookie), cookieHash: hashCookie(newCookie) });
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
          const body = await parseBody(req);
          const { accountId, placeId, interval } = body;
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
        console.error('Error in LocalApiService:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Local API server listening on port ${port}`);
      resolve();
    });
  });
}

export function stop(): Promise<void> {
  return new Promise((resolve) => {
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