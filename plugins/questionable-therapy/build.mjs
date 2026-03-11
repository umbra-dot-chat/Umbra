/**
 * Build script for Umbra plugin bundles.
 *
 * Produces a single ESM bundle at dist/bundle.js that Umbra can load.
 * React/React Native are shimmed via globalThis to avoid bare specifier
 * issues when loaded as blob URLs.
 *
 * Usage:
 *   node build.mjs          # one-shot build
 *   node build.mjs --watch  # rebuild on file changes
 */

import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync('./manifest.json', 'utf-8'));
const isWatch = process.argv.includes('--watch');

// Create shim files that re-export from globalThis
const shimDir = join(__dirname, '.build-shims');
mkdirSync(shimDir, { recursive: true });

writeFileSync(join(shimDir, 'react.js'),
  `const React = globalThis.React; export default React; export const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, createElement, Fragment, memo, forwardRef } = React;`
);
writeFileSync(join(shimDir, 'react-jsx-runtime.js'),
  `const React = globalThis.React; export const jsx = React.createElement; export const jsxs = React.createElement; export const Fragment = React.Fragment;`
);
writeFileSync(join(shimDir, 'react-native.js'),
  `const RN = globalThis.ReactNative; export default RN; export const { View, Text, Pressable, ScrollView, Platform, StyleSheet, Animated, Dimensions } = RN;`
);

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
  alias: {
    'react': join(shimDir, 'react.js'),
    'react/jsx-runtime': join(shimDir, 'react-jsx-runtime.js'),
    'react-native': join(shimDir, 'react-native.js'),
  },
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
