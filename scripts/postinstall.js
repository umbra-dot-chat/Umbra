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
const WISP_DIR = path.resolve(UMBRA_DIR, '..', 'Wisp');

const CORE_DEST = path.join(UMBRA_DIR, 'node_modules', '@coexist', 'wisp-core');
const RN_DEST = path.join(UMBRA_DIR, 'node_modules', '@coexist', 'wisp-react-native');

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

console.log('[postinstall] Done.');
