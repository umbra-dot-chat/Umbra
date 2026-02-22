#!/bin/bash
# EAS Build pre-install hook
# Clones the Wisp UI library so patch-wisp.sh can patch node_modules after install.
# On EAS cloud builders, ../Wisp doesn't exist, so we clone it into .wisp/
# which patch-wisp.sh already knows to look for as a fallback.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

WISP_DIR="$ROOT_DIR/.wisp"

# Skip if Wisp is already available (local dev with sibling directory)
if [ -d "$ROOT_DIR/../Wisp/packages" ]; then
  echo "[eas-pre-install] Wisp found at ../Wisp — skipping clone."
  exit 0
fi

# Skip if already cloned
if [ -d "$WISP_DIR/packages" ]; then
  echo "[eas-pre-install] Wisp already cloned at .wisp/ — skipping."
  exit 0
fi

echo "[eas-pre-install] Cloning Wisp UI library..."
git clone --depth 1 https://github.com/InfamousVague/Wisp.git "$WISP_DIR"
echo "[eas-pre-install] Wisp cloned successfully."
