#!/usr/bin/env bash
# ============================================================================
# Build Umbra Core WASM with debug-trace instrumentation
#
# Identical to build-wasm.sh but enables the debug-trace feature so every
# FFI function emits FFI_ENTER / FFI_EXIT tracing events at INFO level.
#
# To activate in the browser:
#   localStorage.__umbra_debug = '1'
#
# The tracing events appear in the browser console via tracing-wasm.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CORE_DIR="$ROOT_DIR/packages/umbra-core"
WASM_DIR="$ROOT_DIR/packages/umbra-wasm"
OUT_DIR="$WASM_DIR/pkg"

echo "============================================"
echo "  Building Umbra Core → WebAssembly (DEBUG)"
echo "  FFI tracing instrumentation ENABLED"
echo "============================================"
echo ""

# Check for wasm-pack
if ! command -v wasm-pack &>/dev/null; then
    echo "wasm-pack not found. Installing..."
    cargo install wasm-pack
    echo ""
fi

# Check for wasm32 target
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
    echo ""
fi

# Clean previous build
if [ -d "$OUT_DIR" ]; then
    echo "Cleaning previous build..."
    rm -rf "$OUT_DIR"
fi

echo "Building with wasm-pack (features: wasm,debug-trace)..."
echo "  Source: $CORE_DIR"
echo "  Output: $OUT_DIR"
echo ""

cd "$CORE_DIR"

# Build for web target with debug-trace feature enabled
wasm-pack build \
    --target web \
    --out-dir "$OUT_DIR" \
    --features wasm,debug-trace \
    2>&1

# wasm-pack generates its own package.json in pkg/ which conflicts
# with our package layout. Remove it to avoid confusion.
rm -f "$OUT_DIR/package.json"
rm -f "$OUT_DIR/.gitignore"

echo ""
echo "============================================"
echo "  Debug build complete!"
echo "  FFI tracing is enabled."
echo "============================================"
echo ""

# Show output files
echo "Output files:"
ls -lh "$OUT_DIR/" 2>/dev/null || echo "  (no files)"
echo ""

# Show WASM size
WASM_FILE="$OUT_DIR/umbra_core_bg.wasm"
if [ -f "$WASM_FILE" ]; then
    SIZE=$(du -h "$WASM_FILE" | cut -f1)
    echo "WASM module size: $SIZE (larger than release due to tracing)"
else
    echo "WARNING: WASM file not found at $WASM_FILE"
fi

# ── Copy to public/ for Expo web serving ────────────────────────────────
PUBLIC_DIR="$ROOT_DIR/public"
mkdir -p "$PUBLIC_DIR"

echo ""
echo "Copying WASM files to public/..."
cp "$OUT_DIR/umbra_core.js"      "$PUBLIC_DIR/umbra_core.js"
cp "$OUT_DIR/umbra_core_bg.wasm" "$PUBLIC_DIR/umbra_core_bg.wasm"
echo "  → public/umbra_core.js"
echo "  → public/umbra_core_bg.wasm"
