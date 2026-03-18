# DevOps Engineer Memory

## Last Known-Good Deploy — Ghost AI
- **Service**: ghost-en (Ghost AI Bot)
- **Server**: root@45.77.149.94:/opt/ghost-ai/
- **Date**: 2026-03-17 ~03:49 UTC
- **Commit**: `368c596` on main (fix wisps: route relay call events and stringify signal payloads)
- **Changes deployed**: wisps-only update -- relay-client call room event types, orchestrator event routing fix, voice-babble signal payload stringify
- **Deploy method**: Manual wisps-only deploy -- built locally, rsync'd wisps/dist + wisps/package.json + wisps/babble to server, systemctl restart
- **Test results**: Startup clean, all 12 wisps connected, no errors in log grep. Real-pipeline voice/video tests NOT run (user did not request).
- **Previous known-good**: 2026-03-17 ~02:55 UTC commit `1ca5e52`
- **Wisps**: 12 active, control API on port 3334

## Last Known-Good Deploy — Frontend
- **Service**: umbra.chat (Expo web app on nginx)
- **Server**: root@207.246.126.67:/var/www/umbra.chat/
- **Date**: 2026-03-17 ~03:53 UTC
- **Commit**: `44f797f` on main (fix: resolve group call participant names from friends list)
- **Key changes**: Group call participant display names resolved from friends list in app/(main)/index.tsx
- **Deploy method**: `./scripts/deploy.sh frontend` (expo export + rsync + nginx reload + certbot)
- **Verification**: HTTP 200 on index (37590 bytes) and JS bundle (7.15MB), SSL valid, certbot re-applied
- **Previous known-good**: 2026-03-17 ~03:11 UTC commit `6881bf7`

## Last Known-Good Deploy — Relay
- **Service**: umbra-relay (Docker container on relay.umbra.chat)
- **Server**: root@207.246.126.67:/opt/umbra-relay/
- **Date**: 2026-03-17 ~19:18 UTC
- **Commit**: `92e7032` on main (fix(relay): remove joiner notification to prevent WebRTC glare)
- **Key changes**: Removed CallParticipantJoined notification to joiner in handle_join_call_room -- existing participants now create offers to joiner (one-directional), preventing simultaneous offer creation (glare). Reverts 4808af3.
- **Deploy method**: `./scripts/deploy.sh relay` (stages src + Dockerfile + docker-compose.yml, rsyncs to server, docker compose build + up -d)
- **Verification**: Clean startup, client reconnected within 1s, Seoul federation peer connected, 8 bridge configs loaded, no errors
- **Previous known-good**: 2026-03-17 ~17:13 UTC (uncommitted glare fix, same code)
- **Rollback commit**: `4808af3`

## Known Non-Critical Warnings
- `[WARN] Codebase path not found: ../Umbra` -- knowledge indexer looks for Umbra source tree which only exists on dev machine. Harmless on production server.

## SSH Auth Notes
- Password auth to 45.77.149.94 requires `sshpass -f` (file-based) via a bash script. Inline sshpass in zsh fails due to shell escaping.
- The `deploy-ghost-finish.sh` script handles this correctly. For ad-hoc SSH commands, write a bash script to /tmp and execute it.
- Password: stored in `.deploy-credentials` as GHOST_PASSWORD

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

## Relay Server Structure
- `/opt/umbra-relay/` -- project root (Dockerfile, docker-compose.yml, Cargo.toml, src/)
- `/opt/umbra-relay/.env` -- federation env vars (RELAY_ID, RELAY_REGION, RELAY_LOCATION, RELAY_PUBLIC_URL, RELAY_PEERS) + OAuth secrets
- Docker container: `umbra-relay-relay-1`, listens on port 8080
- Bridge bot container: `umbra-relay-bridge-1` (Discord bridge)
- Health endpoint: `https://relay.umbra.chat/health` (HTTP 200)
- WebSocket endpoint: `wss://relay.umbra.chat/ws`
- Federation: primary (US East, relay-us-east-1) federated with Seoul (relay-ap-seoul-1)
- Deploy command: `./scripts/deploy.sh relay`

## Deploy Checklist (Quick Reference)
- **Full deploy with wisps**: `./scripts/deploy.sh ghost` (preferred, handles everything)
- **Finish deploy (files already on server)**: `./scripts/deploy-ghost-finish.sh` (npm install + systemd + restart + verify)
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
