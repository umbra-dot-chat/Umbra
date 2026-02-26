# Where We Left Off — iOS 26 TestFlight Crash Fix

## The Problem

The EAS build (v1.7.3, build 25) crashes immediately on launch (~342ms) on iOS 26 devices/TestFlight.
Crash log: `/Users/infamousvague/Downloads/testflight_feedback/crashlog.crash`

### Root Cause

**Known React Native 0.81.5 + iOS 26 incompatibility** — [facebook/react-native#54859](https://github.com/facebook/react-native/issues/54859)

Crash chain:
1. `RCTTextInputComponentView updateProps:` (line 193) triggers `_setMultiline:`
2. `_setMultiline:` calls `setDisableKeyboardShortcuts:` on `RCTUITextView`
3. `setDisableKeyboardShortcuts:` accesses `self.inputAssistantItem` (line 156 of `RCTUITextView.mm`)
4. `inputAssistantItem` → UIKit loads SF Symbol images → CoreUI catalog init → CFBundle locale resolution → ICU crash
5. Thread 1 catches the NSException in `ObjCTurboModule::performVoidMethodInvocation` and rethrows → SIGABRT

This is NOT our code — it's a React Native native code bug triggered by iOS 26's changes to ICU locale handling.

### Why Local Builds Might Not Crash

Per the community analysis (jeffthompson1971 in the issue), the crash may be specific to:
- **EAS Linux-compiled Hermes bytecode** — the Hermes compiler on Linux produces different (buggy) bytecode than on macOS
- **Prebuilt RN binaries** — EAS uses prebuilt binaries that weren't compiled against iOS 26 SDK

Local Mac builds use the local Hermes compiler + can build RN from source, which is why reproducing locally is inconsistent.

## Fixes Applied (Ready to Test)

### 1. RCTUITextView.mm Patch (Direct Crash Fix)

Wraps the crash-prone `inputAssistantItem` access in `@try/@catch`.

**File**: `node_modules/react-native/Libraries/Text/TextInput/Multiline/RCTUITextView.mm` (line 150-170)

The patch is applied in two places:
- **Directly in node_modules** (already applied for the current build)
- **Automatically via postinstall** (`scripts/postinstall.js` lines 76-137) — survives `npm install`

Also saved as `patches/react-native+0.81.5.patch` (manual patch file).

### 2. Build React Native From Source (EAS Fix)

Added `expo-build-properties` plugin to build RN from source instead of using prebuilt binaries.

**Files changed**:
- `app.json` — Added `expo-build-properties` plugin with `buildReactNativeFromSource: true`
- `ios/Podfile.properties.json` — Added `ios.buildReactNativeFromSource: true`
- `package.json` — `expo-build-properties` added as dependency

This ensures EAS builds compile RN natively (picking up our RCTUITextView patch) rather than using prebuilt binaries.

## What Was Being Tested When We Stopped

A Debug build was running on the iOS 26.2 simulator (iPhone 17 Pro, `730B4B0A-EE37-435D-84B6-99496BD08590`):

```
npx expo run:ios --device "iPhone 17 Pro"
```

Previous Release builds failed with: `ld: library 'umbra_core' not found`

### Why the Linker Error Happened

The `npx expo prebuild --clean` regenerates the `ios/` directory. The XCFramework at `modules/expo-umbra-core/ios/UmbraCore.xcframework/` only had the **simulator** slice (built via `scripts/build-mobile.sh ios-sim`). CocoaPods sets up the xcframework extraction script and adds `${PODS_XCFRAMEWORKS_BUILD_DIR}/ExpoUmbraCore` to `LIBRARY_SEARCH_PATHS`, so the linker should find `-lumbra_core` there. But it wasn't finding it.

**Possible causes:**
1. Build ordering — the xcframework copy script might not run before the link step
2. The `ios-sim` build only has `ios-arm64-simulator` but the Release build might need both slices
3. Something about the `buildReactNativeFromSource` + xcframework interaction

The Debug build (background task `b7bc855`) was running when we stopped — check its result first.

## What To Do Next

### 1. Check if the Debug Build Succeeded
```bash
tail -20 /private/tmp/claude-501/-Users-infamousvague-Development-Umbra/tasks/b7bc855.output
```
If it succeeded, the app should be installed on the simulator and you can test if it launches without crashing.

### 2. If Linker Error Persists

The `-lumbra_core` not found issue needs debugging:

```bash
# Check if the xcframework copy happened
ls -la ~/Library/Developer/Xcode/DerivedData/Umbra-*/Build/Products/Debug-iphonesimulator/XCFrameworkIntermediates/ExpoUmbraCore/

# Check what the library is named
find ~/Library/Developer/Xcode/DerivedData/Umbra-* -name "libumbra_core*" 2>/dev/null
```

If the `.a` file isn't being copied to the right place, we may need to add explicit `LIBRARY_SEARCH_PATHS` to the podspec:

```ruby
# In ExpoUmbraCore.podspec, add to pod_target_xcconfig:
'LIBRARY_SEARCH_PATHS' => '"${PODS_XCFRAMEWORKS_BUILD_DIR}/ExpoUmbraCore"',
```

### 3. Alternative: Skip buildReactNativeFromSource Locally

If the linker issue is only with `buildReactNativeFromSource`, you could:
- Keep it in `app.json` for EAS builds
- Remove it from `ios/Podfile.properties.json` for local testing
- Just test the `@try/@catch` patch alone locally

```bash
# In ios/Podfile.properties.json, remove:
# "ios.buildReactNativeFromSource": "true"
npx expo prebuild --clean --platform ios
npx expo run:ios --device "iPhone 17 Pro" --configuration Release
```

### 4. Test the Actual Fix

Once the app builds and runs on the iOS 26 simulator:
- If it launches without crashing → the `@try/@catch` patch works
- If it still crashes → check the crash log in Console.app for the simulator
- The real test is an EAS build with `buildReactNativeFromSource: true` + the postinstall patch

### 5. EAS Build for TestFlight

Once verified locally:
```bash
eas build --platform ios --profile production
```

This will use our `app.json` config with `buildReactNativeFromSource: true` and the postinstall script will patch RCTUITextView.mm before compilation.

## Disk Space Warning

The machine only has ~228GB total, was down to ~4GB during builds. Building RN from source in Release mode generates ~6GB of intermediates. Clean caches before building:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
npm cache clean --force
rm -rf ~/Library/Caches/CocoaPods/
```

## Files Modified in This Session

| File | Change |
|------|--------|
| `app.json` | Added `expo-build-properties` plugin |
| `ios/Podfile.properties.json` | Added `ios.buildReactNativeFromSource`, `ios.deploymentTarget` |
| `scripts/postinstall.js` | Added RCTUITextView.mm iOS 26 crash patch (lines 76-137) |
| `patches/react-native+0.81.5.patch` | Manual patch file (backup) |
| `node_modules/react-native/.../RCTUITextView.mm` | Direct `@try/@catch` patch applied |
| `package.json` | Added `expo-build-properties`, `patch-package` deps |

## Key Community Findings (from GH issue #54859)

1. **ryanwhittaker**: Fixed by building RN from source via Expo (`expo-build-properties`)
2. **jeffthompson1971**: Only fix was pushing OTA after install (OTA uses JSC, not Hermes bytecode)
3. **kleverdigital**: Fixed by adding `keychainService` to `expo-secure-store` calls (NOT relevant to us — we use Rust FFI SecureStore, not expo-secure-store)
4. **noshitsherlock**: Fixed by adding `scheme` to `app.json` (we already have `"scheme": "umbra"`)
5. **zsilverzweig**: Confirmed issue still exists in RN 0.83 / Expo 55

None of these are official RN fixes — the issue remains open upstream.
