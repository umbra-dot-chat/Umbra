import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const rnSvgDir = dirname(require.resolve('react-native-svg/package.json'));
const rnSvgWeb = resolve(rnSvgDir, 'lib/module/ReactNativeSVG.web.js');

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@wisp-ui/core': resolve(__dirname, '../core/src'),
      'react-native/Libraries/Utilities/codegenNativeComponent': resolve(__dirname, '../../tests/codegenNativeComponentStub.js'),
      'react-native': 'react-native-web',
      'react-native-svg': rnSvgWeb,
    },
  },
});
