#!/bin/bash
#
# Patches node_modules with the latest local Wisp source.
# Run after making changes to the Wisp UI kit:
#   ./scripts/patch-wisp.sh
#

set -euo pipefail

UMBRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check for Wisp in sibling directory (local dev) or .wisp (CI)
if [ -d "$UMBRA_DIR/../Wisp/packages" ]; then
  WISP_DIR="$UMBRA_DIR/../Wisp"
elif [ -d "$UMBRA_DIR/.wisp/packages" ]; then
  WISP_DIR="$UMBRA_DIR/.wisp"
else
  WISP_DIR=""
fi

# If Wisp repo isn't present, fix .mjs references in published packages
if [ -z "$WISP_DIR" ]; then
  echo "Wisp repo not found — running CI fixup for published packages."

  CORE_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-core"
  RN_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-react-native"

  # The published packages reference .mjs files that don't exist.
  # Rewrite module/exports to use .js files instead.
  for PKG_DIR in "$CORE_DEST" "$RN_DEST"; do
    [ -f "$PKG_DIR/package.json" ] || continue
    node -e "
const fs = require('fs');
const pkgPath = '$PKG_DIR/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
// Fix main/module to point at .js instead of .mjs
if (pkg.module) pkg.module = pkg.module.replace(/\\.mjs$/, '.js');
if (pkg.exports) {
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === 'object') {
      if (value.import) value.import = value.import.replace(/\\.mjs$/, '.js');
    } else if (typeof value === 'string') {
      pkg.exports[key] = value.replace(/\\.mjs$/, '.js');
    }
  }
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
"
    echo "  Fixed $PKG_DIR/package.json"
  done

  echo "Done (CI fixup)."
  exit 0
fi

WISP_DIR="$(cd "$WISP_DIR" && pwd)"

CORE_SRC="$WISP_DIR/packages/core"
RN_SRC="$WISP_DIR/packages/react-native"

CORE_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-core"
RN_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-react-native"

# Verify node_modules exists
if [ ! -d "$UMBRA_DIR/node_modules" ]; then
  echo "Error: node_modules not found. Run npm install first."
  exit 1
fi

echo "Patching Wisp packages from: $WISP_DIR"

# Sync core package
echo "  -> @coexist/wisp-core"
rm -rf "$CORE_DEST/src" "$CORE_DEST/dist"
cp -R "$CORE_SRC/src" "$CORE_DEST/src"
[ -d "$CORE_SRC/dist" ] && cp -R "$CORE_SRC/dist" "$CORE_DEST/dist"
cp "$CORE_SRC/package.json" "$CORE_DEST/package.json"

# Patch core package.json so Metro and TypeScript can resolve deep sub-path imports
# from source. We rewrite main/module/types to point at src/ and rewrite the
# exports map to point at ./src/**/*.ts instead of ./dist/**/*.{js,mjs,d.ts}.
# Also add wildcard export for ./src/* to allow deep imports.
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$CORE_DEST/package.json', 'utf8'));
pkg.main = './src/index.ts';
pkg.module = './src/index.ts';
pkg.types = './src/index.ts';
if (pkg.exports) {
  const newExports = {};
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === 'object' && value.types) {
      // Rewrite ./dist/foo/bar.d.ts -> ./src/foo/bar.ts
      const srcPath = value.types.replace(/^\\.\/dist\//, './src/').replace(/\\.d\\.ts$/, '.ts');
      newExports[key] = srcPath;
    } else if (typeof value === 'string') {
      const srcPath = value.replace(/^\\.\/dist\//, './src/').replace(/\\.(mjs|js|d\\.ts)$/, '.ts');
      newExports[key] = srcPath;
    } else {
      newExports[key] = value;
    }
  }
  // Add wildcard export for deep src/* imports
  newExports['./src/*'] = './src/*';
  pkg.exports = newExports;
}
fs.writeFileSync('$CORE_DEST/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Sync react-native package
echo "  -> @coexist/wisp-react-native"
rm -rf "$RN_DEST/src"
cp -R "$RN_SRC/src" "$RN_DEST/src"
cp "$RN_SRC/package.json" "$RN_DEST/package.json"

# Patch react-native package.json so Metro and TypeScript can resolve deep sub-path imports
# from source. We rewrite main/module/types to point at src/ and rewrite the
# exports map to point at ./src/**/*.ts instead of ./dist/**/*.{js,mjs,d.ts}.
# Also add wildcard export for ./src/* to allow deep component imports.
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$RN_DEST/package.json', 'utf8'));
pkg.main = './src/index.ts';
pkg.module = './src/index.ts';
pkg.types = './src/index.ts';
if (pkg.exports) {
  const newExports = {};
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === 'object' && value.types) {
      // Rewrite ./dist/foo/bar.d.ts -> ./src/foo/bar.ts
      const srcPath = value.types.replace(/^\\.\/dist\//, './src/').replace(/\\.d\\.ts$/, '.ts');
      newExports[key] = srcPath;
    } else if (typeof value === 'string') {
      const srcPath = value.replace(/^\\.\/dist\//, './src/').replace(/\\.(mjs|js|d\\.ts)$/, '.ts');
      newExports[key] = srcPath;
    } else {
      newExports[key] = value;
    }
  }
  // Add wildcard export for deep src/* imports
  newExports['./src/*'] = './src/*';
  newExports['./src/components/*'] = './src/components/*';
  pkg.exports = newExports;
}
fs.writeFileSync('$RN_DEST/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Done. Wisp packages patched successfully."
