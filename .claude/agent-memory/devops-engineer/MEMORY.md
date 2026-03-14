# DevOps Engineer Memory

## Last Known-Good Deploy
- **Service**: ghost-en (Ghost AI Bot)
- **Server**: root@45.77.149.94:/opt/ghost-ai/
- **Date**: 2026-03-12 ~00:41 UTC
- **Commit**: `0ce1380` on main (rollback to `dd04477` for ghost-ai-only)
- **Changes deployed**: Ghost + Wisps integration (umbra-wisps package, wisp swarm orchestrator, deploy script ghost command)
- **Deploy method**: `./scripts/deploy.sh ghost` (builds wisps, builds ghost, rsyncs dist + wisps + package.json + media.config, npm install, systemd env, restart)
- **Test results**: Voice 99.4/100, Video 94.9/100, 0 underruns, 0 drops, GPU confirmed
- **Wisps**: 4 active (Nyx, Flicker, Bramble, Pixel), control API on port 3334, WISPS_ENABLED=true via systemd drop-in

## Known Non-Critical Warnings
- `[WARN] Codebase path not found: ../Umbra` -- knowledge indexer looks for Umbra source tree which only exists on dev machine. Harmless on production server.

## Server Structure
- `/opt/ghost-ai/dist/` -- compiled JS (rsync target)
- `/opt/ghost-ai/wisps/` -- @umbra/wisps package (dist/ + package.json, file: dependency)
- `/opt/ghost-ai/media.config.json` -- audio/video track config (also needs syncing when changed)
- `/opt/ghost-ai/data/media/` -- cached media files (audio, video, images)
- `/opt/ghost-ai/node_modules/` -- installed on server
- `/etc/systemd/system/ghost-en.service.d/wisps.conf` -- wisp env vars (WISPS_ENABLED, WISP_COUNT, WISP_MODEL)
- Service: `systemctl restart ghost-en`
- Health endpoint: port 3333
- Wisp control API: port 3334

## Deploy Checklist (Quick Reference)
- **Full deploy with wisps**: `./scripts/deploy.sh ghost` (preferred, handles everything)
- **Manual steps if needed**:
  1. Build wisps: `cd packages/umbra-wisps && npx tsc`
  2. Build ghost: `cd packages/umbra-ghost-ai && npx tsc --noEmit && npx tsc`
  3. rsync dist/, wisps/, media.config.json, package.json to server
  4. `npm install --production` on server
  5. `systemctl restart ghost-en`
  6. Check logs: `journalctl -u ghost-en --no-pager -n 30`
  7. Voice test: score >= 80, 0 underruns
  8. Video test: score >= 80, 0 drops, GPU acceleration confirmed
  9. Log grep for ERROR/WARN/overflow/underrun/byteLength/drop

## GPU Confirmation
- GPU acceleration message ("NVIDIA GPU acceleration available (NVDEC + NVENC)") only appears when a video call/test is initiated, NOT at service startup.
