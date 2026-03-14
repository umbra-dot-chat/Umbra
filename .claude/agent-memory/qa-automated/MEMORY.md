# QA Automated Agent Memory

## Pre-existing Issues

### Type-check (tsc --noEmit)
- As of 2026-03-11 (post-Wisp migration), `npx tsc --noEmit` passes with 0 errors.
- Previous baseline (pre-Wisp migration): 67 pre-existing errors.
- The Wisp migration + recent fix commits (e4e3b1f, e9ac8d0, 4bdad50, 202647a, a911fa0) resolved all type errors.
- Ghost-ai package (`packages/umbra-ghost-ai`): passes `tsc --noEmit` with 0 errors.

### Unit Tests (npm test)
- As of 2026-03-11 (post-Wisp migration + fix commits): 27/27 test suites pass, 631/631 tests pass.
- Previous baseline (pre-Wisp migration): 85/105 test suites failed, 387/1010 tests failed.
- Fix commits (e4e3b1f, e9ac8d0, 4bdad50) excluded e2e-ios tests, fixed debug.ts JSDOM issue, and resolved test file type errors.
- All tests now passing cleanly with 0 failures.

### Lint
- No ESLint config at project level. No lint scripts in package.json. Lint is not configured for this project.

### Dev Server
- Expo dev server runs on port 8083 via `npx expo start --port 8083 --web`.
- Occasional `Cannot pipe to a closed or destroyed stream` errors in expo-server vendor code -- appears to be an expo-server framework issue, not app code.

## Project Structure Notes
- `UmbraService.editMessage(messageId, newText)` is defined in `packages/umbra-service/src/service.ts:441`, delegates to `packages/umbra-service/src/messaging.ts:252`.
- `useNetwork.ts` uses module-level `_lastService` variable (set at lines 1233, 1244, 1256, 1448) which is accessed in `_handleRelayMessage` as `const service = _lastService`.
- Service mock for tests lives at `__mocks__/@umbra/service.js`.
- Launch config at `.claude/launch.json` -- expo-dev server name is "expo-dev".
