/**
 * 3.8 Friend Actions (Two-User) E2E Tests
 *
 * Tests friend management actions that require an established friendship:
 * removing friends, blocking/unblocking users, block reasons, and
 * the "Message" button navigation to correct DM conversation.
 *
 * Each test creates two browser contexts, establishes a friendship via
 * the relay, then performs the action under test.
 *
 * Test IDs: T3.8.1–T3.8.5
 */

import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

// ─── Two-User Friendship Helpers ────────────────────────────────────────────

/**
 * Create two isolated browser contexts with fresh identities,
 * establish a confirmed friendship between them, and return
 * both pages on the Friends > All tab.
 */
async function establishFriendship(
  browser: Browser,
  suffix: string,
): Promise<{
  contextA: Awaited<ReturnType<Browser['newContext']>>;
  contextB: Awaited<ReturnType<Browser['newContext']>>;
  pageA: Page;
  pageB: Page;
  didA: string;
  didB: string;
}> {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const { did: didA } = await createIdentity(pageA, `UserA${suffix}`);
  const { did: didB } = await createIdentity(pageB, `UserB${suffix}`);

  // UserB sends a friend request to UserA
  await navigateToFriends(pageB);
  const didInput = pageB.getByPlaceholder('did:key:z6Mk...').first();
  await expect(didInput).toBeVisible({ timeout: 5_000 });
  await didInput.fill(didA);
  await pageB
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Wait for relay to deliver
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // UserA accepts on Pending tab
  await navigateToFriends(pageA);
  await clickTab(pageA, 'Pending');
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  const acceptBtn = pageA.getByRole('button', { name: 'Accept' }).first();
  await expect(acceptBtn).toBeVisible({ timeout: 15_000 });
  await acceptBtn.click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Wait for relay sync
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // Verify friendship on All tab
  await clickTab(pageA, 'All');
  await expect(
    pageA.getByText(new RegExp(`UserB${suffix}`)).first(),
  ).toBeVisible({ timeout: 15_000 });

  return { contextA, contextB, pageA, pageB, didA, didB };
}

/**
 * Open the "More" context menu for a friend on the All tab.
 * The FriendListItem renders a "More" button (accessibilityLabel="More").
 * Clicking it opens a DropdownMenu with actions.
 */
async function openFriendMoreMenu(page: Page, friendNamePattern: RegExp): Promise<void> {
  await clickTab(page, 'All');
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  await expect(page.getByText(friendNamePattern).first()).toBeVisible({ timeout: 10_000 });

  const moreBtn = page.getByRole('button', { name: 'More' }).first();
  await expect(moreBtn).toBeVisible({ timeout: 5_000 });
  await moreBtn.click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

/**
 * Complete the block flow:
 * 1. Click "Block User" in the dropdown menu
 * 2. Click "Block" in the confirmation dialog
 * 3. Optionally fill in a reason in the InputDialog
 * 4. Click "Block" in the InputDialog
 */
async function completeBlockFlow(page: Page, reason?: string): Promise<void> {
  // Click "Block User" in the context menu
  const blockOption = page.getByText('Block User').first();
  await expect(blockOption).toBeVisible({ timeout: 5_000 });
  await blockOption.click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  // ConfirmDialog: click "Block" to confirm
  const confirmBtn = page.getByRole('button', { name: 'Block' }).first();
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  // InputDialog for reason: fill if provided, then submit
  const reasonInput = page.getByPlaceholder(/spam|harassment/i).first();
  const reasonVisible = await reasonInput
    .isVisible({ timeout: 5_000 })
    .catch(() => false);

  if (reasonVisible && reason) {
    await reasonInput.fill(reason);
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
  }

  // Click "Block" in the InputDialog to submit
  const submitBtn = page.getByRole('button', { name: 'Block' }).first();
  await expect(submitBtn).toBeVisible({ timeout: 5_000 });
  await submitBtn.click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

// ─── T3.8.1: Remove Friend ─────────────────────────────────────────────────

test.describe('3.8 Friend Actions — Remove Friend', () => {
  test.setTimeout(180_000);

  test('T3.8.1 — Remove friend — confirmation dialog, friend removed from list', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await establishFriendship(browser, 'Rm1');

    try {
      // Open the More menu for UserB
      await openFriendMoreMenu(pageA, /UserBRm1/);

      // Click "Remove Friend" in the context menu
      const removeOption = pageA.getByText('Remove Friend').first();
      await expect(removeOption).toBeVisible({ timeout: 5_000 });
      await removeOption.click();
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // ConfirmDialog should appear
      await expect(
        pageA.getByText(/remove.*UserBRm1/i).first(),
      ).toBeVisible({ timeout: 5_000 });

      // Click "Remove" to confirm
      const confirmBtn = pageA.getByRole('button', { name: 'Remove' }).first();
      await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
      await confirmBtn.click();
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Verify UserB is no longer in the friend list
      await clickTab(pageA, 'All');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      const friendStillVisible = await pageA
        .getByText(/UserBRm1/)
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(friendStillVisible).toBeFalsy();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

// ─── T3.8.2: Block Friend ──────────────────────────────────────────────────

test.describe('3.8 Friend Actions — Block Friend', () => {
  test.setTimeout(180_000);

  test('T3.8.2 — Block friend — moves to Blocked tab', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await establishFriendship(browser, 'Blk2');

    try {
      // Open the More menu and complete the block flow (no reason)
      await openFriendMoreMenu(pageA, /UserBBlk2/);
      await completeBlockFlow(pageA);

      // Wait for the action to process
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Verify UserB is no longer in the All tab
      await clickTab(pageA, 'All');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      const friendStillVisible = await pageA
        .getByText(/UserBBlk2/)
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(friendStillVisible).toBeFalsy();

      // Navigate to Blocked tab — user's DID should appear
      await clickTab(pageA, 'Blocked');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // The blocked tab shows DIDs (not display names)
      await expect(
        pageA.getByText(/Blocked Users/).first(),
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

// ─── T3.8.3: Block with Reason ─────────────────────────────────────────────

test.describe('3.8 Friend Actions — Block with Reason', () => {
  test.setTimeout(180_000);

  test('T3.8.3 — Block with reason — reason stored and displayed', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await establishFriendship(browser, 'Rsn3');

    const blockReason = 'Spamming messages';

    try {
      // Open the More menu and complete the block flow with a reason
      await openFriendMoreMenu(pageA, /UserBRsn3/);
      await completeBlockFlow(pageA, blockReason);

      // Wait for the action to process
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Navigate to Blocked tab
      await clickTab(pageA, 'Blocked');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // The block reason should be displayed
      await expect(
        pageA.getByText(blockReason).first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

// ─── T3.8.4: Unblock ───────────────────────────────────────────────────────

test.describe('3.8 Friend Actions — Unblock', () => {
  test.setTimeout(180_000);

  test('T3.8.4 — Unblock — user removed from Blocked tab', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await establishFriendship(browser, 'Unb4');

    try {
      // Block UserB first
      await openFriendMoreMenu(pageA, /UserBUnb4/);
      await completeBlockFlow(pageA);
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Navigate to Blocked tab — verify user is blocked
      await clickTab(pageA, 'Blocked');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Click "Unblock" for the blocked user
      const unblockBtn = pageA.getByRole('button', { name: 'Unblock' }).first();
      await expect(unblockBtn).toBeVisible({ timeout: 10_000 });
      await unblockBtn.click();
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Verify the Blocked tab now shows empty state
      await clickTab(pageA, 'Blocked');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      await expect(
        pageA.getByText('No blocked users.').first(),
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

// ─── T3.8.5: Message Button Navigation ──────────────────────────────────────

test.describe('3.8 Friend Actions — Message Navigation', () => {
  test.setTimeout(180_000);

  test('T3.8.5 — Message button navigates to DM conversation', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await establishFriendship(browser, 'Msg5');

    try {
      // Click "Message" button for UserB on the All tab
      await clickTab(pageA, 'All');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      await expect(
        pageA.getByText(/UserBMsg5/).first(),
      ).toBeVisible({ timeout: 10_000 });

      // Click the Message action button
      const messageBtn = pageA.getByRole('button', { name: 'Message' }).first();
      await expect(messageBtn).toBeVisible({ timeout: 5_000 });
      await messageBtn.click();
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Should navigate to the chat page (route "/")
      // Verify we're on the chat page by checking for the message input
      await expect(
        pageA.getByPlaceholder('Type a message...').first(),
      ).toBeVisible({ timeout: 10_000 });

      // The chat header should show the friend's name
      await expect(
        pageA.getByText(/UserBMsg5/).first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
