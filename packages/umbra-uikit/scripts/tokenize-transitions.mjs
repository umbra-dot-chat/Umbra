/**
 * Tokenize transition duration strings in core style files.
 * Replaces hardcoded ms values with durations.* token references
 * and hardcoded easing strings with easings.* token references.
 *
 * Duration mapping (snap to nearest):
 *   100ms, 120ms → durations.fast (150)
 *   150ms → durations.fast (150, exact)
 *   180ms → durations.fast (150)
 *   200ms → durations.normal (250, snap)
 *   250ms → durations.normal (250, exact)
 *   300ms → durations.slow (400, snap)
 *   400ms → durations.slow (400, exact)
 *   500ms → durations.slow (400)
 *   600ms → durations.slowest (600, exact)
 *   800ms → durations.slowest (600)
 *
 * Easing mapping:
 *   'ease' → easings.easeOut.css
 *   'ease-in-out' → easings.easeInOut.css
 *   'ease-in' → easings.easeIn.css
 *   'ease-out' → easings.easeOut.css
 *   'linear' → easings.linear.css
 *   'cubic-bezier(0.4, 0, 0.2, 1)' → easings.default.css
 *   'cubic-bezier(0, 0, 0.2, 1)' → easings.easeOut.css
 *   'cubic-bezier(0.4, 0, 1, 1)' → easings.easeIn.css
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Duration snap map
const durationMap = {
  '50': 'durations.instant',
  '100': 'durations.fast',
  '120': 'durations.fast',
  '150': 'durations.fast',
  '180': 'durations.fast',
  '200': 'durations.normal',
  '250': 'durations.normal',
  '300': 'durations.slow',
  '400': 'durations.slow',
  '500': 'durations.slow',
  '600': 'durations.slowest',
  '800': 'durations.slowest',
};

// Easing map
const easingMap = {
  'ease': 'easings.easeOut.css',
  'ease-out': 'easings.easeOut.css',
  'ease-in': 'easings.easeIn.css',
  'ease-in-out': 'easings.easeInOut.css',
  'linear': 'easings.linear.css',
  'cubic-bezier(0.4, 0, 0.2, 1)': 'easings.default.css',
  'cubic-bezier(0, 0, 0.2, 1)': 'easings.easeOut.css',
  'cubic-bezier(0.4, 0, 1, 1)': 'easings.easeIn.css',
  'cubic-bezier(0.4, 0, 0.2, 1)': 'easings.easeInOut.css',
  'cubic-bezier(0.34, 1.56, 0.64, 1)': 'cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce — keep as-is
};

const MOTION_IMPORT = `import { durations, easings } from '../tokens/motion';`;

function tokenizeTransitionString(transStr) {
  // Parse a transition value string like:
  //   'background-color 150ms ease, color 150ms ease'
  // into template literal:
  //   `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`

  // Split by comma into individual transitions
  const parts = transStr.split(',').map(s => s.trim());
  let needsTokens = false;
  const newParts = [];

  for (const part of parts) {
    // Match pattern: <property> <duration>ms <easing>
    // or: all <duration>ms <easing>
    const match = part.match(/^([\w-]+)\s+(\d+)ms\s+(.+)$/);
    if (match) {
      const [, prop, ms, easing] = match;
      const durToken = durationMap[ms];
      const easingToken = easingMap[easing.trim()];

      if (durToken) {
        needsTokens = true;
        const easingPart = easingToken && easingToken !== easing.trim()
          ? `\${${easingToken}}`
          : easing.trim();
        const durPart = `\${${durToken}}`;
        newParts.push(`${prop} ${durPart}ms ${easingPart}`);
      } else {
        newParts.push(part);
      }
    } else {
      // Try simpler pattern: <property> <duration>ms (no easing)
      const simpleMatch = part.match(/^([\w-]+)\s+(\d+)ms$/);
      if (simpleMatch) {
        const [, prop, ms] = simpleMatch;
        const durToken = durationMap[ms];
        if (durToken) {
          needsTokens = true;
          newParts.push(`${prop} \${${durToken}}ms`);
        } else {
          newParts.push(part);
        }
      } else {
        // Complex or unrecognized — keep as-is
        newParts.push(part);
      }
    }
  }

  if (!needsTokens) return null;
  return '`' + newParts.join(', ') + '`';
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let needsImport = false;

  // Match transition: 'string' or transition: "string"
  const transRegex = /transition:\s*(['"])((?:(?!\1).)+)\1/g;
  let match;

  // Collect all replacements
  const replacements = [];
  while ((match = transRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const quote = match[1];
    const transValue = match[2];

    const tokenized = tokenizeTransitionString(transValue);
    if (tokenized) {
      replacements.push({ from: fullMatch, to: `transition: ${tokenized}` });
      needsImport = true;
    }
  }

  // Apply replacements
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }

  // Add import if needed
  if (needsImport && !content.includes("from '../tokens/motion'") && !content.includes("from '../tokens/motion';")) {
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, endOfLine + 1) + MOTION_IMPORT + '\n' + content.slice(endOfLine + 1);
    } else {
      content = MOTION_IMPORT + '\n' + content;
    }
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
let modified = 0;
for (const f of coreStyleFiles) {
  if (processFile(f)) {
    modified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`\nCore styles: ${modified}/${coreStyleFiles.length} files modified`);
console.log('\nDone!');
