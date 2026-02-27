/**
 * 2.4 New Chat Menu E2E Tests
 *
 * Tests the "+" dropdown menu in the sidebar header: opening the menu,
 * launching the New DM and New Group dialogs, and dismissing with
 * an outside click.
 *
 * Test IDs: T2.4.1-T2.4.4
 */

import { test, expect } from '@playwright/test';
import { createIdentity, UI_SETTLE_TIMEOUT } from '../helpers';

/** Click the "+" new conversation button in the sidebar. */
async function clickNewChatButton(page: import('@playwright/test').Page) {
  const btn = page.getByRole('button', { name: 'New conversation' });
  await expect(btn).toBeVisible({ timeout: 5_000 });
  await btn.click();
  await page.waitForTimeout(500);
}

test.describe('2.4 New Chat Menu', () => {
  test.setTimeout(120_000);

  test('T2.4.1 — Click "+" shows dropdown with "New DM" and "New Group"', async ({
    page,
  }) => {
    await createIdentity(page, 'MenuOpenUser');

    await clickNewChatButton(page);

    // Both menu items should be visible
    await expect(page.getByText('New DM').first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText('New Group').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('T2.4.2 — "New DM" opens friend picker dialog', async ({ page }) => {
    await createIdentity(page, 'MenuDmUser');

    await clickNewChatButton(page);
    await expect(page.getByText('New DM').first()).toBeVisible({
      timeout: 5_000,
    });

    // Click "New DM"
    await page.getByText('New DM').first().click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The friend picker dialog should open
    await expect(
      page.getByText('Start a Conversation').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T2.4.3 — "New Group" opens create group dialog', async ({ page }) => {
    await createIdentity(page, 'MenuGroupUser');

    await clickNewChatButton(page);
    await expect(page.getByText('New Group').first()).toBeVisible({
      timeout: 5_000,
    });

    // Click "New Group"
    await page.getByText('New Group').first().click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The create group dialog should open
    await expect(
      page.getByText('Create Group').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T2.4.4 — Click outside dropdown dismisses it', async ({ page }) => {
    await createIdentity(page, 'MenuDismissUser');

    await clickNewChatButton(page);

    // Menu items should be visible
    await expect(page.getByText('New DM').first()).toBeVisible({
      timeout: 5_000,
    });

    // Click outside the menu — use the main content area
    await page.mouse.click(600, 400);
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Menu should be dismissed
    await expect(page.getByText('New DM').first()).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
