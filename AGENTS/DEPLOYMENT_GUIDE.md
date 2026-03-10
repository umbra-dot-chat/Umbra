# Deployment Guide — Umbra Services

## Ghost AI Bot (umbra-ghost-ai)

### Server Details

| Property | Value |
|----------|-------|
| Address | 45.77.149.94 |
| User | root |
| Path | /opt/ghost-ai |
| Service | ghost-en (systemd) |
| Hardware | 6x Intel Broadwell, 62GB RAM, NVIDIA A16-16Q GPU |
| FFmpeg | System `/usr/bin/ffmpeg` with NVDEC + NVENC |

### Full Deploy Sequence

```bash
# 1. Pre-deploy: type-check and build
cd packages/umbra-ghost-ai
npx tsc --noEmit        # Catch type errors before deploying broken code
npx tsc                  # Compile to dist/

# 2. Sync to server
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/

# 3. Restart service
ssh root@45.77.149.94 "systemctl restart ghost-en"

# 4. Verify startup (check for crash/error)
ssh root@45.77.149.94 "sleep 2 && journalctl -u ghost-en --no-pager -n 15"

# 5. Run real-pipeline tests (see TESTING_PLAYBOOK.md)
# Voice + Video must both pass >= 80/100

# 6. Log inspection
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```

### Rollback

```bash
# If something breaks, redeploy from git
cd packages/umbra-ghost-ai
git stash                              # Save broken changes
npx tsc                                # Rebuild from clean state
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/
ssh root@45.77.149.94 "systemctl restart ghost-en"
```

### Monitoring During Live Calls

```bash
# Stream logs in real-time
ssh root@45.77.149.94 "journalctl -u ghost-en -f"

# Look for:
# OK:  "Starting video: ... (1280x720@24fps)"
# OK:  "NVIDIA GPU acceleration available (NVDEC + NVENC)"
# OK:  "Pre-buffer filled"
# BAD: "Frame feed error"
# BAD: "Ring buffer overflow"
# BAD: "GPU acceleration not available"
```

## Frontend (Expo Web)

### Development

```bash
npm run web               # Expo dev server (web)
npx expo start            # Expo dev server (all platforms)
```

### Wisp UI Sync

After changing the Wisp UI kit (sibling `../Wisp/` directory):

```bash
npm run patch             # Syncs Wisp packages to node_modules
# OR
./scripts/patch-wisp.sh   # Same thing, manual
```

This runs automatically on `npm install` via postinstall hook.

### Desktop (Tauri)

```bash
npm run build:desktop:dev   # Development build with hot reload
./scripts/build-mac.sh      # macOS production build
./scripts/build-win.sh      # Windows production build
./scripts/build-linux.sh    # Linux production build
```

### Mobile

```bash
./scripts/build-mobile.sh   # iOS + Android builds
npx expo prebuild            # Generate native projects
npx expo run:ios             # Build and run on iOS simulator
npx expo run:android         # Build and run on Android emulator
```

### WASM (Rust Core for Web)

```bash
npm run build:wasm          # Compile umbra-core to WASM
# OR
./scripts/build-wasm.sh     # Same thing, manual
```

## Pre-Deploy Sanity Checks

Before ANY deployment:

1. `npx tsc --noEmit` passes
2. `npm test` passes (or at least no regressions)
3. Changes are committed (or stashed with intent to commit)
4. You know how to rollback if it breaks
