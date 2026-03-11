import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(config) {
    const { resolve, dirname } = await import('path');
    const { existsSync } = await import('fs');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);

    // Resolve react-native-svg's web-compatible entry to avoid fabric/codegen imports
    const rnSvgDir = dirname(require.resolve('react-native-svg/package.json'));
    const rnSvgWeb = resolve(rnSvgDir, 'lib/module/ReactNativeSVG.web.js');

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@wisp-ui/react': resolve(__dirname, '../packages/react/src'),
      '@wisp-ui/react-native': resolve(__dirname, '../packages/react-native/src'),
      '@wisp-ui/core': resolve(__dirname, '../packages/core/src'),
      'react-native-svg': rnSvgWeb,
      'react-native': resolve(__dirname, '../node_modules/react-native-web'),
    };
    // Prefer .web.js extensions so react-native-svg internal imports
    // (e.g. ./elements) resolve to their web-compatible variants
    config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'];

    // Remove vite-plugin-dts — it's for the library build, not Storybook
    config.plugins = (config.plugins || []).filter(
      (p: any) => !p || (p.name !== 'vite:dts' && p.name !== 'vite-plugin-dts'),
    );
    config.plugins.push({
      name: 'stub-react-native-internals',
      enforce: 'pre' as const,
      resolveId(source: string) {
        if (source.includes('Libraries/Utilities/codegenNativeComponent')) return source;
        if (source === '@react-native-clipboard/clipboard') return source;
        if (source.startsWith('@react-native/assets-registry')) return '\0stub:assets-registry';
        if (source === 'buffer') return '\0stub:buffer';
        return null;
      },
      load(id: string) {
        if (id.includes('Libraries/Utilities/codegenNativeComponent')) {
          return 'export default function codegenNativeComponent() { return null; }';
        }
        if (id === '@react-native-clipboard/clipboard') {
          return 'export default { setString() {}, getString() { return Promise.resolve(""); } }';
        }
        if (id === '\0stub:assets-registry') {
          return 'export function getAssetByID() { return null; }';
        }
        if (id === '\0stub:buffer') {
          return 'export class Buffer { static from() { return new Buffer(); } toString() { return ""; } }';
        }
        return null;
      },
    });

    // Stub native-only modules for esbuild's pre-bundler (runs before Vite plugins)
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.esbuildOptions = config.optimizeDeps.esbuildOptions || {};
    config.optimizeDeps.esbuildOptions.plugins = [
      ...(config.optimizeDeps.esbuildOptions.plugins || []),
      {
        name: 'stub-codegen',
        setup(build: any) {
          // Redirect react-native-svg to its web entry so esbuild never crawls fabric/
          build.onResolve({ filter: /^react-native-svg$/ }, () => ({
            path: rnSvgWeb,
          }));
          // For relative imports inside react-native-svg, prefer .web.js variants
          // so ./elements resolves to elements.web.js (not the native elements.js)
          build.onResolve({ filter: /^\./ }, (args: any) => {
            if (!args.importer || !args.importer.includes('react-native-svg')) return null;
            const dir = dirname(args.importer);
            const webPath = resolve(dir, args.path + '.web.js');
            if (existsSync(webPath)) return { path: webPath };
            return null;
          });
          // Stub @react-native/assets-registry which ships Flow syntax in .js files
          build.onResolve({ filter: /^@react-native\/assets-registry/ }, () => ({
            path: 'assets-registry-stub',
            namespace: 'stub',
          }));
          // Intercept codegen imports from react-native-svg fabric components
          build.onResolve({ filter: /Libraries\/Utilities\/codegenNativeComponent/ }, () => ({
            path: 'codegenNativeComponent',
            namespace: 'stub',
          }));
          // Stub fabric/TurboModule imports that react-native-web doesn't provide
          build.onResolve({ filter: /\/fabric\/Native/ }, () => ({
            path: 'fabric-stub',
            namespace: 'stub',
          }));
          // Named export stub for @react-native/assets-registry (getAssetByID)
          build.onLoad({ filter: /^assets-registry-stub$/, namespace: 'stub' }, () => ({
            contents: 'export function getAssetByID() { return null; } export default getAssetByID;',
            loader: 'js',
          }));
          build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
            contents: 'export default function stub() { return null; }',
            loader: 'js',
          }));
          // Intercept optional native peer deps
          build.onResolve({ filter: /^@react-native-clipboard\/clipboard$/ }, () => ({
            path: 'clipboard-stub',
            namespace: 'stub',
          }));
        },
      },
    ];

    return config;
  },
};

export default config;
