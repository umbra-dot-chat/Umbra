/**
 * 3.4 Pending Tab E2E Tests
 *
 * Tests the Pending tab display, incoming/outgoing sections,
 * and add friend input on the Pending tab.
 *
 * Test IDs: T3.4.1–T3.4.7
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

test.describe('3.4 Pending Tab', () => {
  test.setTimeout(120_000);

  test('T3.4.1 — "Add Friend" input available on Pending tab', async ({ page }) => {
    await createIdentity(page, 'PendingInputUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    // DID input should be visible on the Pending tab
    await expect(
      page.getByPlaceholder('did:key:z6Mk...').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T3.4.2 — "Incoming" section shows requests from others', async ({ page }) => {
    await createIdentity(page, 'IncomingSectionUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    // Incoming section header should be visible
    await expect(page.getByText('Incoming').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.4.3 — Empty incoming state: "No incoming requests."', async ({ page }) => {
    await createIdentity(page, 'IncomingEmptyUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    await expect(
      page.getByText('No incoming requests.').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T3.4.4 — "Outgoing" section shows requests you\'ve sent', async ({ page }) => {
    await createIdentity(page, 'OutgoingSectionUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    // Outgoing section header should be visible
    await expect(page.getByText('Outgoing').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.4.5 — Empty outgoing state: "No outgoing requests."', async ({ page }) => {
    await createIdentity(page, 'OutgoingEmptyUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    await expect(
      page.getByText('No outgoing requests.').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T3.4.6 — Username search input available on Pending tab', async ({ page }) => {
    await createIdentity(page, 'PendingSearchUser');
    await navigateToFriends(page);
    await clickTab(page, 'Pending');
    await expect(
      page.getByPlaceholder(/Search by username/).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // T3.4.3 (accept/decline buttons), T3.4.4 (timestamps), T3.4.6 (cancel button),
  // T3.4.7 (count badge) require actual friend requests — covered in friend-request-flow.spec.ts
});
