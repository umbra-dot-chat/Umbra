#!/bin/bash
# Build Umbra Desktop for Windows (.exe + .msi)
# Shorthand for: ./scripts/build-desktop.sh --win
exec "$(dirname "$0")/build-desktop.sh" --win
