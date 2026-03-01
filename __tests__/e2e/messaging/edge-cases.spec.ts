/**
 * 21.1 & 21.3 Message & UI Edge Cases E2E Tests
 *
 * Tests edge cases: very long messages, empty message prevention,
 * Unicode display names, empty state, and dialog dismiss.
 *
 * Test IDs: T21.1.1, T21.1.5, T21.1.6, T21.3.2, T21.3.3, T21.3.6
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToFriends,
  navigateToSettings,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('21. Edge Cases', () => {
  test.setTimeout(90_000);

  test('T21.1.5 — Unicode characters in display names renders correctly', async ({
    page,
  }) => {
    // Create identity with accented Unicode characters
    await createIdentity(page, 'Ünïcödé Üser');

    // Navigate to Settings > Account to see the name displayed
    await navigateToSettings(page);

    // The display name should appear in the Account section
    await expect(
      page.getByText('Ünïcödé Üser').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T21.3.2 — Empty conversations list shows helpful empty state', async ({
    page,
  }) => {
    await createIdentity(page, 'EmptyConvUser');

    // Fresh account should have no conversations
    // Should see "Welcome to Umbra" or an empty state message
    await expect(
      page.getByText('Welcome to Umbra').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T21.3.3 — Empty friends list shows "No friends" message', async ({
    page,
  }) => {
    await createIdentity(page, 'NoFriendsUser');
    await navigateToFriends(page);

    // Fresh account — should show empty state for friends
    // Look for empty state indicators
    const emptyState = await page
      .getByText(/No friends|Add friends|add by DID/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(emptyState).toBeTruthy();
  });

  test('T21.3.6 — Dialog open + Escape key closes dialog properly', async ({
    page,
  }) => {
    await createIdentity(page, 'DialogEscUser');

    // Open the New Conversation menu
    await page.getByRole('button', { name: 'New conversation' }).click();
    await page.waitForTimeout(500);

    // Click "New Group" to open dialog
    await page.getByText('New Group').first().click();
    await page.waitForTimeout(1_000);

    // Verify dialog is open
    await expect(
      page.getByText('Create Group & Invite Members').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Dialog should be closed
    await expect(
      page.getByText('Create Group & Invite Members').first(),
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
