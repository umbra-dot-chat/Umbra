/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: '__tests__/e2e-ios/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Umbra.app',
      build: 'echo "Using pre-built binary. Run detox:build first."',
      launchArgs: {
        detoxEnableSynchronization: 0,
      },
    },
  },
  devices: {
    iphone17pro: {
      type: 'ios.simulator',
      device: { type: 'iPhone 17 Pro' },
    },
    iphone17promax: {
      type: 'ios.simulator',
      device: { type: 'iPhone 17 Pro Max' },
    },
  },
  configurations: {
    'ios.release': {
      device: 'iphone17pro',
      app: 'ios.release',
    },
    'ios.release.userB': {
      device: 'iphone17promax',
      app: 'ios.release',
    },
  },
  artifacts: {
    rootDir: '__tests__/e2e-ios/artifacts/',
    plugins: {
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      timeline: 'enabled',
    },
  },
  behavior: {
    init: {
      expireAfter: 120000,
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },
  session: {
    autoStart: true,
    debugSynchronization: 0,
  },
};
