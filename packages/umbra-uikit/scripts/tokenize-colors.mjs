/**
 * Tokenize hardcoded color values in core style files.
 *
 * Handles these categories:
 * 1. Shadow strings → defaultShadows tokens
 * 2. Simple hex → themeColors mappings (only where context is unambiguous)
 * 3. Status colors → themeColors.status.*
 *
 * Does NOT handle:
 * - Context-dependent colors (Button onSurface, Toggle luminance detection)
 * - Brand colors (SocialButton)
 * - Achievement rarity colors
 * - rgba overlay values (theme-independent opacity)
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SHADOWS_IMPORT = `import { defaultShadows } from '../theme/create-theme';`;

// ── Shadow replacements (exact string matches) ──
const shadowReplacements = [
  {
    from: `'0 1px 2px 0 rgba(0, 0, 0, 0.05)'`,
    to: `defaultShadows.sm`,
  },
  {
    from: `'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'`,
    to: `defaultShadows.md`,
  },
  {
    from: `'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'`,
    to: `defaultShadows.lg`,
  },
  {
    from: `'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'`,
    to: `defaultShadows.xl`,
  },
];

function addShadowsImport(content) {
  if (content.includes('defaultShadows')) return content;

  // Try to merge into existing create-theme import
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*'\.\.\/theme\/create-theme'/;
  const match = content.match(importRegex);
  if (match) {
    const existing = match[1].trim();
    return content.replace(match[0], match[0].replace(match[1], ' ' + existing + ', defaultShadows '));
  }

  // Add new import after last import
  const lastImportIdx = content.lastIndexOf('\nimport ');
  if (lastImportIdx !== -1) {
    const endOfLine = content.indexOf('\n', lastImportIdx + 1);
    return content.slice(0, endOfLine + 1) + SHADOWS_IMPORT + '\n' + content.slice(endOfLine + 1);
  }
  return SHADOWS_IMPORT + '\n' + content;
}

function processShadows(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let needsImport = false;

  for (const { from, to } of shadowReplacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      needsImport = true;
    }
  }

  if (needsImport) {
    content = addShadowsImport(content);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ── Process shadow replacements across all core style files ──
console.log('=== Shadow Token Replacements ===');
const coreStyleFiles = glob.sync('packages/core/src/styles/*.styles.ts');
let shadowModified = 0;
for (const f of coreStyleFiles) {
  if (processShadows(f)) {
    shadowModified++;
    console.log(`  ✓ ${path.basename(f)}`);
  }
}
console.log(`Shadow replacements: ${shadowModified} files modified\n`);

// ── Per-file color fixes ──
// These are manual replacements specific to each component's resolveColors function.
// They only replace colors that already flow through themeColors parameter.

console.log('=== Per-file Color Fixes ===');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

const stylesDir = 'packages/core/src/styles';
let colorFixed = 0;

// Avatar.styles.ts — Status colors
colorFixed += replaceInFile(path.join(stylesDir, 'Avatar.styles.ts'), [
  [`online: '#22C55E'`, `online: themeColors.status.successFg`],
  [`busy: '#EF4444'`, `busy: themeColors.status.dangerFg`],
  [`away: '#F59E0B'`, `away: themeColors.status.warningFg`],
]) ? 1 : 0;

// PingMeter.styles.ts — Latency colors
colorFixed += replaceInFile(path.join(stylesDir, 'PingMeter.styles.ts'), [
  [`'#22c55e'`, `themeColors.status.successFg`],
  [`'#eab308'`, `themeColors.status.warningFg`],
  [`'#f97316'`, `themeColors.status.warningFg`],
  [`'#ef4444'`, `themeColors.status.dangerFg`],
]) ? 1 : 0;

// ChatBubble.styles.ts — Outgoing/incoming bubble colors
colorFixed += replaceInFile(path.join(stylesDir, 'ChatBubble.styles.ts'), [
  // Outgoing: white bg, dark text, muted timestamp, subtle border
  [`bg: '#FFFFFF'`, `bg: themeColors.accent.primary`],
  [`text: '#0C0C0E'`, `text: themeColors.text.primary`],
  [`timestamp: '#6E6E77'`, `timestamp: themeColors.text.secondary`],
  [`border: '#E4E4E7'`, `border: themeColors.border.subtle`],
  // Incoming: dark bg, light text, muted timestamp, dark border
  [`bg: '#0C0C0E'`, `bg: themeColors.background.raised`],
  [`text: '#FFFFFF'`, `text: themeColors.text.onRaised`],
  [`timestamp: '#A0A0A0'`, `timestamp: themeColors.text.onRaisedSecondary`],
  [`border: '#2A2A2A'`, `border: themeColors.accent.dividerRaised`],
]) ? 1 : 0;

// TypingIndicator.styles.ts — Bubble colors (same pattern as ChatBubble)
colorFixed += replaceInFile(path.join(stylesDir, 'TypingIndicator.styles.ts'), [
  [`backgroundColor: '#FFFFFF'`, `backgroundColor: themeColors.accent.primary`],
  [`backgroundColor: '#0C0C0E'`, `backgroundColor: themeColors.background.raised`],
  [`border: '1px solid #E4E4E7'`, `border: \`1px solid \${themeColors.border.subtle}\``],
  [`border: '1px solid #2A2A2A'`, `border: \`1px solid \${themeColors.accent.dividerRaised}\``],
]) ? 1 : 0;

// NotificationBadge.styles.ts — Badge text colors
colorFixed += replaceInFile(path.join(stylesDir, 'NotificationBadge.styles.ts'), [
  // White text on colored backgrounds — these all use themeColors already for bg
  [`text: '#FFFFFF'`, `text: themeColors.text.inverse`],
  [`text: '#000000'`, `text: themeColors.text.primary`],
]) ? 1 : 0;

// Toggle.styles.ts — Contrast detection colors
colorFixed += replaceInFile(path.join(stylesDir, 'Toggle.styles.ts'), [
  [`'#0A0E15'`, `themeColors.text.primary`],
  [`'#F7F8FA'`, `themeColors.text.inverse`],
  [`'#BFC6D4'`, `themeColors.border.strong`],
  [`'#2E3642'`, `themeColors.border.strong`],
  [`'#202531'`, `themeColors.border.strong`],
]) ? 1 : 0;

// Checkbox.styles.ts — Contrast detection
colorFixed += replaceInFile(path.join(stylesDir, 'Checkbox.styles.ts'), [
  [`'#0A0E15'`, `themeColors.text.primary`],
  [`'#F7F8FA'`, `themeColors.text.inverse`],
]) ? 1 : 0;

// Tag.styles.ts — Contrast detection on accent
colorFixed += replaceInFile(path.join(stylesDir, 'Tag.styles.ts'), [
  [`'#0A0E15'`, `themeColors.text.primary`],
  [`'#F7F8FA'`, `themeColors.text.inverse`],
]) ? 1 : 0;

// Carousel.styles.ts — Dot indicators
colorFixed += replaceInFile(path.join(stylesDir, 'Carousel.styles.ts'), [
  [`'#FFFFFF'`, `themeColors.text.inverse`],
  [`'rgba(255, 255, 255, 0.5)'`, `themeColors.text.muted`],
]) ? 1 : 0;

// MediaPlayer.styles.ts — Video background
colorFixed += replaceInFile(path.join(stylesDir, 'MediaPlayer.styles.ts'), [
  [`'#000'`, `themeColors.background.canvas`],
]) ? 1 : 0;

// AchievementUnlock.styles.ts — Overlay background
colorFixed += replaceInFile(path.join(stylesDir, 'AchievementUnlock.styles.ts'), [
  [`'rgba(0,0,0,0.4)'`, `themeColors.background.overlay`],
  [`'#FFFFFF'`, `themeColors.text.inverse`],
]) ? 1 : 0;

// Button.styles.ts — onSurface variant colors
colorFixed += replaceInFile(path.join(stylesDir, 'Button.styles.ts'), [
  // onSurface primary: white bg on dark raised surface
  [`bg: '#FFFFFF'`, `bg: themeColors.text.inverse`],
  [`bgHover: '#E8E8EC'`, `bgHover: themeColors.accent.primaryHover`],
  [`bgActive: '#D0D0D8'`, `bgActive: themeColors.accent.primaryActive`],
  [`text: '#09090B'`, `text: themeColors.text.primary`],
  // onSurface secondary border
  [`border: 'rgba(255, 255, 255, 0.4)'`, `border: themeColors.accent.dividerRaised`],
  [`borderHover: 'rgba(255, 255, 255, 0.7)'`, `borderHover: themeColors.accent.highlightRaised`],
  // Warning text (needs dark text for contrast on bright amber bg)
  [`text: '#0F1219'`, `text: themeColors.text.primary`],
]) ? 1 : 0;

console.log(`\nColor fixes: ${colorFixed} files modified`);
console.log(`Total: ${shadowModified + colorFixed} files modified`);
