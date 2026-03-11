/**
 * Fix missing defaultTypography and defaultSpacing imports.
 * For files that use these tokens but don't import them,
 * either merge into existing create-theme import or add new one.
 */

import fs from 'fs';
import { glob } from 'glob';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const needsTypography = content.includes('defaultTypography') && !content.match(/import\s+[^;]*defaultTypography[^;]*from/);
  const needsSpacing = content.includes('defaultSpacing') && !content.match(/import\s+[^;]*defaultSpacing[^;]*from/);
  const needsShadows = content.includes('defaultShadows') && !content.match(/import\s+[^;]*defaultShadows[^;]*from/);

  if (!needsTypography && !needsSpacing && !needsShadows) return false;

  // Determine correct import source based on file path
  const isCore = filePath.includes('packages/core/');
  const importSource = isCore ? `'../theme/create-theme'` : `'@wisp-ui/core/theme/create-theme'`;

  // Check if there's already a create-theme import we can merge into
  const importRegex = new RegExp(`(import\\s*\\{)([^}]+)(\\}\\s*from\\s*${importSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 's');
  const match = content.match(importRegex);

  if (match) {
    // Merge into existing import
    let existingNames = match[2].trim();
    const toAdd = [];
    if (needsTypography) toAdd.push('defaultTypography');
    if (needsSpacing) toAdd.push('defaultSpacing');
    if (needsShadows) toAdd.push('defaultShadows');

    if (toAdd.length > 0) {
      // Check if it's multiline
      if (existingNames.includes('\n')) {
        existingNames = existingNames.trimEnd() + ',\n  ' + toAdd.join(', ') + '\n';
      } else {
        existingNames = ' ' + existingNames.trim() + ', ' + toAdd.join(', ') + ' ';
      }
      content = content.replace(match[0], match[1] + existingNames + match[3]);
    }
  } else {
    // No existing create-theme import — add a new one
    const toImport = [];
    if (needsTypography) toImport.push('defaultTypography');
    if (needsSpacing) toImport.push('defaultSpacing');
    if (needsShadows) toImport.push('defaultShadows');

    const newImport = `import { ${toImport.join(', ')} } from ${importSource};`;

    // Add after last import
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, endOfLine + 1) + newImport + '\n' + content.slice(endOfLine + 1);
    } else {
      content = newImport + '\n' + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Process all files that might need fixes
const patterns = [
  'packages/core/src/styles/*.styles.ts',
  'packages/core/src/types/*.types.ts',
  'packages/react-native/src/**/*.tsx',
  'packages/react/src/**/*.tsx',
];

let fixed = 0;
for (const pattern of patterns) {
  const files = glob.sync(pattern, { ignore: ['**/*.test.*', '**/*.stories.*'] });
  for (const f of files) {
    if (fixFile(f)) {
      fixed++;
      console.log(`  ✓ ${f}`);
    }
  }
}

console.log(`\nFixed ${fixed} files`);
