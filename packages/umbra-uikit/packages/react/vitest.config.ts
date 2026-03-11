import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
      '@coexist/wisp-core': resolve(__dirname, '../core/src'),
    },
  },
});
