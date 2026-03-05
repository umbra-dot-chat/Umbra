/**
 * Jest config for two-device E2E tests.
 *
 * These tests require TWO simulator processes running in parallel:
 *   - User A on iPhone 17 Pro     (ios.release)
 *   - User B on iPhone 17 Pro Max (ios.release.userB)
 *
 * They coordinate via /tmp/umbra-e2e-sync.json using writeSync/waitForSync.
 *
 * DO NOT run these with the default `npx detox test` command.
 * Use the dedicated scripts instead:
 *   ./scripts/run-two-device-test.sh   — Friend request flow
 *   ./scripts/run-dm-test.sh           — DM conversation flow
 *   ./scripts/run-send-recv-test.sh    — Sending/receiving messages
 *   ./scripts/run-two-device-all.sh    — All two-device test pairs
 *
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  rootDir: '../../..',
  testMatch: ['<rootDir>/__tests__/e2e-ios/two-device/*.test.ts'],
  testTimeout: 180000,
  maxWorkers: 1,
  transform: {
    '\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
