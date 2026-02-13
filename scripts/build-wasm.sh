#!/bin/bash
# ============================================================================
# Build Umbra Core for WebAssembly
#
# Compiles the Rust umbra-core library to WASM using wasm-pack.
# Output goes to packages/umbra-wasm/pkg/
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CORE_DIR="$ROOT_DIR/packages/umbra-core"
WASM_DIR="$ROOT_DIR/packages/umbra-wasm"
OUT_DIR="$WASM_DIR/pkg"

echo "============================================"
echo "  Building Umbra Core → WebAssembly"
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

echo "Building with wasm-pack..."
echo "  Source: $CORE_DIR"
echo "  Output: $OUT_DIR"
echo ""

cd "$CORE_DIR"

# Build for web target (generates ES module + WASM binary)
wasm-pack build \
    --target web \
    --out-dir "$OUT_DIR" \
    --features wasm \
    2>&1

# wasm-pack generates its own package.json in pkg/ which conflicts
# with our package layout. Remove it to avoid confusion.
rm -f "$OUT_DIR/package.json"
rm -f "$OUT_DIR/.gitignore"

echo ""
echo "============================================"
echo "  Build complete!"
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
    echo "WASM module size: $SIZE"
else
    echo "WARNING: WASM file not found at $WASM_FILE"
fi

# ── Copy to public/ for Expo web serving ────────────────────────────────
# Metro can't bundle wasm-bindgen output, so we serve the JS glue + WASM
# binary as static assets from public/. The loader.ts uses dynamic import
# from the root path (e.g. import('/umbra_core.js')).
PUBLIC_DIR="$ROOT_DIR/public"
mkdir -p "$PUBLIC_DIR"

echo ""
echo "Copying WASM files to public/..."
cp "$OUT_DIR/umbra_core.js"      "$PUBLIC_DIR/umbra_core.js"
cp "$OUT_DIR/umbra_core_bg.wasm" "$PUBLIC_DIR/umbra_core_bg.wasm"
echo "  → public/umbra_core.js"
echo "  → public/umbra_core_bg.wasm"
