#!/bin/bash
# ============================================================================
# Build Umbra Core for iOS and Android
#
# Compiles the Rust umbra-core library as a static/shared library for
# mobile platforms. Output is copied to the Expo module directory:
#
#   iOS:     modules/expo-umbra-core/ios/libumbra_core.a
#   Android: modules/expo-umbra-core/android/src/main/jniLibs/<abi>/libumbra_core.so
#
# Usage:
#   ./scripts/build-mobile.sh            # Build all platforms
#   ./scripts/build-mobile.sh ios        # iOS only
#   ./scripts/build-mobile.sh android    # Android only
#   ./scripts/build-mobile.sh ios-sim    # iOS simulator only (for development)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CORE_DIR="$ROOT_DIR/packages/umbra-core"
MODULE_DIR="$ROOT_DIR/modules/expo-umbra-core"

PLATFORM="${1:-all}"

echo "============================================"
echo "  Building Umbra Core → Mobile Native"
echo "  Platform: $PLATFORM"
echo "============================================"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Prerequisites
# ─────────────────────────────────────────────────────────────────────────────

check_rust_target() {
    local target="$1"
    if ! rustup target list --installed | grep -q "$target"; then
        echo "Adding Rust target: $target"
        rustup target add "$target"
    fi
}

check_android_ndk() {
    if [ -z "${ANDROID_NDK_HOME:-}" ]; then
        # Try common locations
        if [ -d "$HOME/Library/Android/sdk/ndk" ]; then
            # Find latest NDK version
            ANDROID_NDK_HOME=$(ls -d "$HOME/Library/Android/sdk/ndk"/*/ 2>/dev/null | sort -V | tail -1 | sed 's:/$::')
        elif [ -d "$HOME/Android/Sdk/ndk" ]; then
            ANDROID_NDK_HOME=$(ls -d "$HOME/Android/Sdk/ndk"/*/ 2>/dev/null | sort -V | tail -1 | sed 's:/$::')
        fi

        if [ -z "${ANDROID_NDK_HOME:-}" ]; then
            echo "ERROR: ANDROID_NDK_HOME not set and NDK not found."
            echo "Install via: sdkmanager --install 'ndk;27.0.12077973'"
            echo "Or set ANDROID_NDK_HOME manually."
            return 1
        fi

        export ANDROID_NDK_HOME
    fi

    echo "Using Android NDK: $ANDROID_NDK_HOME"
}

# ─────────────────────────────────────────────────────────────────────────────
# iOS Build
# ─────────────────────────────────────────────────────────────────────────────

build_ios() {
    echo ""
    echo "──────────────────────────────────────────"
    echo "  Building for iOS (arm64)"
    echo "──────────────────────────────────────────"

    check_rust_target "aarch64-apple-ios"

    cd "$CORE_DIR"

    cargo build --release \
        --target aarch64-apple-ios \
        --features ffi \
        --lib

    # Copy to Expo module
    local src="$CORE_DIR/target/aarch64-apple-ios/release/libumbra_core.a"
    local dst="$MODULE_DIR/ios/libumbra_core.a"

    if [ -f "$src" ]; then
        cp "$src" "$dst"
        echo "✓ iOS device library: $dst ($(du -h "$dst" | cut -f1))"
    else
        echo "ERROR: Build succeeded but library not found at $src"
        return 1
    fi
}

build_ios_sim() {
    echo ""
    echo "──────────────────────────────────────────"
    echo "  Building for iOS Simulator (arm64)"
    echo "──────────────────────────────────────────"

    check_rust_target "aarch64-apple-ios-sim"

    cd "$CORE_DIR"

    cargo build --release \
        --target aarch64-apple-ios-sim \
        --features ffi \
        --lib

    # For development, we use the simulator build directly
    local src="$CORE_DIR/target/aarch64-apple-ios-sim/release/libumbra_core.a"
    local dst="$MODULE_DIR/ios/libumbra_core.a"

    if [ -f "$src" ]; then
        cp "$src" "$dst"
        echo "✓ iOS simulator library: $dst ($(du -h "$dst" | cut -f1))"
        echo ""
        echo "NOTE: This is the simulator build. For a device build, run:"
        echo "  ./scripts/build-mobile.sh ios"
    else
        echo "ERROR: Build succeeded but library not found at $src"
        return 1
    fi
}

build_ios_universal() {
    echo ""
    echo "──────────────────────────────────────────"
    echo "  Creating iOS Universal Library"
    echo "──────────────────────────────────────────"

    check_rust_target "aarch64-apple-ios"
    check_rust_target "aarch64-apple-ios-sim"

    cd "$CORE_DIR"

    # Build both targets
    cargo build --release --target aarch64-apple-ios --features ffi --lib
    cargo build --release --target aarch64-apple-ios-sim --features ffi --lib

    local device_lib="$CORE_DIR/target/aarch64-apple-ios/release/libumbra_core.a"
    local sim_lib="$CORE_DIR/target/aarch64-apple-ios-sim/release/libumbra_core.a"
    local dst="$MODULE_DIR/ios/libumbra_core.a"

    # For now, just use the simulator build for development
    # TODO: Create xcframework with both architectures
    cp "$sim_lib" "$dst"
    echo "✓ iOS library (simulator): $dst ($(du -h "$dst" | cut -f1))"
    echo ""
    echo "Device library also available at: $device_lib"
}

# ─────────────────────────────────────────────────────────────────────────────
# Android Build
# ─────────────────────────────────────────────────────────────────────────────

build_android() {
    echo ""
    echo "──────────────────────────────────────────"
    echo "  Building for Android (arm64 + x86_64)"
    echo "──────────────────────────────────────────"

    check_android_ndk || return 1
    check_rust_target "aarch64-linux-android"
    check_rust_target "x86_64-linux-android"

    cd "$CORE_DIR"

    # Configure cargo for Android cross-compilation
    local toolchain="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt"
    local host_tag
    case "$(uname -s)" in
        Darwin) host_tag="darwin-x86_64" ;;
        Linux)  host_tag="linux-x86_64" ;;
        *)      echo "Unsupported OS for Android builds"; return 1 ;;
    esac

    local tc_dir="$toolchain/$host_tag"

    # Set up cargo config for Android targets
    export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="$tc_dir/bin/aarch64-linux-android24-clang"
    export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER="$tc_dir/bin/x86_64-linux-android24-clang"
    export CC_aarch64_linux_android="$tc_dir/bin/aarch64-linux-android24-clang"
    export CC_x86_64_linux_android="$tc_dir/bin/x86_64-linux-android24-clang"
    export AR_aarch64_linux_android="$tc_dir/bin/llvm-ar"
    export AR_x86_64_linux_android="$tc_dir/bin/llvm-ar"

    # Build arm64
    echo "Building arm64-v8a..."
    cargo build --release \
        --target aarch64-linux-android \
        --features ffi \
        --lib

    # Build x86_64 (for emulator)
    echo "Building x86_64..."
    cargo build --release \
        --target x86_64-linux-android \
        --features ffi \
        --lib

    # Copy to Expo module jniLibs directory
    local jni_dir="$MODULE_DIR/android/src/main/jniLibs"
    mkdir -p "$jni_dir/arm64-v8a" "$jni_dir/x86_64"

    local arm64_src="$CORE_DIR/target/aarch64-linux-android/release/libumbra_core.so"
    local x86_src="$CORE_DIR/target/x86_64-linux-android/release/libumbra_core.so"

    if [ -f "$arm64_src" ]; then
        cp "$arm64_src" "$jni_dir/arm64-v8a/"
        echo "✓ Android arm64-v8a: $jni_dir/arm64-v8a/libumbra_core.so ($(du -h "$arm64_src" | cut -f1))"
    else
        echo "ERROR: arm64 build succeeded but .so not found at $arm64_src"
    fi

    if [ -f "$x86_src" ]; then
        cp "$x86_src" "$jni_dir/x86_64/"
        echo "✓ Android x86_64: $jni_dir/x86_64/libumbra_core.so ($(du -h "$x86_src" | cut -f1))"
    else
        echo "ERROR: x86_64 build succeeded but .so not found at $x86_src"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

case "$PLATFORM" in
    ios)
        build_ios
        ;;
    ios-sim)
        build_ios_sim
        ;;
    ios-all)
        build_ios_universal
        ;;
    android)
        build_android
        ;;
    all)
        build_ios_universal
        build_android
        ;;
    *)
        echo "Usage: $0 [ios|ios-sim|ios-all|android|all]"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo "  Build complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. cd $ROOT_DIR"
echo "  2. npx expo prebuild --clean"
echo "  3. npx expo run:ios  (or run:android)"
