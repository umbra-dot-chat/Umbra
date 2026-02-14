const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─────────────────────────────────────────────────────────────────────────────
// Extra node_modules locations — local packages live outside root node_modules
// ─────────────────────────────────────────────────────────────────────────────

config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'packages/umbra-wasm'),
  path.resolve(__dirname, 'packages/umbra-service'),
  path.resolve(__dirname, 'packages/umbra-plugin-sdk'),
  path.resolve(__dirname, 'packages/umbra-plugin-runtime'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Asset extensions — add .wasm so Metro can serve compiled WASM files
// ─────────────────────────────────────────────────────────────────────────────

config.resolver.assetExts = [
  ...(config.resolver.assetExts || []),
  'wasm',
];

// ─────────────────────────────────────────────────────────────────────────────
// Custom resolver for deep imports
// ─────────────────────────────────────────────────────────────────────────────

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fs = require('fs');

  // Intercept deep imports from @coexist/wisp-core (e.g. @coexist/wisp-core/animation/presets)
  if (moduleName.startsWith('@coexist/wisp-core/')) {
    const subPath = moduleName.replace('@coexist/wisp-core/', '');
    const resolvedPath = path.resolve(
      __dirname,
      'node_modules/@coexist/wisp-core/src',
      subPath
    );
    // Try .ts extension first, then check if it's a directory with index.ts
    const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return { type: 'sourceFile', filePath: fullPath };
      }
    }
    // If exact file exists without extension
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return { type: 'sourceFile', filePath: resolvedPath };
    }
  }

  // Resolve @umbra/wasm to local package
  if (moduleName === '@umbra/wasm') {
    const filePath = path.resolve(__dirname, 'packages/umbra-wasm/index.ts');
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }

  // Resolve @umbra/service to local package
  if (moduleName === '@umbra/service') {
    const filePath = path.resolve(__dirname, 'packages/umbra-service/src/index.ts');
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }

  // Resolve @umbra/plugin-sdk to local package
  if (moduleName === '@umbra/plugin-sdk') {
    const filePath = path.resolve(__dirname, 'packages/umbra-plugin-sdk/src/index.ts');
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }

  // Resolve @umbra/plugin-runtime to local package
  if (moduleName === '@umbra/plugin-runtime') {
    const filePath = path.resolve(__dirname, 'packages/umbra-plugin-runtime/src/index.ts');
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }

  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
