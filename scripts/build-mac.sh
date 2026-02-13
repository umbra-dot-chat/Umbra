#!/bin/bash
# Build Umbra Desktop for macOS (.dmg + .app)
# Shorthand for: ./scripts/build-desktop.sh --mac
exec "$(dirname "$0")/build-desktop.sh" --mac
