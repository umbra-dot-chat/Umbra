import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true }),
  ],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WispReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@wisp-ui/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@wisp-ui/core': 'WispCore',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@wisp-ui/core': resolve(__dirname, '../core/src'),
    },
  },
});
