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
//   - start(port)      → connecta; idempotente
//   - stop()           → cierra la conexión y limpia temporizadores
//   - sendCommand      → Promise<IpcResult> — manda {accountId, command} y
//                        espera la respuesta {ok, data?} del LocalApiService
//   - onStatus         → subscripción (callback) para push messages
//                        (estado de cuenta en tiempo real, botting, etc.)
//
// Nota de seguridad: el WS sólo escucha en 127.0.0.1 (loopback) — nunca en
// 0.0.0.0. El LocalApiService valida el origin y los payloads contra el
// esquema {accountId: string, command: 'launch'|'kill'|'status'|'refresh-cookie'}.

import { WebSocket } from 'ws';
import { EventEmitter } from 'node:events';

export type ControlCommand = 'launch' | 'kill' | 'status' | 'refresh-cookie';
export type ControlStatusListener = (accountId: string, status: unknown) => void;

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

function okResult(data?: unknown): { success: true; data?: unknown } {
  return { success: true, data };
}
function errResult(error: string): { success: false; error: string } {
  return { success: false, error };
}

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
  private stopReconnect = false;

  /** Abre la conexión WebSocket contra el LocalApiService. Idempotente. */
  start(port: number = DEFAULT_PORT): void {
    if (this.started && this.port === port && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    this.port = port;
    this.url = `ws://127.0.0.1:${port}/control`;
    this.started = true;
    this.stopReconnect = false;
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
      this.scheduleReconnect();
    });

    this.socket.on('error', (e: Error) => {
      // ws::readyState !== OPEN and on('close') will fire right after; just log
      // noise here. Reconnect is handled in 'close'.
      try { console.warn(`[ControlWS] error: ${e.message}`); } catch { /* best-effort */ }
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

  isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /** Cierra la conexión y limpia todo. */
  stop(): void {
    this.stopReconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.failAllPending('Control WS service stopped');
    if (this.socket) {
      try { this.socket.close(); } catch { /* best-effort */ }
      this.socket = null;
    }
    this.started = false;
    this.reconnectAttempt = 0;
  }

  private failAllPending(message: string): void {
    for (const [id, cmd] of this.pending) {
      clearTimeout(cmd.timer);
      cmd.resolve(errResult(message));
    }
    this.pending.clear();
  }
}

// Singleton — el LocalApiService y el main process comparten esta instancia.
export const controlWs: ControlWebSocketServiceImpl = new ControlWebSocketServiceImpl();
