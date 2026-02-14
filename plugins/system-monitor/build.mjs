import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !watch,
  external: ['react', '@umbra/plugin-sdk'],
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  tsconfig: 'tsconfig.json',
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[system-monitor] watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('[system-monitor] build complete -> dist/bundle.js');
}
