// Ambient declaration for the `ws` package — only the APIs the app uses.
// ws@8 ships untyped (no bundled .d.ts). Rather than pulling in
// @types/ws as a new dev dependency, we declare here the surface the
// ControlWebSocketService and LocalApiService consume. If @types/ws is ever
// added, this ambient declaration can be deleted and the real typed export
// will take over.

declare module 'ws' {
  export class WebSocket {
    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    readonly readyState: 0 | 1 | 2 | 3;

    constructor(
      address: string,
      options?: {
        headers?: Record<string, string>;
        protocol?: string | string[];
        handshakeTimeout?: number;
        perMessageDeflate?: boolean | Record<string, unknown>;
      },
    );

    on(event: 'open', listener: () => void): this;
    on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(
      event: 'message',
      listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void,
    ): this;

    off(event: 'message', listener: (...args: unknown[]) => void): this;

    send(
      data: string | Buffer | ArrayBuffer,
      cb?: (err?: Error) => void,
    ): void;
    send(
      data: string | Buffer | ArrayBuffer,
      options: { compress?: boolean; binary?: boolean; fin?: boolean; mask?: boolean },
      cb?: (err?: Error) => void,
    ): void;

    close(code?: number, reason?: string | Buffer): void;
    terminate(): void;
  }

  // WebSocketServer — used by LocalApiService to accept upgrades on /control.
  // The real class extends EventEmitter; here we declare emit/on directly
  // (no extends) to side-step ambient-module `extends import(...)` limitations.
  export class WebSocketServer {
    static readonly INITIALIZING: 0;
    static readonly RUNNING: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    readonly readyState: 0 | 1 | 2 | 3;
    readonly clients: Set<WebSocket>;

    constructor(options?: {
      port?: number;
      host?: string;
      server?: import('node:http').Server;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      backlog?: number;
    });

    on(event: 'connection', listener: (socket: WebSocket, req: import('node:http').IncomingMessage) => void): this;
    on(event: 'listening', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: string | symbol, listener: (...args: unknown[]) => void): this;

    emit(event: 'connection', socket: WebSocket, req: import('node:http').IncomingMessage): boolean;
    emit(event: string | symbol, ...args: unknown[]): boolean;

    close(cb?: (err?: Error) => void): void;
    handleUpgrade(
      req: import('node:http').IncomingMessage,
      socket: import('node:net').Socket,
      head: Buffer,
      cb: (ws: WebSocket) => void,
    ): void;
  }
}
