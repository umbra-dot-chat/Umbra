// Ambient module declarations for @umbra/wasm cross-package imports
// that are resolved at bundle time but not available to TypeScript.

declare module '@umbra/service/src/opfs-bridge' {
  export function initOpfsBridge(): boolean;
}

declare module 'sql.js' {
  const initSqlJs: any;
  export default initSqlJs;
}
