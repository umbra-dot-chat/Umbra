# DevOps Engineer Memory

## Last Known-Good Deploy
- **Service**: ghost-en (Ghost AI Bot)
- **Server**: root@45.77.149.94:/opt/ghost-ai/
- **Date**: 2026-03-10 ~23:56 UTC
- **Rollback point**: commit `83f62dd` on main
- **Changes deployed**: 720p@24fps revert (config.ts, video-source.ts, call.ts), audio track reorder (media.config.json)
- **Test results**: Voice 99.9/100, Video 93.5/100, 0 underruns, 0 drops

## Known Non-Critical Warnings
- `[WARN] Codebase path not found: ../Umbra` -- knowledge indexer looks for Umbra source tree which only exists on dev machine. Harmless on production server.

## Server Structure
- `/opt/ghost-ai/dist/` -- compiled JS (rsync target)
- `/opt/ghost-ai/media.config.json` -- audio/video track config (also needs syncing when changed)
- `/opt/ghost-ai/data/media/` -- cached media files (audio, video, images)
- `/opt/ghost-ai/node_modules/` -- installed on server
- Service: `systemctl restart ghost-en`
- Health endpoint: port 3333

## Deploy Checklist (Quick Reference)
1. `npx tsc --noEmit` in packages/umbra-ghost-ai
2. rsync dist/ AND media.config.json (if changed) to server
3. `systemctl restart ghost-en`
4. Check logs: `journalctl -u ghost-en --no-pager -n 20`
5. Voice test: score >= 80, 0 underruns
6. Video test: score >= 80, 0 drops, GPU acceleration confirmed
7. Log grep for ERROR/WARN/overflow/underrun/byteLength/drop

## GPU Confirmation
- GPU acceleration message ("NVIDIA GPU acceleration available (NVDEC + NVENC)") only appears when a video call/test is initiated, NOT at service startup.
