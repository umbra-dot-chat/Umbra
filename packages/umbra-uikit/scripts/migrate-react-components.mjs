#!/usr/bin/env node
/**
 * migrate-react-components.mjs
 *
 * Migrates React components from `useThemeColors()` to `useTheme()`.
 *
 * For each component .tsx file that imports useThemeColors:
 *   1. Updates the import: `useThemeColors` → `useTheme`
 *      (handles cases where useTheme is already imported)
 *   2. Replaces hook call: `const themeColors = useThemeColors();`
 *      → `const { theme } = useTheme();` + `const themeColors = theme.colors;`
 *   3. Replaces style builder arguments: `themeColors` → `theme`
 *      when passed as function arguments to resolve/build/get style functions
 *   4. Replaces opts-style `themeColors` shorthand → `theme` in object literals
 *      passed to style builder functions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REACT_SRC = path.join(ROOT, 'packages/react/src');

// Find all .tsx/.ts files that use useThemeColors
const files = execSync(
  `grep -rl "useThemeColors" "${REACT_SRC}" --include="*.tsx" --include="*.ts"`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

const skipFiles = ['hooks.ts', 'WispProvider.tsx', 'index.ts'];

let modifiedCount = 0;
let skippedCount = 0;

for (const filePath of files) {
  const fileName = path.basename(filePath);
  if (skipFiles.includes(fileName)) { skippedCount++; continue; }
  if (fileName.endsWith('.stories.tsx') || fileName.endsWith('.stories.ts')) { skippedCount++; continue; }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // =====================================================================
  // STEP 1: Update import statement
  // =====================================================================
  // Possible patterns:
  //   import { useThemeColors } from '../../providers';
  //   import { useThemeColors } from '../../../providers';
  //   import { useTheme, useThemeColors } from '../../providers';
  //   import { useThemeColors, WispProvider } from '../../providers';

  const importRegex = /(import\s*\{)([^}]*)\}(\s*from\s*['"][^'"]*providers[^'"]*['"];?)/;
  const importMatch = content.match(importRegex);

  if (importMatch) {
    const prefix = importMatch[1];
    const names = importMatch[2];
    const suffix = importMatch[3];

    // Parse import names
    const importNames = names.split(',').map(n => n.trim()).filter(Boolean);
    const hasUseTheme = importNames.includes('useTheme');
    const hasUseThemeColors = importNames.includes('useThemeColors');

    if (hasUseThemeColors) {
      let newNames;
      if (hasUseTheme) {
        // Already has useTheme, just remove useThemeColors
        newNames = importNames.filter(n => n !== 'useThemeColors');
      } else {
        // Replace useThemeColors with useTheme
        newNames = importNames.map(n => n === 'useThemeColors' ? 'useTheme' : n);
      }
      const newImport = `${prefix} ${newNames.join(', ')} }${suffix}`;
      content = content.replace(importRegex, newImport);
    }
  }

  // =====================================================================
  // STEP 2: Replace hook call
  // =====================================================================
  // `const themeColors = useThemeColors();`
  // → `const { theme } = useTheme();`
  //   `const themeColors = theme.colors;`

  content = content.replace(
    /const themeColors = useThemeColors\(\);/g,
    'const { theme } = useTheme();\n  const themeColors = theme.colors;'
  );

  // Also handle cases where useTheme() is already called and this file had both:
  // `const { theme } = useTheme();`
  // `const themeColors = useThemeColors();`
  // The second line becomes: `const themeColors = theme.colors;`
  // But we already replaced it above, which would add a duplicate `const { theme } = useTheme();`
  // Check if there's already a `const { theme }` and remove duplicates
  const themeDestructureCount = (content.match(/const \{ theme \} = useTheme\(\);/g) || []).length;
  if (themeDestructureCount > 1) {
    // Remove duplicate — keep the first one, remove subsequent
    let found = false;
    content = content.replace(/const \{ theme \} = useTheme\(\);\n\s*/g, (match) => {
      if (!found) { found = true; return match; }
      return '';
    });
  }

  // =====================================================================
  // STEP 3: Replace style builder function arguments
  // =====================================================================
  // Functions now take `theme: WispTheme` instead of `themeColors: ThemeColors`
  //
  // Replace `themeColors` when passed as a positional arg to style builders:
  //   resolveXxxColors(variant, themeColors)  → resolveXxxColors(variant, theme)
  //   buildXxxStyle(sizeConfig, colors, themeColors) → buildXxxStyle(sizeConfig, colors, theme)
  //   getXxxStyle(padding, radius, themeColors) → getXxxStyle(padding, radius, theme)

  // Match: resolveXXX/buildXXX/getXXX followed by ( then anything then themeColors
  // But DON'T match when themeColors is followed by . (property access, e.g. themeColors.text)
  content = content.replace(
    /\b(resolve\w+|build\w+Style|build\w+Color\w*|get\w+Style|get\w+Skeleton\w*)\s*\(([^)]*?)\bthemeColors\b(?!\.)/g,
    (match, funcName, before) => {
      return `${funcName}(${before}theme`;
    }
  );

  // =====================================================================
  // STEP 4: Replace opts-style themeColors in object literals
  // =====================================================================
  // Handle `buildCardStyle({ variant, padding, themeColors })` → `{ variant, padding, theme }`
  // and `buildCardStyle({ variant, themeColors: themeColors })` → `{ variant, theme: theme }`
  // Actually, after migration, the opts field is `theme`, so we replace `themeColors` shorthand with `theme`
  // in objects that are passed to style builders.

  // Pattern: inside an object literal passed to a builder function, replace `themeColors` with `theme`
  // We look for: `builderFunc({...themeColors...})` patterns
  content = content.replace(
    /\b(resolve\w+|build\w+Style|build\w+Color\w*|get\w+Style|get\w+Skeleton\w*)\s*\(\s*\{([^}]*)\bthemeColors\b([^}]*)\}/g,
    (match, funcName, before, after) => {
      return `${funcName}({${before}theme${after}}`;
    }
  );

  // Also handle: `themeColors,` or `, themeColors` inside useMemo deps arrays
  // needs `theme,` instead — but the deps should also use `theme` now since
  // the memoized computation depends on the full theme.
  // Actually, we want to KEEP themeColors in deps for color-only changes,
  // but also add `theme` for style builder calls.
  // Best approach: keep deps as-is for now (they'll still work — themeColors
  // changes when theme changes).

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedCount++;
    const relPath = path.relative(ROOT, filePath);
    console.log(`  ✓ ${relPath}`);
  } else {
    skippedCount++;
  }
}

console.log(`\nDone: ${modifiedCount} files modified, ${skippedCount} skipped`);
