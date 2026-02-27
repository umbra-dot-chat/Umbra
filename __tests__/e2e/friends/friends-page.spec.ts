/**
 * 3.1 Friends Page Navigation + 3.2 All Friends Tab E2E Tests
 *
 * Tests friends page navigation, tab structure, profile card,
 * add friend input, and friend list display.
 *
 * Test IDs: T3.1.1–T3.1.3, T3.2.1–T3.2.8
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  createIdentity,
  navigateToFriends,
} from '../helpers';

test.describe('3.1 Friends Page Navigation', () => {
  test.setTimeout(120_000);

  test('T3.1.1 — Click "Friends" in sidebar — friends page loads', async ({ page }) => {
    await createIdentity(page, 'FriendsNavUser');
    await navigateToFriends(page);
    // Should see the friends page content
    await expect(page.getByText('Friends').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.1.2 — Header shows "Friends" title', async ({ page }) => {
    await createIdentity(page, 'FriendsHeaderUser');
    await navigateToFriends(page);
    await expect(page.getByText('Friends').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.1.3 — Four tabs: All, Online, Pending, Blocked', async ({ page }) => {
    await createIdentity(page, 'FriendsTabsUser');
    await navigateToFriends(page);
    await expect(page.getByText('All').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Online').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Blocked').first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('3.2 All Friends Tab', () => {
  test.setTimeout(120_000);

  test('T3.2.1 — Profile card at top with your DID info', async ({ page }) => {
    await createIdentity(page, 'ProfileCardUser');
    await navigateToFriends(page);
    // Profile card should show the user's DID (did:key: prefix)
    await expect(page.getByText(/did:key:/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.2.2 — "Add Friend" input with DID placeholder', async ({ page }) => {
    await createIdentity(page, 'AddFriendInputUser');
    await navigateToFriends(page);
    // Should see the DID input with placeholder
    await expect(page.getByPlaceholder('did:key:z6Mk...').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.2.3 — Empty state when no friends', async ({ page }) => {
    await createIdentity(page, 'EmptyFriendsUser');
    await navigateToFriends(page);
    await expect(
      page.getByText('No friends yet').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T3.2.4 — Platform selector shows Umbra, Discord, GitHub, Steam, Bluesky', async ({ page }) => {
    await createIdentity(page, 'PlatformSelectorUser');
    await navigateToFriends(page);
    await expect(page.getByText('Umbra').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Discord').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Steam').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Bluesky').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T3.2.5 — Username search input visible on Umbra platform', async ({ page }) => {
    await createIdentity(page, 'UsernameSearchUser');
    await navigateToFriends(page);
    await expect(
      page.getByPlaceholder(/Search by username/).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T3.2.6 — "Or add by DID" section visible', async ({ page }) => {
    await createIdentity(page, 'AddByDidUser');
    await navigateToFriends(page);
    await expect(page.getByText('Or add by DID').first()).toBeVisible({ timeout: 5_000 });
  });

  // T3.2.7 and T3.2.8 require actual friends (two-user tests)
  // They're covered in the friend request flow tests
});
