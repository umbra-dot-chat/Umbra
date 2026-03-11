import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/Wisp/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@wisp-ui/react': resolve(__dirname, '../packages/react/src'),
      '@wisp-ui/core': resolve(__dirname, '../packages/core/src'),
      '@coexist/wisp-react': resolve(__dirname, '../packages/react/src'),
      '@coexist/wisp-core': resolve(__dirname, '../packages/core/src'),
    },
  },
  optimizeDeps: {
    exclude: ['react-native'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
