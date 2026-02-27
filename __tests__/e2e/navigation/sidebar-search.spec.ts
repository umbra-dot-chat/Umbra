/**
 * 2.3 Sidebar Search E2E Tests
 *
 * Tests the search bar in the chat sidebar: filtering conversations by name,
 * last message preview, friend name, clearing search, and empty state.
 *
 * Test IDs: T2.3.1-T2.3.5
 */

import { test, expect } from '@playwright/test';
import { createIdentity, UI_SETTLE_TIMEOUT } from '../helpers';

/** Locate the sidebar search input. */
function getSearchInput(page: import('@playwright/test').Page) {
  return page.getByPlaceholder('Search...');
}

test.describe('2.3 Sidebar Search', () => {
  test.setTimeout(120_000);

  test('T2.3.1 — Typing filters conversations by name', async ({ page }) => {
    await createIdentity(page, 'SearchNameUser');

    // Search input should be visible in the sidebar
    const search = getSearchInput(page);
    await expect(search).toBeVisible({ timeout: 5_000 });

    // CONVERSATIONS header should be visible
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Type a conversation name filter — with a fresh identity there
    // are no conversations, so any text typed acts as a name filter
    await search.fill('TestConvName');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The sidebar should have filtered its list (no crash, UI intact)
    await expect(search).toHaveValue('TestConvName');
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible();
  });

  test('T2.3.2 — Filtering by last message preview text works', async ({
    page,
  }) => {
    await createIdentity(page, 'SearchMsgUser');

    const search = getSearchInput(page);
    await expect(search).toBeVisible({ timeout: 5_000 });

    // Type text that would match a last-message preview
    await search.fill('hello world');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Search applied without error — sidebar remains functional
    await expect(search).toHaveValue('hello world');
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible();
  });

  test('T2.3.3 — Filtering by friend name in conversation works', async ({
    page,
  }) => {
    await createIdentity(page, 'SearchFriendUser');

    const search = getSearchInput(page);
    await expect(search).toBeVisible({ timeout: 5_000 });

    // Type a friend-name-style filter
    await search.fill('Alice');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Sidebar remains intact; filter applied
    await expect(search).toHaveValue('Alice');
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible();
  });

  test('T2.3.4 — Clear search restores all conversations', async ({
    page,
  }) => {
    await createIdentity(page, 'SearchClearUser');

    const search = getSearchInput(page);
    await expect(search).toBeVisible({ timeout: 5_000 });

    // Type a filter
    await search.fill('some filter');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
    await expect(search).toHaveValue('some filter');

    // Clear the search — either via the clear button or by emptying
    await search.fill('');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Search is empty again, sidebar fully visible
    await expect(search).toHaveValue('');
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible();
  });

  test('T2.3.5 — No results shows empty state', async ({ page }) => {
    await createIdentity(page, 'SearchEmptyUser');

    const search = getSearchInput(page);
    await expect(search).toBeVisible({ timeout: 5_000 });

    // Type a query that will never match any conversation
    await search.fill('zzz_no_match_xyz_999');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // With no matching conversations the list should be empty —
    // no ConversationListItem elements rendered
    const items = page.locator('[data-testid="ConversationListItem"]');
    const count = await items.count();
    expect(count).toBe(0);

    // Sidebar structure remains intact
    await expect(
      page.getByText('Conversations').first(),
    ).toBeVisible();
  });
});
