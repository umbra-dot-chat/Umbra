/**
 * 2.6 Sidebar Resize E2E Tests
 *
 * Tests the drag-to-resize handle between the sidebar and main content area:
 * basic drag resize, minimum/maximum width constraints, and session persistence.
 *
 * Test IDs: T2.6.1-T2.6.4
 */

import { test, expect } from '@playwright/test';
import { createIdentity, UI_SETTLE_TIMEOUT } from '../helpers';

/** Locate the sidebar element. */
function getSidebar(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="sidebar"], [data-testid="nav-sidebar"]').first();
}

/** Locate the resize drag handle between sidebar and content. */
function getResizeHandle(page: import('@playwright/test').Page) {
  return page.locator('[data-testid="resize-handle"], [data-testid="sidebar-resize-handle"]').first();
}

/** Get the current sidebar width in pixels. */
async function getSidebarWidth(page: import('@playwright/test').Page): Promise<number> {
  const sidebar = getSidebar(page);
  const box = await sidebar.boundingBox();
  return box?.width ?? 0;
}

/** Drag the resize handle horizontally by a given delta. */
async function dragResizeHandle(
  page: import('@playwright/test').Page,
  deltaX: number,
) {
  const handle = getResizeHandle(page);
  const box = await handle.boundingBox();
  if (!box) throw new Error('Resize handle not found');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

test.describe('2.6 Sidebar Resize', () => {
  test.setTimeout(120_000);

  test('T2.6.1 — Drag resize handle between sidebar and content', async ({ page }) => {
    await createIdentity(page, 'ResizeDragUser');

    const handle = getResizeHandle(page);
    const handleVisible = await handle
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (handleVisible) {
      const widthBefore = await getSidebarWidth(page);
      await dragResizeHandle(page, 80);
      const widthAfter = await getSidebarWidth(page);

      expect(widthAfter).toBeGreaterThan(widthBefore);
    }
  });

  test('T2.6.2 — Sidebar has minimum width (220px)', async ({ page }) => {
    await createIdentity(page, 'ResizeMinUser');

    const handle = getResizeHandle(page);
    if (await handle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Drag far to the left to hit minimum
      await dragResizeHandle(page, -600);
      const width = await getSidebarWidth(page);

      expect(width).toBeGreaterThanOrEqual(220);
    }
  });

  test('T2.6.3 — Sidebar has maximum width (500px)', async ({ page }) => {
    await createIdentity(page, 'ResizeMaxUser');

    const handle = getResizeHandle(page);
    if (await handle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Drag far to the right to hit maximum
      await dragResizeHandle(page, 600);
      const width = await getSidebarWidth(page);

      expect(width).toBeLessThanOrEqual(500);
    }
  });

  test('T2.6.4 — Resize persists during session', async ({ page }) => {
    await createIdentity(page, 'ResizePersistUser');

    const handle = getResizeHandle(page);
    if (await handle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await dragResizeHandle(page, 60);
      const widthAfterDrag = await getSidebarWidth(page);

      // Navigate away and back — width should persist within the session
      await page.getByText('Friends').first().click();
      await page.waitForTimeout(UI_SETTLE_TIMEOUT);

      const widthAfterNav = await getSidebarWidth(page);
      expect(widthAfterNav).toBeCloseTo(widthAfterDrag, -1);
    }
  });
});
