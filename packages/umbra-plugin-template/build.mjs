/**
 * Build script for Umbra plugin bundles.
 *
 * Produces a single ESM bundle at dist/bundle.js that Umbra can load.
 * React is marked as external — the host app provides it.
 *
 * Usage:
 *   node build.mjs          # one-shot build
 *   node build.mjs --watch  # rebuild on file changes
 */

import { build, context } from 'esbuild';
import { readFileSync } from 'fs';

const manifest = JSON.parse(readFileSync('./manifest.json', 'utf-8'));
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: 'es2020',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    PLUGIN_ID: JSON.stringify(manifest.id),
    PLUGIN_VERSION: JSON.stringify(manifest.version),
  },
  banner: {
    js: `// ${manifest.name} v${manifest.version} — Umbra Plugin`,
  },
};

if (isWatch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log(`[plugin-build] Watching for changes... (${manifest.name})`);
} else {
  await build(buildOptions);
  console.log(`[plugin-build] Built ${manifest.name} v${manifest.version}`);
}
