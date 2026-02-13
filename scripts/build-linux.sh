#!/bin/bash
# Build Umbra Desktop for Linux (.deb + .AppImage)
# Shorthand for: ./scripts/build-desktop.sh --linux
exec "$(dirname "$0")/build-desktop.sh" --linux
