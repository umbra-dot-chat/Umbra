/**
 * Script to replace hardcoded spacing, radii, and typography values
 * in React DOM component files with theme token references.
 *
 * Run: node scripts/tokenize-react.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const spacingSnap = {
  1: "defaultSpacing['2xs']", 2: "defaultSpacing['2xs']",
  3: 'defaultSpacing.xs', 4: 'defaultSpacing.xs',
  5: 'defaultSpacing.sm', 6: 'defaultSpacing.sm',
  8: 'defaultSpacing.sm', 10: 'defaultSpacing.md',
  12: 'defaultSpacing.md', 14: 'defaultSpacing.lg',
  16: 'defaultSpacing.lg', 20: 'defaultSpacing.xl',
  24: 'defaultSpacing.xl', 28: "defaultSpacing['2xl']",
  32: "defaultSpacing['2xl']", 48: "defaultSpacing['3xl']",
  64: "defaultSpacing['4xl']",
};

const radiiSnap = {
  1: 'defaultRadii.sm', 2: 'defaultRadii.sm',
  3: 'defaultRadii.sm', 4: 'defaultRadii.sm',
  5: 'defaultRadii.sm', 6: 'defaultRadii.md',
  8: 'defaultRadii.md', 10: 'defaultRadii.lg',
  12: 'defaultRadii.lg', 14: 'defaultRadii.xl',
  16: 'defaultRadii.xl', 20: 'defaultRadii.xl',
  24: 'defaultRadii.xl', 32: 'defaultRadii.xl',
  9999: 'defaultRadii.full',
};

const weightMap = {
  400: 'defaultTypography.weights.regular',
  500: 'defaultTypography.weights.medium',
  600: 'defaultTypography.weights.semibold',
  700: 'defaultTypography.weights.bold',
};

function getSpacingToken(num) {
  if (num === 0) return null;
  if (spacingSnap[num]) return spacingSnap[num];
  const keys = Object.keys(spacingSnap).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - num) < Math.abs(closest - num)) closest = k;
  }
  return spacingSnap[closest] || null;
}

function getRadiiToken(num) {
  if (num === 0) return null;
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

  // Spacing props
  content = content.replace(
    /(\b(?:padding|paddingTop|paddingRight|paddingBottom|paddingLeft|margin|marginTop|marginRight|marginBottom|marginLeft|gap|rowGap|columnGap))(\s*:\s*)(\d+)(\s*[,}\n])/g,
    (match, prop, sep, val, after) => {
      const num = Number(val);
      if (num === 0) return match;
      const token = getSpacingToken(num);
      if (token) {
        needsSpacing = true;
        return `${prop}${sep}${token}${after}`;
      }
      return match;
    }
  );

  // borderRadius
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

  // fontWeight
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

  if (content !== original) {
    const tokensNeeded = [];
    if (needsSpacing) tokensNeeded.push('defaultSpacing');
    if (needsRadii) tokensNeeded.push('defaultRadii');
    if (needsTypography) tokensNeeded.push('defaultTypography');

    if (tokensNeeded.length > 0) {
      const importLine = `import { ${tokensNeeded.join(', ')} } from '@wisp-ui/core/theme/create-theme';`;

      if (!content.includes("from '@wisp-ui/core/theme/create-theme'")) {
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
        content = content.replace(
          /import\s*\{([^}]+)\}\s*from\s*'@wisp-ui\/core\/theme\/create-theme';/,
          (match, existing) => {
            const existingTokens = existing.split(',').map(t => t.trim()).filter(Boolean);
            const allTokens = [...new Set([...existingTokens, ...tokensNeeded])];
            return `import { ${allTokens.join(', ')} } from '@wisp-ui/core/theme/create-theme';`;
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

// Walk React src directory
function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (
      entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.stories.tsx')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const reactDir = path.join(ROOT, 'packages/react/src');
const files = walkDir(reactDir);

let modified = 0;
for (const file of files) {
  if (processFile(file)) {
    modified++;
    console.log(`✓ ${path.relative(ROOT, file)}`);
  }
}
console.log(`\nReact DOM: ${modified}/${files.length} files modified`);
