# QA Automated Agent Memory

## Pre-existing Issues

### Type-check (tsc --noEmit)
- As of 2026-03-10, `npx tsc --noEmit` has many pre-existing errors (test files, component files, packages).
- None are in `src/hooks/useNetwork.ts` itself.
- Key pre-existing errors: `testID` prop issues on Wisp components, `umbra-test-bot` missing module declarations, e2e test type issues, `sendFileMessage.test.ts` missing `fileId` property.
- `__tests__/settings/useNetwork.test.ts:179` has a pre-existing TS2322 error (`Type 'string' is not assignable to type 'never'`).
- `app/(main)/_layout.tsx(924,52)`: pre-existing TS2345 (`'"profile"'` not assignable to `SettingsSection | undefined`).
- `src/components/sidebar/ChatSidebar.tsx(100,16)`: pre-existing TS2322 (Sidebar prop type mismatch with `children`, `testID`, `width`, `style`).

### Unit Tests (npm test)
- As of 2026-03-10, 85 out of 105 test suites fail. 387/1010 tests fail. These are ALL pre-existing.
- `useNetwork.test.ts` fails at import time due to `window.addEventListener` in `src/utils/debug.ts:221` (JSDOM environment issue).
- Two-device e2e-ios tests always fail in Jest (require device sync).
- Identical results with and without current working changes (verified via `git stash` comparison).

### Dev Server
- Expo dev server runs on port 8083 via `npx expo start --port 8083 --web`.
- Occasional `Cannot pipe to a closed or destroyed stream` errors in expo-server vendor code -- appears to be an expo-server framework issue, not app code.

## Project Structure Notes
- `UmbraService.editMessage(messageId, newText)` is defined in `packages/umbra-service/src/service.ts:441`, delegates to `packages/umbra-service/src/messaging.ts:252`.
- `useNetwork.ts` uses module-level `_lastService` variable (set at lines 1233, 1244, 1256, 1448) which is accessed in `_handleRelayMessage` as `const service = _lastService`.
- Service mock for tests lives at `__mocks__/@umbra/service.js`.
- Launch config at `.claude/launch.json` -- expo-dev server name is "expo-dev".
