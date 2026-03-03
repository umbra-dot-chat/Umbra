/**
 * Shared timeout constants for E2E tests (Detox + Playwright).
 */

export const TIMEOUTS = {
  /** App launch and initial JS bundle load */
  APP_LAUNCH: 30_000,
  /** Umbra core initialization (Rust FFI / WASM) */
  CORE_INIT: 30_000,
  /** Screen-to-screen navigation */
  NAVIGATION: 15_000,
  /** Button taps, form inputs, animations */
  INTERACTION: 10_000,
  /** Relay connection establishment */
  NETWORK_CONNECT: 20_000,
  /** Relay connection settlement after connect */
  RELAY_SETTLE: 12_000,
  /** Brief UI settle (animations, re-renders) */
  UI_SETTLE: 3_000,
  /** Two-user relay sync (message delivery) */
  MESSAGE_DELIVERY: 15_000,
  /** File transfer completion */
  FILE_TRANSFER: 30_000,
} as const;
