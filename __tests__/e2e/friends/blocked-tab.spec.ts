/**
 * 3.5 Blocked Tab E2E Tests
 *
 * Tests blocked user list display and empty states.
 *
 * Test IDs: T3.5.1–T3.5.4
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

test.describe('3.5 Blocked Tab', () => {
  test.setTimeout(120_000);

  test('T3.5.1 — Shows blocked list or empty state', async ({ page }) => {
    await createIdentity(page, 'BlockedTabUser');
    await navigateToFriends(page);
    await clickTab(page, 'Blocked');
    // Fresh account has no blocked users
    await expect(page.getByText('Blocked Users').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.5.2 — Empty state shows "No blocked users."', async ({ page }) => {
    await createIdentity(page, 'BlockedEmptyUser');
    await navigateToFriends(page);
    await clickTab(page, 'Blocked');
    await expect(
      page.getByText('No blocked users.').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // T3.5.3 (unblock button) and T3.5.4 (blocking reason) require having blocked users
  // These are covered in the friend-actions.spec.ts two-user tests
});
