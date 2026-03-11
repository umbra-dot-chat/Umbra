#!/usr/bin/env node
/**
 * generate-test-stats.mjs
 *
 * Runs the @wisp-ui/react test suite with Vitest JSON reporter,
 * parses the output, and writes a summary JSON file that the
 * DocsPage can import at build time.
 *
 * Usage:  node website/scripts/generate-test-stats.mjs
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'src', 'generated');
const outFile = resolve(outDir, 'test-stats.json');

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

try {
  console.log('Running test suite…');

  // Run vitest with JSON reporter, capture stdout
  // Use the packages/react directory since that's where tests live
  const reactPkg = resolve(__dirname, '..', '..', 'packages', 'react');
  const raw = execSync('npx vitest run --reporter=json 2>/dev/null', {
    cwd: reactPkg,
    encoding: 'utf-8',
    timeout: 120_000,
  });

  // Parse JSON — vitest may print warnings before JSON, find the first `{`
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) throw new Error('No JSON output from vitest');
  const json = JSON.parse(raw.slice(jsonStart));

  // Count unique test files (not individual test results within each file)
  const testFiles = json.testResults?.length ?? 0;

  // Calculate duration
  const startTime = json.startTime ?? 0;
  const endTimes = (json.testResults ?? []).map(
    (r) => r.startTime + (r.duration ?? r.endTime - r.startTime),
  );
  const maxEnd = endTimes.length > 0 ? Math.max(...endTimes) : startTime;
  const durationMs = maxEnd - startTime;
  const durationSec = Math.round(durationMs / 1000);

  // Count how many test files we have in the type/style/component dirs
  const allResults = json.testResults ?? [];
  const countFilesMatching = (pattern) =>
    allResults.filter((r) => r.name?.includes(pattern)).length;

  const stats = {
    totalFiles: testFiles,
    totalTests: json.numTotalTests ?? 0,
    passed: json.numPassedTests ?? 0,
    failed: json.numFailedTests ?? 0,
    pending: json.numPendingTests ?? 0,
    duration: `${durationSec}s`,
    success: json.success ?? false,
    timestamp: new Date().toISOString(),
    coverage: {
      components: countFilesMatching('/components/'),
      primitives: countFilesMatching('/primitives/'),
      layouts: countFilesMatching('/layouts/'),
    },
  };

  writeFileSync(outFile, JSON.stringify(stats, null, 2) + '\n');
  console.log(`✓ Test stats written to ${outFile}`);
  console.log(`  ${stats.totalTests} tests (${stats.passed} passed, ${stats.failed} failed) across ${stats.totalFiles} files in ${stats.duration}`);
} catch (err) {
  console.error('Failed to generate test stats:', err.message);

  // Write a fallback file so the build doesn't break
  const fallback = {
    totalFiles: 0,
    totalTests: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    duration: '—',
    success: false,
    timestamp: new Date().toISOString(),
    coverage: { components: 0, primitives: 0, layouts: 0 },
  };
  writeFileSync(outFile, JSON.stringify(fallback, null, 2) + '\n');
  console.log(`⚠ Wrote fallback stats to ${outFile}`);
  process.exit(0); // Don't fail the build
}
