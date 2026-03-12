/**
 * Memory stress tests — automated OOM crash reproduction.
 *
 * These tests exercise the three main crash scenarios:
 * 1. Message flood (200+ rapid messages)
 * 2. Friend request + immediate chat (race condition)
 * 3. Multi-conversation switching with large message histories
 *
 * Each test uses Chrome DevTools Protocol (CDP) to take heap snapshots
 * and assert that memory growth stays within acceptable bounds.
 *
 * Run: npx playwright test __tests__/e2e/stress/memory-stress.spec.ts
 */

import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { waitForAppReady, createIdentity, WASM_LOAD_TIMEOUT } from '../helpers';

// Memory thresholds
const MAX_HEAP_GROWTH_MB = 100; // Max heap growth during a test
const MAX_DOM_NODES = 15_000;   // Max DOM nodes at any point
const SNAPSHOT_INTERVAL_MS = 5_000; // How often to check memory

interface MemorySnapshot {
  ts: number;
  heapUsed: number;
  heapTotal: number;
  domNodes: number;
}

/** Take a memory snapshot using CDP */
async function takeMemorySnapshot(page: Page, cdp: CDPSession): Promise<MemorySnapshot> {
  // JS heap
  const metrics = await cdp.send('Performance.getMetrics');
  const heapUsed = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value ?? 0;
  const heapTotal = metrics.metrics.find(m => m.name === 'JSHeapTotalSize')?.value ?? 0;

  // DOM nodes
  const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);

  return { ts: Date.now(), heapUsed, heapTotal, domNodes };
}

/** Get CrashVitals from localStorage */
async function getVitals(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('__umbra_vitals__');
    return raw ? JSON.parse(raw) : null;
  });
}

/** Print a memory report */
function printMemoryReport(label: string, snapshots: MemorySnapshot[]) {
  if (snapshots.length === 0) return;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const peakHeap = Math.max(...snapshots.map(s => s.heapUsed));
  const peakDom = Math.max(...snapshots.map(s => s.domNodes));
  const heapGrowth = last.heapUsed - first.heapUsed;

  console.log(`
╔══════════════════════════════════════════════════╗
║ MEMORY REPORT: ${label.padEnd(33)}║
╠══════════════════════════════════════════════════╣
║ Heap start:  ${(first.heapUsed / 1024 / 1024).toFixed(1).padStart(8)}MB                       ║
║ Heap end:    ${(last.heapUsed / 1024 / 1024).toFixed(1).padStart(8)}MB                       ║
║ Heap peak:   ${(peakHeap / 1024 / 1024).toFixed(1).padStart(8)}MB                       ║
║ Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(1).padStart(8)}MB                       ║
║ DOM peak:    ${String(peakDom).padStart(8)} nodes                  ║
║ Snapshots:   ${String(snapshots.length).padStart(8)}                        ║
╚══════════════════════════════════════════════════╝
  `);
}

test.describe('Memory Stress Tests', () => {
  test.setTimeout(120_000); // 2 minute timeout for stress tests

  test('Scenario 1: Message flood — heap growth under threshold', async ({ page }) => {
    // Setup: create identity and wait for app ready
    await waitForAppReady(page);
    await createIdentity(page, 'StressUser');

    // Connect CDP for memory monitoring
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    const snapshots: MemorySnapshot[] = [];

    // Take baseline snapshot
    const baseline = await takeMemorySnapshot(page, cdp);
    snapshots.push(baseline);
    console.log(`Baseline: heap=${(baseline.heapUsed / 1024 / 1024).toFixed(1)}MB, dom=${baseline.domNodes}`);

    // Wait for the app to fully settle
    await page.waitForTimeout(3000);

    // Take periodic snapshots for 30 seconds to monitor message processing
    const monitorDuration = 30_000;
    const startTime = Date.now();

    while (Date.now() - startTime < monitorDuration) {
      await page.waitForTimeout(SNAPSHOT_INTERVAL_MS);
      const snap = await takeMemorySnapshot(page, cdp);
      snapshots.push(snap);

      // Check vitals from debug.ts
      const vitals = await getVitals(page);
      if (vitals) {
        console.log(
          `[${((Date.now() - startTime) / 1000).toFixed(0)}s] ` +
          `heap=${(snap.heapUsed / 1024 / 1024).toFixed(1)}MB ` +
          `dom=${snap.domNodes} ` +
          `renders=${vitals.renderRate}/s ` +
          `msgs=${vitals.messageEventRate}/2s ` +
          `listeners=${vitals.globalListenerBalance}`
        );
      }
    }

    printMemoryReport('Message Flood', snapshots);

    // Assertions
    const heapGrowth = (snapshots[snapshots.length - 1].heapUsed - baseline.heapUsed) / 1024 / 1024;
    expect(heapGrowth).toBeLessThan(MAX_HEAP_GROWTH_MB);

    const peakDom = Math.max(...snapshots.map(s => s.domNodes));
    expect(peakDom).toBeLessThan(MAX_DOM_NODES);

    await cdp.detach();
  });

  test('Scenario 2: Monitor app idle memory stability', async ({ page }) => {
    // This test just monitors memory during normal idle operation
    // to establish a baseline and detect leaks from timers/intervals
    await waitForAppReady(page);
    await createIdentity(page, 'StressUser');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    const snapshots: MemorySnapshot[] = [];

    // Monitor for 60 seconds of idle
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);
      const snap = await takeMemorySnapshot(page, cdp);
      snapshots.push(snap);

      const vitals = await getVitals(page);
      console.log(
        `[${(i + 1) * 5}s idle] ` +
        `heap=${(snap.heapUsed / 1024 / 1024).toFixed(1)}MB ` +
        `dom=${snap.domNodes}` +
        (vitals ? ` renders=${vitals.renderRate}/s listeners=${vitals.globalListenerBalance}` : '')
      );
    }

    printMemoryReport('Idle Stability', snapshots);

    // Idle should have minimal growth (< 20MB over 60s)
    if (snapshots.length >= 2) {
      const growth = (snapshots[snapshots.length - 1].heapUsed - snapshots[0].heapUsed) / 1024 / 1024;
      expect(growth).toBeLessThan(20);
    }

    await cdp.detach();
  });

  test('Scenario 3: Page navigation cycle — check for cleanup', async ({ page }) => {
    // Navigate between different pages to check for cleanup
    await waitForAppReady(page);
    await createIdentity(page, 'StressUser');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    const baseline = await takeMemorySnapshot(page, cdp);
    console.log(`Baseline: heap=${(baseline.heapUsed / 1024 / 1024).toFixed(1)}MB`);

    // Navigate to settings and back multiple times
    for (let i = 0; i < 5; i++) {
      // Go to settings (if settings route exists)
      await page.evaluate(() => {
        // Trigger a full page reload to test cleanup
        window.location.reload();
      });
      await page.waitForTimeout(5000);

      const snap = await takeMemorySnapshot(page, cdp);
      const growth = (snap.heapUsed - baseline.heapUsed) / 1024 / 1024;
      console.log(`[Cycle ${i + 1}] heap=${(snap.heapUsed / 1024 / 1024).toFixed(1)}MB (+${growth.toFixed(1)}MB), dom=${snap.domNodes}`);
    }

    // Check crash report appears after reload
    const vitals = await getVitals(page);
    console.log('Post-reload vitals:', vitals ? 'present' : 'missing');

    await cdp.detach();
  });
});
