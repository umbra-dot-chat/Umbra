declare module 'ws' {
  import { EventEmitter } from 'events';

  class WebSocket extends EventEmitter {
    static readonly OPEN: number;
    static readonly CLOSED: number;
    static readonly CONNECTING: number;
    static readonly CLOSING: number;

    constructor(url: string, protocols?: string | string[]);

    readyState: number;

    close(code?: number, reason?: string): void;
    send(data: string | Buffer | ArrayBuffer | Uint8Array): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'message', listener: (data: Buffer | string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'close', listener: (code: number, reason: string) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export default WebSocket;
}
