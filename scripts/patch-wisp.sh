#!/bin/bash
#
# Patches node_modules with the latest local Wisp source.
# Run after making changes to the Wisp UI kit:
#   ./scripts/patch-wisp.sh
#

set -euo pipefail

UMBRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WISP_DIR="$(cd "$UMBRA_DIR/../Wisp" && pwd)"

CORE_SRC="$WISP_DIR/packages/core"
RN_SRC="$WISP_DIR/packages/react-native"

CORE_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-core"
RN_DEST="$UMBRA_DIR/node_modules/@coexist/wisp-react-native"

# Verify Wisp repo exists
if [ ! -d "$WISP_DIR/packages" ]; then
  echo "Error: Wisp repo not found at $WISP_DIR"
  exit 1
fi

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

# Patch core package.json so Metro can resolve deep sub-path imports from source.
# Metro doesn't support the "exports" field well, so we rewrite main/module/types
# to point at src/ and remove the exports field entirely.
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$CORE_DEST/package.json', 'utf8'));
pkg.main = './src/index.ts';
pkg.module = './src/index.ts';
pkg.types = './src/index.ts';
delete pkg.exports;
fs.writeFileSync('$CORE_DEST/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Sync react-native package
echo "  -> @coexist/wisp-react-native"
rm -rf "$RN_DEST/src"
cp -R "$RN_SRC/src" "$RN_DEST/src"
cp "$RN_SRC/package.json" "$RN_DEST/package.json"

echo "Done. Wisp packages patched successfully."
