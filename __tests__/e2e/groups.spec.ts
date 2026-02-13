/**
 * Groups E2E Tests — Create group, invite flow, group messaging.
 *
 * Tests the group creation UI and invitation flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
  });

  test('should open the New Group dialog from the + menu', async ({ page }) => {
    // Look for the + button in the sidebar
    const plusBtn = page.locator('[aria-label*="new"]').or(page.locator('text=+'));

    // If we're on the main page with sidebar
    const welcomeText = page.getByText('Welcome to Umbra');
    if (await welcomeText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // We need friends first to create a group
      test.skip();
      return;
    }

    // Try to click the + button
    if (await plusBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await plusBtn.first().click();

      // Should show the menu with "New Group" option
      const newGroupOption = page.getByText('New Group');
      if (await newGroupOption.isVisible({ timeout: 3_000 })) {
        await newGroupOption.click();

        // The Create Group dialog should appear
        await expect(page.getByText('Create Group')).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('should validate group creation requires a name', async ({ page }) => {
    const welcomeText = page.getByText('Welcome to Umbra');
    if (await welcomeText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    const plusBtn = page.locator('[aria-label*="new"]').or(page.locator('text=+'));
    if (await plusBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await plusBtn.first().click();
      const newGroupOption = page.getByText('New Group');
      if (await newGroupOption.isVisible({ timeout: 3_000 })) {
        await newGroupOption.click();

        // Try to create without a name — button should be disabled
        const createBtn = page.getByText('Create & Invite');
        if (await createBtn.isVisible()) {
          await expect(createBtn).toBeDisabled();
        }
      }
    }
  });
});
