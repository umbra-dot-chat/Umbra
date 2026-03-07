#!/usr/bin/env node
/**
 * Dev server launcher for Tauri dev mode.
 *
 * Checks if an Expo/Metro dev server is already running on the target port.
 * If so, reuses it (keeps the process alive so Tauri doesn't exit).
 * If not, spawns `npx expo start --web --port <PORT>`.
 *
 * This prevents port conflicts when the developer already has an Expo
 * server running (e.g. started manually for mobile + web simultaneously).
 *
 * Usage:
 *   node scripts/start-dev.js          # default port 8081
 *   UMBRA_DEV_PORT=3000 node scripts/start-dev.js
 */

const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.UMBRA_DEV_PORT || '8081';
const CHECK_TIMEOUT = 2000; // ms to wait for existing server

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => {
      req.destroy();
      resolve(true);
    });
    req.on('error', () => {
      req.destroy();
      resolve(false);
    });
    req.setTimeout(CHECK_TIMEOUT, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const portInUse = await checkPort(PORT);

  if (portInUse) {
    console.log(`[start-dev] Dev server already running on port ${PORT} — reusing it`);
    console.log('[start-dev] Hot-reload will work through the existing Metro server');
    // Stay alive so Tauri keeps us as a managed child process.
    // When Tauri exits it will kill this process.
    process.stdin.resume();
    return;
  }

  console.log(`[start-dev] No server on port ${PORT} — starting Expo...`);

  const child = spawn('npx', ['expo', 'start', '--web', '--port', PORT], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  child.on('error', (err) => {
    console.error('[start-dev] Failed to start Expo:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Forward signals to the child
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      child.kill(sig);
    });
  }
}

main();
