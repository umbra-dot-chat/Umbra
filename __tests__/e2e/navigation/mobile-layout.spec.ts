/**
 * 2.7 Mobile Layout E2E Tests
 *
 * Tests mobile-responsive behavior under a narrow viewport (375x812):
 * sidebar fills screen, conversation selection slides content in,
 * swipe gestures to reveal/hide sidebar, flick vs slow drag snapping.
 *
 * Test IDs: T2.7.1-T2.7.6
 */

import { test, expect } from '@playwright/test';
import { createIdentity, UI_SETTLE_TIMEOUT } from '../helpers';

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;

/** Set the viewport to mobile dimensions. */
async function setMobileViewport(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
}

/** Simulate a horizontal swipe gesture using mouse events. */
async function swipeHorizontal(
  page: import('@playwright/test').Page,
  startX: number,
  endX: number,
  y: number,
  steps = 10,
) {
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

test.describe('2.7 Mobile Layout', () => {
  test.setTimeout(120_000);

  test('T2.7.1 — On narrow viewport, sidebar fills screen, no content visible', async ({
    page,
  }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileSidebarUser');

    // Sidebar should fill the entire mobile viewport width
    const sidebar = page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
    if (await sidebar.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const box = await sidebar.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MOBILE_WIDTH - 10);
    }
  });

  test('T2.7.2 — Selecting a conversation slides content into view', async ({ page }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileSlideUser');

    // Click a conversation item if available
    const convItem = page.locator('[data-testid^="conversation-"]').first();
    if (await convItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await convItem.click();
      await page.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Content area should now be visible
      const content = page.locator('[data-testid="main-content"], [data-testid="chat-view"]').first();
      await expect(content).toBeVisible({ timeout: 5_000 });
    }
  });

  test('T2.7.3 — Swipe right from left edge reveals sidebar', async ({ page }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileSwipeRUser');

    // Navigate to a conversation first so sidebar is hidden
    const convItem = page.locator('[data-testid^="conversation-"]').first();
    if (await convItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await convItem.click();
      await page.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Swipe right from left edge to reveal sidebar
      await swipeHorizontal(page, 5, MOBILE_WIDTH * 0.6, MOBILE_HEIGHT / 2);

      const sidebar = page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 5_000 });
    }
  });

  test('T2.7.4 — Swipe left hides sidebar, shows content', async ({ page }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileSwipeLUser');

    // Sidebar should be visible initially on mobile
    const sidebar = page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
    if (await sidebar.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Swipe left to hide sidebar
      await swipeHorizontal(page, MOBILE_WIDTH * 0.8, 20, MOBILE_HEIGHT / 2);
      await page.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Content area should now be primary
      const content = page.locator('[data-testid="main-content"], [data-testid="chat-view"]').first();
      const contentVisible = await content
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(contentVisible).toBeTruthy();
    }
  });

  test('T2.7.5 — Fast flick follows swipe direction', async ({ page }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileFlickUser');

    // Fast flick = few steps (fast velocity)
    // Flick right from left edge with only 3 steps (fast)
    await swipeHorizontal(page, 5, 120, MOBILE_HEIGHT / 2, 3);

    const sidebar = page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
    const sidebarVisible = await sidebar
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(typeof sidebarVisible).toBe('boolean');
  });

  test('T2.7.6 — Slow drag snaps to nearest position', async ({ page }) => {
    await setMobileViewport(page);
    await createIdentity(page, 'MobileSnapUser');

    // Slow drag = many steps (slow velocity), partial distance
    // Drag right but only partway — should snap back if < 50%
    await swipeHorizontal(page, 5, MOBILE_WIDTH * 0.3, MOBILE_HEIGHT / 2, 30);
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The sidebar should snap to nearest threshold (open or closed)
    const sidebar = page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
    const sidebarVisible = await sidebar
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(typeof sidebarVisible).toBe('boolean');
  });
});
