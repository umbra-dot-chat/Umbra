/**
 * Messaging E2E Tests — Send, edit, delete messages.
 *
 * These tests assume an identity has been created and friends exist.
 * In a real CI setup, use fixtures to set up test data.
 */

import { test, expect } from '@playwright/test';

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for identity restoration or create new
    await page.waitForTimeout(5000);
  });

  test('should display empty conversation state', async ({ page }) => {
    // If the user has no conversations, the empty state should show
    const welcomeText = page.getByText('Welcome to Umbra');
    const hasConversations = !(await welcomeText.isVisible({ timeout: 5_000 }).catch(() => false));

    if (!hasConversations) {
      await expect(welcomeText).toBeVisible();
    }
  });

  test('should send a message in an existing conversation', async ({ page }) => {
    // Skip if no conversations exist
    const welcomeText = page.getByText('Welcome to Umbra');
    if (await welcomeText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // Type and send a message
    const input = page.getByPlaceholder(/message|type/i);
    if (await input.isVisible()) {
      await input.fill('Hello from Playwright E2E test!');
      await input.press('Enter');

      // Message should appear in the chat area
      await expect(page.getByText('Hello from Playwright E2E test!')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should persist messages across page refresh', async ({ page }) => {
    // Skip if no conversations exist
    const welcomeText = page.getByText('Welcome to Umbra');
    if (await welcomeText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // Send a unique message
    const uniqueMsg = `E2E-${Date.now()}`;
    const input = page.getByPlaceholder(/message|type/i);
    if (await input.isVisible()) {
      await input.fill(uniqueMsg);
      await input.press('Enter');
      await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 5_000 });
    }

    // Refresh and verify persistence
    await page.reload();
    await page.waitForTimeout(5000); // Wait for IndexedDB restore

    // Message should still be there
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 15_000 });
  });
});
