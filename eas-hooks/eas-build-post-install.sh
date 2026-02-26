#!/bin/bash
# EAS Build post-install hook (Android)
# Verifies pre-built libumbra_core.so files are present.
# The .so files are built locally via `npm run build:mobile:android`
# and shipped to EAS via .easignore (which includes jniLibs/).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Only run for Android builds
if [ "${EAS_BUILD_PLATFORM:-}" != "android" ]; then
  echo "[eas-post-install] Not an Android build — skipping."
  exit 0
fi

JNI_DIR="$ROOT_DIR/modules/expo-umbra-core/android/src/main/jniLibs"

echo "[eas-post-install] Verifying pre-built native libraries..."

MISSING=0
for ABI in arm64-v8a x86_64; do
  SO="$JNI_DIR/$ABI/libumbra_core.so"
  if [ -f "$SO" ]; then
    echo "[eas-post-install] ✓ $ABI/libumbra_core.so ($(du -h "$SO" | cut -f1))"
  else
    echo "[eas-post-install] ✗ MISSING: $ABI/libumbra_core.so"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo "[eas-post-install] ERROR: Pre-built .so files are missing!"
  echo "[eas-post-install] Run 'npm run build:mobile:android' locally before 'eas build'."
  exit 1
fi

echo "[eas-post-install] All native libraries present."
