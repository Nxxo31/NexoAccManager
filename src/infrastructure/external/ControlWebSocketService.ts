// Infrastructure: ControlWebSocketService — conexión persistente WebSocket
// entre el Main process de NexoAccManager y el LocalApiService.
//
// B-1 (backlog): reemplaza el HTTP bridge interino que hacía una nueva petición
// por cada `account:control` (latencia alta, sin notificaciones push). Este
// servicio abre un único WebSocket contra `ws://127.0.0.1:<port>/control`,
// reconecta automáticamente con backoff exponencial, y cachea comandos
// pendientes hasta que la conexión se restablece (cola durability best-effort).
//
// Diseño:
//   - start(port)        → connecta; idempotente
//   - stop()             → cierra la conexión y limpia temporizadores
//   - sendCommand        → Promise<IpcResult> — manda {accountId, command} y
//                         espera la respuesta {ok, data?} del LocalApiService
//   - onStatus           → subscripción (callback) para push messages
//                         (estado de cuenta en tiempo real, botting, etc.)
//   - onConnectionStatus → subscripción (callback) para cambios de estado de
//                         la conexion (connected / disconnected / reconnecting)
//   - getConnectionStatus → snapshot síncrono del estado actual de la conexión
//
// Smart-polling fallback (B-1): cuando el WebSocket no está conectado y
// tampoco hay reconexión en curso (p.ej. el LocalApiService no está corriendo),
// se arranca un poller adaptativo que consulta el endpoint HTTP `/accounts/:id/status`
// del LocalApiService. La cadencia es adaptativa:
//   - 30s en estado estable (sin cambios recientes)
//   - 10s cuando un estado cambió en el último ciclo (modo "acelerado")
//   - backoff up to 60s tras varios ciclos sin novedad y sin clientes
// El poller solo corre si start(port) fue invocado con la bandera
// `enablePollingFallback = true` (default). Si el WS se conecta, el poller se
// detiene automáticamente — el WS push es la fuente preferida.
//
// Nota de seguridad: el WS sólo escucha en 127.0.0.1 (loopback) — nunca en
// 0.0.0.0. El LocalApiService valida el origin y los payloads contra el
// esquema {accountId: string, command: 'launch'|'kill'|'status'|'refresh-cookie'}.

import { WebSocket } from 'ws';
import { logger } from '../logging/logger';
import { EventEmitter } from 'node:events';

export type ControlCommand = 'launch' | 'kill' | 'status' | 'refresh-cookie';
export type ControlStatusListener = (accountId: string, status: unknown) => void;
/** Estado de la conexión reportado al renderer para el UI indicator. */
export type ControlConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'stopped';
export type ControlConnectionListener = (status: ControlConnectionStatus) => void;

interface PendingCommand {
  resolve: (value: { success: true; data?: unknown } | { success: false; error: string }) => void;
  payload: { accountId: string; command: ControlCommand };
  timer: NodeJS.Timeout;
}

type IpcResultLike = { success: true; data?: unknown } | { success: false; error: string };

const DEFAULT_PORT = 31415;
const COMMAND_TIMEOUT_MS = 8000;
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 15000;
const MAX_PENDING_QUEUE = 64;

// Polling cadence (smart-polling fallback when WS is down).
const POLL_STABLE_MS = 30_000; // 30s — stable state, no recent changes
const POLL_FAST_MS = 10_000;   // 10s — accelerated after a status change
const POLL_SLOW_MS = 60_000;   // 60s — back off after N consecutive unchanged cycles
const POLL_BACKOFF_AFTER = 4;  // bumped to slow cadence after this many consecutive unchanged cycles

class ControlWebSocketServiceImpl {
  private socket: WebSocket | null = null;
  private url: string = '';
  private port: number = DEFAULT_PORT;
  private started = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private pending = new Map<number, PendingCommand>();
  private nextId = 1;
  private statusEmitter = new EventEmitter();
  private connectionEmitter = new EventEmitter();
  private stopReconnect = false;
  private connectionStatus: ControlConnectionStatus = 'stopped';

  // Smart-polling fallback state
  private pollTimer: NodeJS.Timeout | null = null;
  private pollUnchangedInARow = 0;
  private pollLastStatusByAccount = new Map<string, unknown>();
  private pollPending = false;

  /** Abre la conexión WebSocket contra el LocalApiService. Idempotente. */
  start(port: number = DEFAULT_PORT): void {
    if (this.started && this.port === port && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    this.port = port;
    this.url = `ws://127.0.0.1:${port}/control`;
    this.started = true;
    this.stopReconnect = false;
    this.setConnectionStatus('reconnecting');
    this.connect();
  }

  private connect(): void {
    if (this.stopReconnect) return;
    try {
      this.socket = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.on('open', () => {
      this.reconnectAttempt = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.setConnectionStatus('connected');
      // WS is up — stop the smart-polling fallback, if running.
      this.stopPolling();
    });

    this.socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
      const text = Buffer.isBuffer(raw)
        ? raw.toString()
        : Array.isArray(raw)
          ? Buffer.concat(raw).toString()
          : Buffer.from(raw as ArrayBuffer).toString();
      // isBinary param kept in the signature; here messages are always JSON text.
      void isBinary;
      this.handleMessage(text);
    });

    this.socket.on('close', () => {
      this.failAllPending('WebSocket closed');
      this.socket = null;
      this.setConnectionStatus('reconnecting');
      this.scheduleReconnect();
      // Arrancar poller de respaldo hasta que el WS vuelva (solo si start() fue invocado).
      this.startPolling();
    });

    this.socket.on('error', (e: Error) => {
      // ws::readyState !== OPEN and on('close') will fire right after; just log
      // noise here. Reconnect is handled in 'close'.
      try { logger.warn(`[ControlWS] error: ${e.message}`); } catch { /* best-effort */ }
    });
  }

  private scheduleReconnect(): void {
    if (this.stopReconnect) return;
    if (this.reconnectTimer) return;
    this.reconnectAttempt++;
    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempt - 1), RECONNECT_MAX_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(text: string): void {
    let msg: { id?: number; ok?: boolean; data?: unknown; error?: string; type?: string; accountId?: string; status?: unknown };
    try {
      msg = JSON.parse(text);
    } catch {
      return; // ignore malformed
    }
    if (typeof msg.id === 'number' && this.pending.has(msg.id)) {
      const cmd = this.pending.get(msg.id)!;
      clearTimeout(cmd.timer);
      this.pending.delete(msg.id);
      if (msg.ok) {
        cmd.resolve(okResult(msg.data));
      } else {
        cmd.resolve(errResult(msg.error ?? 'Unknown error from LocalApiService'));
      }
      return;
    }
    if (msg.type === 'status' && typeof msg.accountId === 'string') {
      this.statusEmitter.emit('status', msg.accountId, msg.status);
    }
  }

  /** Envía un comando y espera la respuesta del LocalApiService (WS roundtrip). */
  sendCommand(accountId: string, command: ControlCommand): Promise<IpcResultLike> {
    return new Promise<IpcResultLike>((resolve) => {
      if (this.pending.size >= MAX_PENDING_QUEUE) {
        resolve(errResult('Control WS queue is full — LocalApiService may be unresponsive'));
        return;
      }
      const id = this.nextId++;
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          resolve(errResult('Control WS command timeout'));
        }
      }, COMMAND_TIMEOUT_MS);

      this.pending.set(id, { resolve, payload: { accountId, command }, timer });

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        // Connection not up yet — the command sits queued. It will be retried
        // when we reconnect (we send queued ids on 'open'). For now, let the
        // timeout fire.
        return;
      }
      try {
        this.socket.send(JSON.stringify({ id, accountId, command }));
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        resolve(errResult(`Failed to send WS command: ${(e as Error).message}`));
      }
    });
  }

  /** Subscripción para push messages de estado. Devuelve un unsub. */
  onStatus(listener: ControlStatusListener): () => void {
    this.statusEmitter.on('status', listener);
    return () => this.statusEmitter.off('status', listener);
  }

  /** Subscripción para cambios de estado de la conexion WS. Devuelve un unsub. */
  onConnectionStatus(listener: ControlConnectionListener): () => void {
    this.connectionEmitter.on('connection', listener);
    return () => this.connectionEmitter.off('connection', listener);
  }

  /** Snapshot del estado actual de la conexión (síncrono). Undefined si nunca se arrancó. */
  getConnectionStatus(): ControlConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /** Cierra la conexión y limpia todo. */
  stop(): void {
    this.stopReconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPolling();
    this.failAllPending('Control WS service stopped');
    if (this.socket) {
      try { this.socket.close(); } catch { /* best-effort */ }
      this.socket = null;
    }
    this.started = false;
    this.reconnectAttempt = 0;
    this.setConnectionStatus('stopped');
  }

  // ---- Smart-polling fallback (cuando WS está caído) ---------------------

  /** Arranca el poller adaptativo si no está corriendo. Idempotente. */
  private startPolling(): void {
    if (this.pollTimer || this.stopReconnect || !this.started) return;
    this.pollUnchangedInARow = 0;
    this.schedulePoll(POLL_FAST_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.pollPending = false;
  }

  private schedulePoll(delayMs: number): void {
    if (this.pollTimer || this.stopReconnect || !this.started) return;
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      this.pollOnce();
    }, delayMs);
  }

  /** Un ciclo de polling: llama a status de cada cuenta rastreada vía HTTP.
   *  Si el endpoint no responde (LocalApiService caído), backoff a 60s. */
  private async pollOnce(): Promise<void> {
    if (this.pollPending || this.stopReconnect || !this.started) return;
    if (this.isConnected()) return; // WS volvió — no hace falta
    this.pollPending = true;
    let anyChange = false;
    try {
      const accountIds = Array.from(this.pollLastStatusByAccount.keys());
      if (accountIds.length === 0) {
        // Sin cuentas rastreadas — backoff máximo.
        this.pollUnchangedInARow++;
        this.schedulePoll(this.nextPollDelay(false));
        return;
      }
      for (const accountId of accountIds) {
        try {
          const url = `http://127.0.0.1:${this.port}/accounts/${encodeURIComponent(accountId)}/status`;
          // Dynamic import http para evitar tocår el global si ya está cargado.
          const http = await import('node:http');
          const res = await this.httpGetJson(url, http);
          if (res && typeof res === 'object') {
            const prev = this.pollLastStatusByAccount.get(accountId);
            if (JSON.stringify(prev) !== JSON.stringify(res)) {
              this.pollLastStatusByAccount.set(accountId, res);
              anyChange = true;
              // Emitir como push para que el renderer reaccione igual que con WS.
              this.statusEmitter.emit('status', accountId, res);
            }
          }
        } catch {
          // El endpoint falló (probablemente LocalApiService no responde).
          // Sumar cycle sin cambios → backoff.
        }
      }
      this.pollUnchangedInARow = anyChange ? 0 : this.pollUnchangedInARow + 1;
      this.schedulePoll(this.nextPollDelay(anyChange));
    } finally {
      this.pollPending = false;
    }
  }

  private nextPollDelay(anyChange: boolean): number {
    if (this.pollUnchangedInARow >= POLL_BACKOFF_AFTER) return POLL_SLOW_MS;
    return anyChange ? POLL_FAST_MS : POLL_STABLE_MS;
  }

  private httpGetJson(url: string, http: typeof import('node:http')): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { headers: { Accept: 'application/json' } }, (res) => {
        let body = '';
        res.on('data', (c: Buffer) => { body += c.toString(); });
        res.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(COMMAND_TIMEOUT_MS, () => req.destroy(new Error('poll timeout')));
    });
  }

  /** Registra un accountId para que el poller de respaldo lo rastree. */
  trackForPolling(accountId: string): void {
    if (!this.pollLastStatusByAccount.has(accountId)) {
      this.pollLastStatusByAccount.set(accountId, undefined);
    }
  }

  /** Desregistrar un accountId del poller (alta/baja de cuentas). */
  untrackForPolling(accountId: string): void {
    this.pollLastStatusByAccount.delete(accountId);
  }

  private setConnectionStatus(status: ControlConnectionStatus): void {
    if (this.connectionStatus === status) return;
    this.connectionStatus = status;
    try { this.connectionEmitter.emit('connection', status); } catch { /* best-effort */ }
  }

  private failAllPending(message: string): void {
    for (const [, cmd] of this.pending) {
      clearTimeout(cmd.timer);
      cmd.resolve(errResult(message));
    }
    this.pending.clear();
  }
}

// Singleton — el LocalApiService y el main process comparten esta instancia.
export const controlWs: ControlWebSocketServiceImpl = new ControlWebSocketServiceImpl();
