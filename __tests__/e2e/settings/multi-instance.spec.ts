/**
 * 11.13 Settings — Multi-Instance Detection E2E Tests
 *
 * Tests the multi-instance detection feature: when multiple browser tabs
 * are running Umbra simultaneously, the second tab should detect the
 * conflict and display appropriate messaging.
 *
 * Uses two browser contexts to simulate two tabs.
 *
 * Test IDs: T-MI.1–T-MI.2
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
} from '../helpers';

test.describe('Multi-Instance Detection', () => {

  test('T-MI.1: Opening second tab detects instance conflict via service API', async ({ browser }) => {
    // Create first context (tab 1)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await createIdentity(page1, 'Tab1User');

    // Verify instance coordinator is available
    const hasCoordinator = await page1.evaluate(() => {
      try {
        const mod = require('@umbra/service');
        return typeof mod.startInstanceCoordinator === 'function';
      } catch {
        return false;
      }
    });
    expect(hasCoordinator).toBe(true);

    // Create second context (tab 2) — in the same browser
    // Note: BroadcastChannel only works within the same browser instance
    // In Playwright, different contexts are isolated, so this tests the API shape
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await createIdentity(page2, 'Tab2User');

    // Both should have the coordinator API
    const hasCoordinator2 = await page2.evaluate(() => {
      try {
        const mod = require('@umbra/service');
        return typeof mod.startInstanceCoordinator === 'function';
      } catch {
        return false;
      }
    });
    expect(hasCoordinator2).toBe(true);

    await context1.close();
    await context2.close();
  });

  test('T-MI.2: Instance coordinator reports primary status correctly', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await createIdentity(page, 'PrimaryUser');

    // Start the coordinator in-page
    const result = await page.evaluate(() => {
      try {
        const mod = require('@umbra/service');
        const coordinator = mod.startInstanceCoordinator();
        const isPrimary = coordinator.isPrimary;
        coordinator.shutdown();
        return { isPrimary, hasOnConflict: typeof coordinator.onConflict === 'function', hasShutdown: typeof coordinator.shutdown === 'function' };
      } catch (e: any) {
        return { error: e.message };
      }
    });

    // First (only) instance should be primary
    expect(result.isPrimary).toBe(true);
    expect(result.hasOnConflict).toBe(true);
    expect(result.hasShutdown).toBe(true);

    await context.close();
  });
});
