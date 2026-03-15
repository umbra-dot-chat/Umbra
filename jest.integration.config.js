const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/__tests__/integration/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Remove @umbra/wasm mock so real WASM is used in integration tests
    '^@umbra/wasm$': undefined,
  },
};

// Clean up undefined entries from moduleNameMapper
Object.keys(module.exports.moduleNameMapper).forEach((key) => {
  if (module.exports.moduleNameMapper[key] === undefined) {
    delete module.exports.moduleNameMapper[key];
  }
});
