module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|@coexist/wisp-react-native|@coexist/wisp-core)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@coexist/wisp-core/tokens/motion$': '<rootDir>/__mocks__/@coexist/wisp-core/tokens/motion.js',
    '^@coexist/wisp-react-native$': '<rootDir>/__mocks__/@coexist/wisp-react-native.js',
    '^@coexist/wisp-react-native/(.*)$': '<rootDir>/__mocks__/@coexist/wisp-react-native.js',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.js',
    '^@umbra/service$': '<rootDir>/__mocks__/@umbra/service.js',
    '^@umbra/wasm$': '<rootDir>/__mocks__/@umbra/wasm.js',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/contexts/**/*.{ts,tsx}',
    'packages/umbra-service/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};
