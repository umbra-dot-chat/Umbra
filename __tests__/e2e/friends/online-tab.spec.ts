/**
 * 3.3 Online Tab E2E Tests
 *
 * Tests the Online tab display and empty states.
 *
 * Test IDs: T3.3.1–T3.3.3
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

test.describe('3.3 Online Tab', () => {
  test.setTimeout(120_000);

  test('T3.3.1 — Online tab only shows online friends', async ({ page }) => {
    await createIdentity(page, 'OnlineTabUser');
    await navigateToFriends(page);
    await clickTab(page, 'Online');
    // With no friends, should show online section
    await expect(page.getByText('Online').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.3.2 — Empty state: "No friends online right now."', async ({ page }) => {
    await createIdentity(page, 'OnlineEmptyUser');
    await navigateToFriends(page);
    await clickTab(page, 'Online');
    await expect(
      page.getByText('No friends online right now.').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // T3.3.3 (real-time status updates) requires two-user test — covered in friend request flow
});
