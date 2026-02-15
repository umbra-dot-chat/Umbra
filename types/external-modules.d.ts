/**
 * Type declarations for optional native modules that may not be installed
 * in all environments (web, iOS, Android).
 */

declare module 'react-native-callkeep' {
  interface RNCallKeep {
    setup(options: {
      ios?: {
        appName: string;
        supportsVideo?: boolean;
      };
      android?: {
        alertTitle: string;
        alertDescription: string;
        cancelButton: string;
        okButton: string;
        additionalPermissions?: string[];
        selfManaged?: boolean;
      };
    }): Promise<void>;
    displayIncomingCall(
      uuid: string,
      handle: string,
      localizedCallerName: string,
      handleType: string,
      hasVideo: boolean,
    ): void;
    setCurrentCallActive(uuid: string): void;
    endCall(uuid: string): void;
  }

  const callkeep: RNCallKeep;
  export default callkeep;
}

declare module 'react-native-webrtc' {
  export const mediaDevices: {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    enumerateDevices(): Promise<MediaDeviceInfo[]>;
  };
}

/**
 * sql.js — SQLite compiled to WASM, loaded at runtime.
 */
declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string, params?: any[]): QueryExecResult[];
    each(sql: string, params: any[], callback: (row: any) => void, done?: () => void): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }
  interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(params?: any): Record<string, any>;
    get(params?: any[]): any[];
    free(): boolean;
    run(params?: any[]): void;
    reset(): void;
  }
  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}

/**
 * WASM module loaded from /public at runtime.
 * This is a dynamic import from a URL path, not a real npm module.
 */
declare module '/umbra_core.js' {
  const mod: {
    default: (wasmUrl: string) => Promise<void>;
    [key: string]: any;
  };
  export default mod.default;
  export = mod;
}

/**
 * Tauri plugin-updater — OTA updates for desktop apps.
 * Types are provided by the package itself; this fallback
 * prevents TS errors when the package is not installed (web/mobile).
 */
declare module '@tauri-apps/plugin-updater' {
  export function check(): Promise<any>;
}

/**
 * Tauri plugin-process — Process management for desktop apps.
 */
declare module '@tauri-apps/plugin-process' {
  export function relaunch(): Promise<void>;
  export function exit(code?: number): Promise<void>;
}
