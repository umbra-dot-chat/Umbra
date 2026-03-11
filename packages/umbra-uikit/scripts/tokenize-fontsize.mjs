/**
 * Tokenize fontSize and lineHeight values across the codebase.
 * Replaces hardcoded font sizes with defaultTypography.sizes.X.fontSize
 * and pixel lineHeight strings with defaultTypography.sizes.X.lineHeight.
 *
 * Off-scale values snap to nearest:
 *   11 → xs(12), 13 → sm(14), 15 → base(16), 22 → 2xl(24), 26 → 2xl(24)
 *
 * Leaves ratio lineHeight (1.4, 1.5 etc) as-is.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ── Font size → token mapping ──
const fontSizeMap = {
  10: `defaultTypography.sizes['2xs'].fontSize`,
  11: `defaultTypography.sizes.xs.fontSize`,       // snap 11→12
  12: `defaultTypography.sizes.xs.fontSize`,
  13: `defaultTypography.sizes.sm.fontSize`,        // snap 13→14
  14: `defaultTypography.sizes.sm.fontSize`,
  15: `defaultTypography.sizes.base.fontSize`,      // snap 15→16
  16: `defaultTypography.sizes.base.fontSize`,
  18: `defaultTypography.sizes.lg.fontSize`,
  20: `defaultTypography.sizes.xl.fontSize`,
  22: `defaultTypography.sizes['2xl'].fontSize`,    // snap 22→24
  24: `defaultTypography.sizes['2xl'].fontSize`,
  26: `defaultTypography.sizes['2xl'].fontSize`,    // snap 26→24
  30: `defaultTypography.sizes['3xl'].fontSize`,
  36: `defaultTypography.sizes['4xl'].fontSize`,
};

// ── lineHeight pixel value → token mapping ──
// Only for 'Npx' string patterns
const lineHeightPxMap = {
  14: `defaultTypography.sizes['2xs'].lineHeight`,
  16: `defaultTypography.sizes.xs.lineHeight`,
  18: `defaultTypography.sizes.xs.lineHeight`,      // snap 18→16
  20: `defaultTypography.sizes.sm.lineHeight`,
  24: `defaultTypography.sizes.base.lineHeight`,
  28: `defaultTypography.sizes.lg.lineHeight`,
  32: `defaultTypography.sizes['2xl'].lineHeight`,
  36: `defaultTypography.sizes['3xl'].lineHeight`,
  40: `defaultTypography.sizes['4xl'].lineHeight`,
};

// ── Remaining string padding values to fix ──
const stringPaddingReplacements = [
  // pattern → replacement (using template literals with defaultSpacing)
  { from: `'0 6px'`, to: '`0 ${defaultSpacing.sm}px`' },       // 6→sm(8)
  { from: `"0 6px"`, to: '`0 ${defaultSpacing.sm}px`' },
  { from: `'0 4px'`, to: '`0 ${defaultSpacing.xs}px`' },
  { from: `"0 4px"`, to: '`0 ${defaultSpacing.xs}px`' },
  { from: `'0 8px'`, to: '`0 ${defaultSpacing.sm}px`' },
  { from: `"0 8px"`, to: '`0 ${defaultSpacing.sm}px`' },
  { from: `"8px 12px"`, to: '`${defaultSpacing.sm}px ${defaultSpacing.md}px`' },
  { from: `'8px 12px'`, to: '`${defaultSpacing.sm}px ${defaultSpacing.md}px`' },
  { from: `"4px 0"`, to: '`${defaultSpacing.xs}px 0`' },
  { from: `'4px 0'`, to: '`${defaultSpacing.xs}px 0`' },
  { from: `'4px 0 0 0'`, to: '`${defaultSpacing.xs}px 0 0 0`' },
  { from: `'12px 0 4px 0'`, to: '`${defaultSpacing.md}px 0 ${defaultSpacing.xs}px 0`' },
];

const CORE_IMPORT_TYPOGRAPHY = `import { defaultTypography } from '../theme/create-theme';`;
const CORE_IMPORT_SPACING = `import { defaultSpacing } from '../theme/create-theme';`;
const RN_IMPORT_TYPOGRAPHY = `import { defaultTypography } from '@wisp-ui/core/theme/create-theme';`;

function addImportIfMissing(content, importStr, checkStr) {
  if (content.includes(checkStr)) return content;

  // Add after last import line
  const lastImportIdx = content.lastIndexOf('\nimport ');
  if (lastImportIdx !== -1) {
    const endOfLine = content.indexOf('\n', lastImportIdx + 1);
    return content.slice(0, endOfLine + 1) + importStr + '\n' + content.slice(endOfLine + 1);
  }
  return importStr + '\n' + content;
}

function mergeTypographyImport(content, isCore) {
  // If already imports defaultTypography, nothing to do
  if (content.includes('defaultTypography')) return content;

  // If already imports from create-theme, add defaultTypography to existing import
  const createThemeImportRegex = isCore
    ? /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/theme\/create-theme['"]/
    : /import\s*\{([^}]+)\}\s*from\s*['"]@wisp-ui\/core\/theme\/create-theme['"]/;

  const match = content.match(createThemeImportRegex);
  if (match) {
    const existingImports = match[1].trim();
    const newImports = existingImports + ', defaultTypography';
    return content.replace(match[0], match[0].replace(match[1], ' ' + newImports + ' '));
  }

  // No existing create-theme import — add new import line
  return addImportIfMissing(
    content,
    isCore ? CORE_IMPORT_TYPOGRAPHY : RN_IMPORT_TYPOGRAPHY,
    'defaultTypography'
  );
}

function mergeSpacingImport(content) {
  if (content.includes('defaultSpacing')) return content;

  const createThemeImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/theme\/create-theme['"]/;
  const match = content.match(createThemeImportRegex);
  if (match) {
    const existingImports = match[1].trim();
    const newImports = existingImports + ', defaultSpacing';
    return content.replace(match[0], match[0].replace(match[1], ' ' + newImports + ' '));
  }

  return addImportIfMissing(content, CORE_IMPORT_SPACING, 'defaultSpacing');
}

function processFile(filePath, isCore = true) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let needsTypography = false;
  let needsSpacing = false;

  // Replace fontSize: N (where N is in our map)
  for (const [size, token] of Object.entries(fontSizeMap)) {
    const regex = new RegExp(`(fontSize:\\s*)${size}(\\s*[,}\\n])`, 'g');
    if (regex.test(content)) {
      content = content.replace(
        new RegExp(`(fontSize:\\s*)${size}(\\s*[,}\\n])`, 'g'),
        `$1${token}$2`
      );
      needsTypography = true;
    }
  }

  // Replace lineHeight: 'Npx' strings
  for (const [px, token] of Object.entries(lineHeightPxMap)) {
    // Match lineHeight: 'Npx' or lineHeight: "Npx"
    const regex1 = new RegExp(`(lineHeight:\\s*)['"]${px}px['"]`, 'g');
    if (regex1.test(content)) {
      content = content.replace(
        new RegExp(`(lineHeight:\\s*)['"]${px}px['"]`, 'g'),
        `$1${token}`
      );
      needsTypography = true;
    }
  }

  // Replace string padding/margin values (core styles only)
  if (isCore) {
    for (const { from, to } of stringPaddingReplacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        needsSpacing = true;
      }
    }
  }

  // Add imports if needed
  if (needsTypography) {
    content = mergeTypographyImport(content, isCore);
  }
  if (needsSpacing) {
    content = mergeSpacingImport(content);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ── Process core style files ──
console.log('=== Core Style Files ===');
const coreStyleFiles = glob.sync('packages/core/src/styles/*.styles.ts');
let coreModified = 0;
for (const f of coreStyleFiles) {
  if (processFile(f, true)) {
    coreModified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`Core styles: ${coreModified}/${coreStyleFiles.length} files modified\n`);

// ── Process core type files ──
console.log('=== Core Type Files ===');
const coreTypeFiles = glob.sync('packages/core/src/types/*.types.ts');
let typeModified = 0;
for (const f of coreTypeFiles) {
  if (processFile(f, true)) {
    typeModified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`Core types: ${typeModified}/${coreTypeFiles.length} files modified\n`);

// ── Process RN component files ──
console.log('=== React Native Files ===');
const rnFiles = glob.sync('packages/react-native/src/**/*.tsx', {
  ignore: ['**/*.test.*', '**/*.stories.*'],
});
let rnModified = 0;
for (const f of rnFiles) {
  if (processFile(f, false)) {
    rnModified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`RN: ${rnModified}/${rnFiles.length} files modified\n`);

// ── Process React component files ──
console.log('=== React Files ===');
const reactFiles = glob.sync('packages/react/src/**/*.tsx', {
  ignore: ['**/*.test.*', '**/*.stories.*'],
});
let reactModified = 0;
for (const f of reactFiles) {
  if (processFile(f, false)) {
    reactModified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`React: ${reactModified}/${reactFiles.length} files modified\n`);

console.log(`Total: ${coreModified + typeModified + rnModified + reactModified} files modified`);
