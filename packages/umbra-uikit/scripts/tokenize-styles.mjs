/**
 * Script to replace hardcoded spacing, radii, and typography values
 * in core style builder files with theme token references.
 *
 * Run: node scripts/tokenize-styles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Token maps
// ---------------------------------------------------------------------------
const spacingMap = {
  0: 'defaultSpacing.none',
  2: "defaultSpacing['2xs']",
  4: 'defaultSpacing.xs',
  8: 'defaultSpacing.sm',
  12: 'defaultSpacing.md',
  16: 'defaultSpacing.lg',
  24: 'defaultSpacing.xl',
  32: "defaultSpacing['2xl']",
  48: "defaultSpacing['3xl']",
  64: "defaultSpacing['4xl']",
};

// Snap irregular values to nearest token
const spacingSnap = {
  1: "defaultSpacing['2xs']",
  2: "defaultSpacing['2xs']",
  3: 'defaultSpacing.xs',
  4: 'defaultSpacing.xs',
  5: 'defaultSpacing.sm',
  6: 'defaultSpacing.sm',
  8: 'defaultSpacing.sm',
  10: 'defaultSpacing.sm',
  12: 'defaultSpacing.md',
  14: 'defaultSpacing.lg',
  16: 'defaultSpacing.lg',
  20: 'defaultSpacing.xl',
  24: 'defaultSpacing.xl',
  28: "defaultSpacing['2xl']",
  32: "defaultSpacing['2xl']",
  36: "defaultSpacing['3xl']",
  48: "defaultSpacing['3xl']",
  64: "defaultSpacing['4xl']",
};

// For padding specifically, 10 snaps to md (12), not sm (8)
const paddingSnap = { ...spacingSnap, 10: 'defaultSpacing.md', 14: 'defaultSpacing.lg', 20: 'defaultSpacing.xl' };

const radiiMap = {
  0: 'defaultRadii.none',
  4: 'defaultRadii.sm',
  8: 'defaultRadii.md',
  12: 'defaultRadii.lg',
  16: 'defaultRadii.xl',
  9999: 'defaultRadii.full',
};

const radiiSnap = {
  1: 'defaultRadii.sm',
  2: 'defaultRadii.sm',
  3: 'defaultRadii.sm',
  4: 'defaultRadii.sm',
  5: 'defaultRadii.sm',
  6: 'defaultRadii.md',
  8: 'defaultRadii.md',
  10: 'defaultRadii.lg',
  12: 'defaultRadii.lg',
  14: 'defaultRadii.xl',
  16: 'defaultRadii.xl',
  20: 'defaultRadii.xl',
  24: 'defaultRadii.xl',
  32: 'defaultRadii.xl',
  9999: 'defaultRadii.full',
};

const weightMap = {
  400: 'defaultTypography.weights.regular',
  500: 'defaultTypography.weights.medium',
  600: 'defaultTypography.weights.semibold',
  700: 'defaultTypography.weights.bold',
};

// Spacing-related CSS properties (used for padding, margin, gap)
const spacingProps = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingBlock', 'paddingInline',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginBlock', 'marginInline',
  'gap', 'rowGap', 'columnGap',
  'top', 'right', 'bottom', 'left',
  'paddingVertical', 'paddingHorizontal',
  'marginVertical', 'marginHorizontal',
]);

const paddingProps = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingBlock', 'paddingInline', 'paddingVertical', 'paddingHorizontal',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpacingToken(value, isPadding) {
  const num = Number(value);
  if (isNaN(num) || num === 0) return null; // Leave 0 as-is
  const map = isPadding ? paddingSnap : spacingSnap;
  // Find exact or nearest
  if (map[num]) return map[num];
  // Find closest key
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - num) < Math.abs(closest - num)) closest = k;
  }
  return map[closest] || null;
}

function getRadiiToken(value) {
  const num = Number(value);
  if (isNaN(num)) return null;
  if (num === 0) return null; // Leave 0 as-is
  if (radiiSnap[num]) return radiiSnap[num];
  const keys = Object.keys(radiiSnap).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - num) < Math.abs(closest - num)) closest = k;
  }
  return radiiSnap[closest] || null;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  let needsSpacing = false;
  let needsRadii = false;
  let needsTypography = false;

  // 1. Replace simple numeric property values: `propertyName: NUMBER`
  // Pattern: (propertyName): (number),  or  (propertyName): (number)}
  content = content.replace(
    /(\b(?:padding|paddingTop|paddingRight|paddingBottom|paddingLeft|paddingBlock|paddingInline|paddingVertical|paddingHorizontal|margin|marginTop|marginRight|marginBottom|marginLeft|marginBlock|marginInline|marginVertical|marginHorizontal|gap|rowGap|columnGap))(\s*:\s*)(\d+)(\s*[,}\n])/g,
    (match, prop, sep, val, after) => {
      const num = Number(val);
      if (num === 0) return match; // Leave 0 as-is
      const isPadding = paddingProps.has(prop);
      const token = getSpacingToken(num, isPadding);
      if (token) {
        needsSpacing = true;
        return `${prop}${sep}${token}${after}`;
      }
      return match;
    }
  );

  // 2. Replace borderRadius numeric values
  content = content.replace(
    /(\bborderRadius)(\s*:\s*)(\d+)(\s*[,}\n])/g,
    (match, prop, sep, val, after) => {
      const num = Number(val);
      if (num === 0) return match;
      const token = getRadiiToken(num);
      if (token) {
        needsRadii = true;
        return `${prop}${sep}${token}${after}`;
      }
      return match;
    }
  );

  // 3. Replace borderRadius: '50%' with defaultRadii.full
  content = content.replace(
    /(\bborderRadius)(\s*:\s*)'50%'/g,
    (match, prop, sep) => {
      needsRadii = true;
      return `${prop}${sep}defaultRadii.full`;
    }
  );

  // 4. Replace fontWeight numeric values
  content = content.replace(
    /(\bfontWeight)(\s*:\s*)(\d+)(\s*[,}\n])/g,
    (match, prop, sep, val, after) => {
      const token = weightMap[Number(val)];
      if (token) {
        needsTypography = true;
        return `${prop}${sep}${token}${after}`;
      }
      return match;
    }
  );

  // 5. Replace string fontWeight values like '500', '600' etc
  content = content.replace(
    /(\bfontWeight)(\s*:\s*)'(\d+)'/g,
    (match, prop, sep, val) => {
      const token = weightMap[Number(val)];
      if (token) {
        needsTypography = true;
        return `${prop}${sep}${token}`;
      }
      return match;
    }
  );

  // 6. Replace string padding/margin values like '12px 16px'
  content = content.replace(
    /(\b(?:padding|margin))(\s*:\s*)'(\d+)px\s+(\d+)px'/g,
    (match, prop, sep, v1, v2) => {
      const isPadding = prop === 'padding';
      const t1 = getSpacingToken(Number(v1), isPadding);
      const t2 = getSpacingToken(Number(v2), isPadding);
      if (t1 && t2) {
        needsSpacing = true;
        return `${prop}${sep}\`\${${t1}}px \${${t2}}px\``;
      }
      return match;
    }
  );

  // 7. Replace string padding/margin values like '8px 12px 4px'
  content = content.replace(
    /(\b(?:padding|margin))(\s*:\s*)'(\d+)px\s+(\d+)px\s+(\d+)px'/g,
    (match, prop, sep, v1, v2, v3) => {
      const isPadding = prop === 'padding';
      const t1 = getSpacingToken(Number(v1), isPadding);
      const t2 = getSpacingToken(Number(v2), isPadding);
      const t3 = getSpacingToken(Number(v3), isPadding);
      if (t1 && t2 && t3) {
        needsSpacing = true;
        return `${prop}${sep}\`\${${t1}}px \${${t2}}px \${${t3}}px\``;
      }
      return match;
    }
  );

  // 8. Replace '24px 24px 16px 24px' style values
  content = content.replace(
    /(\b(?:padding|margin))(\s*:\s*)'(\d+)px\s+(\d+)px\s+(\d+)px\s+(\d+)px'/g,
    (match, prop, sep, v1, v2, v3, v4) => {
      const isPadding = prop === 'padding';
      const t1 = getSpacingToken(Number(v1), isPadding);
      const t2 = getSpacingToken(Number(v2), isPadding);
      const t3 = getSpacingToken(Number(v3), isPadding);
      const t4 = getSpacingToken(Number(v4), isPadding);
      if (t1 && t2 && t3 && t4) {
        needsSpacing = true;
        return `${prop}${sep}\`\${${t1}}px \${${t2}}px \${${t3}}px \${${t4}}px\``;
      }
      return match;
    }
  );

  // 9. Replace string margin values like '4px 0' or '2px 8px'
  content = content.replace(
    /(\b(?:padding|margin))(\s*:\s*)'(\d+)px\s+(\d+)'/g,
    (match, prop, sep, v1, v2) => {
      const isPadding = prop === 'padding';
      const n1 = Number(v1);
      const n2 = Number(v2);
      const t1 = n1 === 0 ? '0' : getSpacingToken(n1, isPadding);
      const t2 = n2 === 0 ? '0' : getSpacingToken(n2, isPadding);
      if (t1 && t2) {
        needsSpacing = true;
        if (t1 === '0' && t2 === '0') return match; // both 0, skip
        if (t1 === '0') return `${prop}${sep}\`0 \${${t2}}px\``;
        if (t2 === '0') return `${prop}${sep}\`\${${t1}}px 0\``;
        return `${prop}${sep}\`\${${t1}}px \${${t2}}px\``;
      }
      return match;
    }
  );

  // 10. Replace `'4px 0'` style margin strings with number before px
  content = content.replace(
    /(\bmargin\w*)(\s*:\s*)'(\d+)px 0'/g,
    (match, prop, sep, v1) => {
      const n1 = Number(v1);
      if (n1 === 0) return match;
      const t1 = getSpacingToken(n1, false);
      if (t1) {
        needsSpacing = true;
        return `${prop}${sep}\`\${${t1}}px 0\``;
      }
      return match;
    }
  );

  // Now add imports if needed
  if (content !== original) {
    const imports = [];
    const tokensNeeded = [];

    if (needsSpacing) tokensNeeded.push('defaultSpacing');
    if (needsRadii) tokensNeeded.push('defaultRadii');
    if (needsTypography) tokensNeeded.push('defaultTypography');

    if (tokensNeeded.length > 0) {
      const importLine = `import { ${tokensNeeded.join(', ')} } from '../theme/create-theme';`;

      // Check if import already exists
      if (!content.includes("from '../theme/create-theme'")) {
        // Find last import line and add after it
        const importRegex = /^import\s+.+;$/gm;
        let lastImportEnd = 0;
        let m;
        while ((m = importRegex.exec(content)) !== null) {
          lastImportEnd = m.index + m[0].length;
        }
        if (lastImportEnd > 0) {
          content = content.slice(0, lastImportEnd) + '\n' + importLine + content.slice(lastImportEnd);
        }
      } else {
        // Update existing import to include needed tokens
        content = content.replace(
          /import\s*\{([^}]+)\}\s*from\s*'\.\.\/theme\/create-theme';/,
          (match, existing) => {
            const existingTokens = existing.split(',').map(t => t.trim()).filter(Boolean);
            const allTokens = [...new Set([...existingTokens, ...tokensNeeded])];
            return `import { ${allTokens.join(', ')} } from '../theme/create-theme';`;
          }
        );
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const stylesDir = path.join(ROOT, 'packages/core/src/styles');
const files = fs.readdirSync(stylesDir)
  .filter(f => f.endsWith('.styles.ts'))
  .map(f => path.join(stylesDir, f));

let modified = 0;
for (const file of files) {
  if (processFile(file)) {
    modified++;
    console.log(`✓ ${path.basename(file)}`);
  }
}

console.log(`\nDone: ${modified}/${files.length} files modified`);
