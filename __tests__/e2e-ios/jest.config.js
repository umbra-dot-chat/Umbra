/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/__tests__/e2e-ios/**/*.test.ts'],
  testTimeout: 120000,
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

  // Exclude two-device tests from the default single-device run.
  // Two-device tests require a paired process running on a second simulator
  // and coordinate via /tmp/umbra-e2e-sync.json. They must be run via the
  // dedicated scripts in scripts/ (e.g. run-two-device-test.sh, run-dm-test.sh).
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/e2e-ios/two-device/',
  ],
};
