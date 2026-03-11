#!/usr/bin/env node
/**
 * migrate-theme-tokens.mjs
 *
 * Comprehensive migration of style builder files to accept `theme: WispTheme`.
 *
 * Migrates ALL exported functions that either:
 *   a) Reference static defaults (defaultRadii, defaultSpacing, defaultTypography, defaultShadows)
 *   b) Have `themeColors: ThemeColors` as a parameter (direct or inside opts)
 *
 * For each migrated function:
 *   1. `themeColors: ThemeColors` → `theme: WispTheme` (direct or opts param)
 *   2. Adds `const { colors: themeColors, ...tokens } = theme;` destructuring at body start
 *   3. Renames `defaultRadii` → `radii`, etc. in the function body
 *   4. Replaces `opts.themeColors` → `themeColors` (from destructure)
 *   5. Updates internal calls to other migrated functions to pass `theme` instead of `themeColors`
 *
 * After all functions, cleans up create-theme imports and adds WispTheme import.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STYLES_DIR = path.join(ROOT, 'packages/core/src/styles');

const styleFiles = fs.readdirSync(STYLES_DIR)
  .filter(f => f.endsWith('.styles.ts'))
  .map(f => path.join(STYLES_DIR, f));

const TOKEN_MAP = {
  defaultRadii: 'radii',
  defaultSpacing: 'spacing',
  defaultTypography: 'typography',
  defaultShadows: 'shadows',
};

let modifiedCount = 0;
let skippedCount = 0;
let totalFunctions = 0;

for (const filePath of styleFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Check which defaults are used in this file
  const usedDefaults = Object.keys(TOKEN_MAP).filter(
    d => new RegExp(`\\b${d}\\b`).test(content)
  );

  // Also check if any exported function has themeColors param
  const hasThemeColorsParam = /themeColors\s*:\s*ThemeColors/.test(content);

  if (usedDefaults.length === 0 && !hasThemeColorsParam) {
    skippedCount++;
    continue;
  }

  // Parse all exported functions and their boundaries
  const functions = findExportedFunctions(content);

  if (functions.length === 0) {
    skippedCount++;
    continue;
  }

  // Process each function to determine what changes are needed
  const edits = [];
  for (const func of functions) {
    const bodyContent = content.slice(func.bodyStart + 1, func.bodyEnd - 1);
    const paramText = content.slice(func.paramStart, func.paramEnd);

    // Check which default tokens this function body uses
    const neededTokens = usedDefaults.filter(d =>
      new RegExp(`\\b${d}\\b`).test(bodyContent)
    );

    // Check param patterns
    const hasDirectThemeColors = /themeColors\s*:\s*ThemeColors/.test(paramText)
      && !hasTopLevelBrace(paramText);
    const hasOptsThemeColors = /themeColors\s*:\s*ThemeColors/.test(paramText)
      && hasTopLevelBrace(paramText);
    const bodyUsesThemeColors = /\bthemeColors\b/.test(bodyContent);
    const bodyUsesOptsThemeColors = /\bopts\.themeColors\b/.test(bodyContent);

    // Skip if this function doesn't need migration
    const needsMigration = neededTokens.length > 0 || hasDirectThemeColors || hasOptsThemeColors;
    if (!needsMigration) continue;

    edits.push({
      ...func,
      neededTokens,
      paramText,
      hasDirectThemeColors,
      hasOptsThemeColors,
      bodyUsesThemeColors,
      bodyUsesOptsThemeColors,
    });
  }

  if (edits.length === 0) {
    skippedCount++;
    continue;
  }

  // Collect names of migrated functions for internal call-site fixup
  const migratedFuncNames = new Set(edits.map(e => e.funcName));

  // Apply edits in REVERSE order to preserve character positions
  let result = content;
  edits.sort((a, b) => b.funcStart - a.funcStart);

  for (const edit of edits) {
    const shortNames = edit.neededTokens.map(d => TOKEN_MAP[d]);

    // Determine indent from the first line of the function body
    const afterBrace = result.slice(edit.bodyStart + 1);
    const indentMatch = afterBrace.match(/\n(\s+)/);
    const indent = indentMatch ? indentMatch[1] : '  ';

    // Build the destructuring parts
    const destructParts = [];
    if (edit.bodyUsesThemeColors || edit.hasDirectThemeColors || edit.hasOptsThemeColors) {
      destructParts.push('colors: themeColors');
    }
    for (const sn of shortNames) {
      if (!destructParts.includes(sn)) destructParts.push(sn);
    }

    // For opts-style, destructure from `opts.theme`; for direct/new param, from `theme`
    const themeRef = edit.hasOptsThemeColors ? 'opts.theme' : 'theme';
    const destructLine = destructParts.length > 0
      ? `\n${indent}const { ${destructParts.join(', ')} } = ${themeRef};`
      : '';

    // Rename defaultXxx → xxx in the function body only
    let newBody = result.slice(edit.bodyStart + 1, edit.bodyEnd - 1);
    for (const defaultName of edit.neededTokens) {
      const shortName = TOKEN_MAP[defaultName];
      newBody = newBody.replace(new RegExp(`\\b${defaultName}\\b`, 'g'), shortName);
    }

    // Replace opts.themeColors → themeColors in the body (from destructure)
    if (edit.bodyUsesOptsThemeColors) {
      newBody = newBody.replace(/\bopts\.themeColors\b/g, 'themeColors');
    }

    // Update internal calls to other migrated functions:
    // Replace `funcName(..., themeColors)` → `funcName(..., theme)` (or `opts.theme` for opts-style)
    for (const mfName of migratedFuncNames) {
      const callRegex = new RegExp(
        `\\b${mfName}\\(([^)]*?)\\bthemeColors\\b`,
        'g'
      );
      newBody = newBody.replace(callRegex, (match, before) => {
        return `${mfName}(${before}${themeRef}`;
      });
    }

    // Determine new parameter text
    let newParamText = edit.paramText;
    if (edit.hasDirectThemeColors) {
      newParamText = newParamText.replace(
        /themeColors\s*:\s*ThemeColors/,
        'theme: WispTheme'
      );
    } else if (edit.hasOptsThemeColors) {
      newParamText = newParamText.replace(
        /themeColors\s*:\s*ThemeColors/,
        'theme: WispTheme'
      );
    } else {
      // Function only uses default tokens, no themeColors param — add `theme: WispTheme`
      const trimmed = newParamText.trimEnd();
      const isMultiline = newParamText.includes('\n');

      if (isMultiline) {
        const lines = newParamText.split('\n');
        const lastNonEmpty = lines.filter(l => l.trim()).pop() || '';
        const paramIndent = lastNonEmpty.match(/^(\s*)/)?.[1] || '  ';
        const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');
        newParamText = newParamText.replace(/\s*$/, '') +
          (needsComma ? ',' : '') + '\n' + paramIndent + 'theme: WispTheme,\n';
      } else if (trimmed.length === 0) {
        newParamText = 'theme: WispTheme';
      } else {
        const needsComma = !trimmed.endsWith(',');
        newParamText = trimmed + (needsComma ? ', ' : '') + 'theme: WispTheme';
      }
    }

    // Reconstruct the function
    result = result.slice(0, edit.paramStart) +
      newParamText +
      result.slice(edit.paramEnd, edit.bodyStart + 1) +
      destructLine +
      newBody +
      result.slice(edit.bodyEnd - 1);
    totalFunctions++;
  }

  // Now clean up imports:
  // 1. Remove migrated defaults from create-theme import
  const createThemeImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/theme\/create-theme['"]\s*;?\n?/;
  const importMatch = result.match(createThemeImportRegex);
  if (importMatch) {
    const names = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const remaining = names.filter(n => !Object.keys(TOKEN_MAP).includes(n));
    if (remaining.length === 0) {
      result = result.replace(createThemeImportRegex, '');
    } else {
      result = result.replace(
        createThemeImportRegex,
        `import { ${remaining.join(', ')} } from '../theme/create-theme';\n`
      );
    }
  }

  // 2. Ensure WispTheme is imported from theme/types
  const firstExportIdx = result.indexOf('export');
  const importSection = firstExportIdx > 0 ? result.slice(0, firstExportIdx) : result;
  if (!/\bWispTheme\b/.test(importSection)) {
    const themeTypesRegex = /import\s+type\s*\{([^}]+)\}\s*from\s*['"]\.\.\/theme\/types['"]\s*;/;
    const m = result.match(themeTypesRegex);
    if (m) {
      const existingTypes = m[1].split(',').map(s => s.trim());
      if (!existingTypes.includes('WispTheme')) {
        result = result.replace(
          themeTypesRegex,
          `import type { ${[...existingTypes, 'WispTheme'].join(', ')} } from '../theme/types';`
        );
      }
    } else {
      const lines = result.split('\n');
      let lastImportLine = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^import\s/.test(lines[i])) lastImportLine = i;
      }
      if (lastImportLine >= 0) {
        lines.splice(lastImportLine + 1, 0,
          "import type { WispTheme } from '../theme/types';");
        result = lines.join('\n');
      }
    }
  }

  if (result !== content) {
    fs.writeFileSync(filePath, result, 'utf-8');
    modifiedCount++;
    const funcCount = edits.length;
    console.log(`  ✓ ${fileName} (${funcCount} function${funcCount !== 1 ? 's' : ''})`);
  }
}

console.log(`\nDone: ${modifiedCount}/${styleFiles.length} files modified, ${skippedCount} skipped`);
console.log(`Total functions updated: ${totalFunctions}`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasTopLevelBrace(text) {
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === '{' && depth === 0) return true;
  }
  return false;
}

function findExportedFunctions(src) {
  const results = [];
  const regex = /^export function (\w+)\s*\(/gm;
  let match;

  while ((match = regex.exec(src)) !== null) {
    const funcName = match[1];
    const funcStart = match.index;
    const openParenIdx = src.indexOf('(', funcStart + 'export function '.length);

    const paramStart = openParenIdx + 1;
    let depth = 1;
    let i = paramStart;
    while (i < src.length && depth > 0) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
      i++;
    }
    const paramEnd = i - 1;

    const bodyStart = findFunctionBodyBrace(src, i);
    if (bodyStart === -1) continue;

    depth = 1;
    let bodyEnd = bodyStart + 1;
    while (bodyEnd < src.length && depth > 0) {
      if (src[bodyEnd] === '{') depth++;
      else if (src[bodyEnd] === '}') depth--;
      bodyEnd++;
    }

    results.push({ funcName, funcStart, paramStart, paramEnd, bodyStart, bodyEnd });
  }

  return results;
}

function findFunctionBodyBrace(src, startIdx) {
  let i = startIdx;
  let braceDepth = 0;
  let angleDepth = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === '<') {
      angleDepth++;
    } else if (ch === '>') {
      if (angleDepth > 0) angleDepth--;
    } else if (ch === '{') {
      if (angleDepth === 0 && braceDepth === 0) return i;
      braceDepth++;
    } else if (ch === '}') {
      if (braceDepth > 0) braceDepth--;
    } else if (ch === '/' && i + 1 < src.length) {
      if (src[i + 1] === '/') {
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      } else if (src[i + 1] === '*') {
        i += 2;
        while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
    } else if (ch === "'" || ch === '"' || ch === '`') {
      i++;
      while (i < src.length && src[i] !== ch) {
        if (src[i] === '\\') i++;
        i++;
      }
    }

    i++;
  }

  return -1;
}
