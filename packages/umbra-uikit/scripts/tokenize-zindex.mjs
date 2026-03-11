/**
 * Tokenize z-index values in core style files and RN components.
 * Replaces hardcoded z-index values (9999, 9998, 9997, 1300, 1100, 50)
 * with semantic tokens from `../tokens/z-index`.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ── Mapping: file basename → z-index replacements ──
// Each entry maps old zIndex value to new token expression.
// We need per-file mappings because the SEMANTIC meaning differs.

const coreStyleMappings = {
  'Sheet.styles.ts': { 9998: 'zIndex.overlay', 9999: 'zIndex.modal' },
  'Dialog.styles.ts': { 1300: 'zIndex.modal' },
  'Navbar.styles.ts': { 1100: 'zIndex.sticky' },
  'Popover.styles.ts': { 9999: 'zIndex.popover', 9998: 'zIndex.overlay' },
  'ToastProvider.styles.ts': { 9999: 'zIndex.toast' },
  'Tooltip.styles.ts': { 9999: 'zIndex.tooltip' },
  'Select.styles.ts': { 9999: 'zIndex.dropdown' },
  'Combobox.styles.ts': { 9999: 'zIndex.dropdown' },
  'DropdownMenu.styles.ts': { 9999: 'zIndex.dropdown' },
  'ContextMenu.styles.ts': { 9999: 'zIndex.popover' },
  'DateRangePicker.styles.ts': { 9999: 'zIndex.dropdown' },
  'LocalePicker.styles.ts': { 9999: 'zIndex.dropdown' },
  'SpotlightTour.styles.ts': { 9997: 'zIndex.overlay', 9999: 'zIndex.tooltip' },
  'Command.styles.ts': { 1300: 'zIndex.modal' },
  'DatePicker.styles.ts': { 50: 'zIndex.dropdown' },
  'TimePicker.styles.ts': { 50: 'zIndex.dropdown' },
  'AchievementUnlock.styles.ts': { 9999: 'zIndex.toast' },
};

const CORE_IMPORT = `import { zIndex } from '../tokens/z-index';`;

function processFile(filePath, mappings, importLine) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let modified = false;

  // Check if already has zIndex import
  const hasImport = /import\s+.*from\s+['"].*z-index['"]/.test(content);

  for (const [oldVal, newToken] of Object.entries(mappings)) {
    // Match zIndex: <value> with optional trailing comma
    const regex = new RegExp(`(zIndex:\\s*)${oldVal}(\\s*[,}])`, 'g');
    if (regex.test(content)) {
      content = content.replace(
        new RegExp(`(zIndex:\\s*)${oldVal}(\\s*[,}])`, 'g'),
        `$1${newToken}$2`
      );
      modified = true;
    }
  }

  if (modified && !hasImport) {
    // Add import after last existing import
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, endOfLine + 1) + importLine + '\n' + content.slice(endOfLine + 1);
    } else {
      content = importLine + '\n' + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ── Process core style files ──
const coreStylesDir = path.resolve('packages/core/src/styles');
let coreModified = 0;

for (const [filename, mappings] of Object.entries(coreStyleMappings)) {
  const filePath = path.join(coreStylesDir, filename);
  if (fs.existsSync(filePath)) {
    if (processFile(filePath, mappings, CORE_IMPORT)) {
      coreModified++;
      console.log(`  ✓ ${filename}`);
    } else {
      console.log(`  - ${filename} (no changes needed)`);
    }
  } else {
    console.log(`  ✗ ${filename} (not found)`);
  }
}

console.log(`\nCore styles: ${coreModified}/${Object.keys(coreStyleMappings).length} files modified`);

// ── Process RN component files ──
const rnMappings = {
  'AchievementUnlock.tsx': { 9999: 'zIndex.toast' },
  'ToastProvider.tsx': { 9998: 'zIndex.toast' },
};

const RN_IMPORT = `import { zIndex } from '@wisp-ui/core/tokens/z-index';`;

const rnFiles = glob.sync('packages/react-native/src/**/*.tsx', {
  ignore: ['**/*.test.*', '**/*.stories.*'],
});

let rnModified = 0;
for (const filePath of rnFiles) {
  const basename = path.basename(filePath);
  const mappings = rnMappings[basename];
  if (mappings) {
    if (processFile(filePath, mappings, RN_IMPORT)) {
      rnModified++;
      console.log(`  ✓ RN: ${basename}`);
    }
  }
}

// Also check Floating, Overlay, Sticky in RN layouts
const rnLayoutMappings = {
  'Floating.tsx': { 1000: 'zIndex.dropdown' },
  'Overlay.tsx': { 1200: 'zIndex.overlay' },
  'Sticky.tsx': { 1100: 'zIndex.sticky' },
};

for (const filePath of rnFiles) {
  const basename = path.basename(filePath);
  const mappings = rnLayoutMappings[basename];
  if (mappings) {
    // Check if file has the exact zIndex value hardcoded (not already using token)
    const content = fs.readFileSync(filePath, 'utf8');
    let hasHardcoded = false;
    for (const val of Object.keys(mappings)) {
      if (new RegExp(`zIndex:\\s*${val}[,\\s}]`).test(content)) {
        hasHardcoded = true;
        break;
      }
    }
    if (hasHardcoded && processFile(filePath, mappings, RN_IMPORT)) {
      rnModified++;
      console.log(`  ✓ RN layout: ${basename}`);
    }
  }
}

console.log(`RN: ${rnModified} files modified`);
console.log('\nDone!');
