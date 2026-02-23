#!/usr/bin/env node
/**
 * Cross-platform postinstall script.
 *
 * - If the Wisp repo is present (local dev), delegates to patch-wisp.sh
 * - Otherwise (CI / Windows), fixes .mjs references in published Wisp packages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UMBRA_DIR = path.resolve(__dirname, '..');
// Look for Wisp in sibling directory (local dev) or inside workspace (CI)
const WISP_DIR_LOCAL = path.resolve(UMBRA_DIR, '..', 'Wisp');
const WISP_DIR_CI = path.resolve(UMBRA_DIR, '.wisp');
const WISP_DIR = fs.existsSync(path.join(WISP_DIR_CI, 'packages'))
  ? WISP_DIR_CI
  : WISP_DIR_LOCAL;

const CORE_DEST = path.join(UMBRA_DIR, 'node_modules', '@coexist', 'wisp-core');
const RN_DEST = path.join(UMBRA_DIR, 'node_modules', '@coexist', 'wisp-react-native');

// ── Patch Expo CLI devicectl for Xcode 26+ (jsonVersion 3) ───────────────────
// Xcode 26+ ships devicectl that outputs jsonVersion:3, but Expo CLI only
// accepts version 2. This patch accepts both so physical device builds work.
const devicectlPath = path.join(
  UMBRA_DIR, 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'platforms', 'ios', 'devicectl.js'
);
if (fs.existsSync(devicectlPath)) {
  let src = fs.readFileSync(devicectlPath, 'utf8');
  const old = '.jsonVersion) !== 2)';
  const patched = '.jsonVersion) !== 2 && _devicesJson_info.jsonVersion !== 3)';
  if (src.includes(old) && !src.includes(patched)) {
    src = src.replace(old, patched);
    fs.writeFileSync(devicectlPath, src);
    console.log('[postinstall] Patched @expo/cli devicectl.js for Xcode 26+ (jsonVersion 3)');
  } else if (src.includes(patched)) {
    console.log('[postinstall] @expo/cli devicectl.js — already patched');
  } else {
    console.log('[postinstall] @expo/cli devicectl.js — patch target not found (may be fixed upstream)');
  }
} else {
  console.log('[postinstall] @expo/cli devicectl.js not found — skipping patch');
}

// ── Patch Expo CLI XcodeBuild to always pass -allowProvisioningUpdates ────────
// Expo only adds -allowProvisioningUpdates when it sets DEVELOPMENT_TEAM itself,
// but skips it when the team is already configured in the pbxproj. This causes
// "No profiles found" errors on device builds with automatic signing.
const xcodeBuildPath = path.join(
  UMBRA_DIR, 'node_modules', '@expo', 'cli', 'build', 'src', 'run', 'ios', 'XcodeBuild.js'
);
if (fs.existsSync(xcodeBuildPath)) {
  let xbSrc = fs.readFileSync(xcodeBuildPath, 'utf8');
  const oldProvision = "args.push(`DEVELOPMENT_TEAM=${developmentTeamId}`, '-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration');";
  const newProvision = "args.push(`DEVELOPMENT_TEAM=${developmentTeamId}`);\n        }\n        args.push('-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration');";
  // Check for the already-patched form to avoid double-patching
  if (xbSrc.includes(oldProvision)) {
    // Need to replace the old block including the closing brace
    xbSrc = xbSrc.replace(
      oldProvision + "\n        }",
      newProvision
    );
    fs.writeFileSync(xcodeBuildPath, xbSrc);
    console.log('[postinstall] Patched @expo/cli XcodeBuild.js — always pass -allowProvisioningUpdates');
  } else if (xbSrc.includes("args.push('-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration');")) {
    console.log('[postinstall] @expo/cli XcodeBuild.js — already patched');
  } else {
    console.log('[postinstall] @expo/cli XcodeBuild.js — patch target not found (may be fixed upstream)');
  }
} else {
  console.log('[postinstall] @expo/cli XcodeBuild.js not found — skipping patch');
}

// Check if local Wisp repo exists
const hasWisp = fs.existsSync(path.join(WISP_DIR, 'packages'));

if (hasWisp && process.platform !== 'win32') {
  // Local dev on Unix — run the full bash patch script
  console.log('[postinstall] Wisp repo found — running patch-wisp.sh');
  try {
    execSync('bash scripts/patch-wisp.sh', { cwd: UMBRA_DIR, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
  process.exit(0);
}

// CI or Windows — fix .mjs references in published packages
console.log('[postinstall] Wisp repo not available — fixing .mjs references in published packages');

for (const pkgDir of [CORE_DEST, RN_DEST]) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`  Skipping ${pkgDir} (not installed)`);
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  let changed = false;

  // Fix module field
  if (pkg.module && pkg.module.endsWith('.mjs')) {
    pkg.module = pkg.module.replace(/\.mjs$/, '.js');
    changed = true;
  }

  // Fix exports map
  if (pkg.exports) {
    for (const [key, value] of Object.entries(pkg.exports)) {
      if (typeof value === 'object' && value !== null) {
        if (value.import && value.import.endsWith('.mjs')) {
          value.import = value.import.replace(/\.mjs$/, '.js');
          changed = true;
        }
      } else if (typeof value === 'string' && value.endsWith('.mjs')) {
        pkg.exports[key] = value.replace(/\.mjs$/, '.js');
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  Fixed ${path.basename(pkgDir)}/package.json`);
  } else {
    console.log(`  ${path.basename(pkgDir)} — no fixes needed`);
  }
}

// ── Configure git hooks ──────────────────────────────────────────────────────
// Point git to .githooks/ so the pre-commit XCFramework check runs automatically.
// This is a no-op if already configured or if we're in CI (no .git directory).
const gitDir = path.join(UMBRA_DIR, '.git');
const hooksDir = path.join(UMBRA_DIR, '.githooks');
if (fs.existsSync(gitDir) && fs.existsSync(hooksDir)) {
  try {
    execSync('git config core.hooksPath .githooks', { cwd: UMBRA_DIR, stdio: 'ignore' });
    console.log('[postinstall] Git hooks configured → .githooks/');
  } catch {
    // Non-fatal — hooks are a convenience, not a requirement
  }
}

console.log('[postinstall] Done.');
