/**
 * 3.6 Friend Request Flow (Two-User) E2E Tests
 *
 * Tests the full friend request lifecycle between two separate browser
 * contexts: sending, receiving, accepting, declining, duplicate handling,
 * relay synchronization, and DM auto-creation.
 *
 * Test IDs: T3.6.1–T3.6.10
 */

import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToFriends,
  navigateToSettings,
  clickTab,
} from '../helpers';

// ─── Two-User Setup Helpers ─────────────────────────────────────────────────

/**
 * Create two isolated browser contexts with fresh identities.
 * Returns pages, contexts, and identity info for both users.
 */
async function setupTwoUsers(browser: Browser, suffix: string) {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const userA = await createIdentity(pageA, `Alice${suffix}`);
  const userB = await createIdentity(pageB, `Bob${suffix}`);

  return { contextA, contextB, pageA, pageB, userA, userB };
}

/**
 * Send a friend request from one page to a target DID.
 * Navigates to Friends, fills the DID input, and submits.
 */
async function sendFriendRequest(page: Page, targetDid: string) {
  await navigateToFriends(page);
  const addInput = page.getByPlaceholder('did:key:z6Mk...');
  await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
  await addInput.first().fill(targetDid);
  // Submit via the Send Request button
  await page
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

// ─── T3.6.1–T3.6.3: Send Friend Request ────────────────────────────────────

test.describe('3.6 Friend Request Flow — Send Request', () => {
  test.setTimeout(180_000);

  test('T3.6.1 — Tab A: DID is available from createIdentity', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    const userA = await createIdentity(pageA, 'AliceDID');

    // The DID returned from createIdentity should be a valid did:key
    expect(userA.did).toMatch(/^did:key:z[A-Za-z0-9]+$/);

    // Verify the DID is also visible in the Settings > Account page
    await navigateToSettings(pageA);
    await expect(pageA.getByText(userA.did).first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
  });

  test('T3.6.2 — Tab B: Paste DID into Add Friend input and send', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '362');

    // Tab B sends a friend request to Tab A using A's DID
    await navigateToFriends(pageB);
    const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
    await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
    await addInput.first().fill(userA.did);

    // Submit the request
    await pageB
      .getByRole('button', { name: 'Send friend request' })
      .first()
      .click();

    // The input should clear or the request should be acknowledged
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    await contextA.close();
    await contextB.close();
  });

  test('T3.6.3 — Tab B: Success feedback "Friend request sent!"', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '363');

    await sendFriendRequest(pageB, userA.did);

    // Should see success feedback
    await expect(
      pageB.getByText(/[Ff]riend request sent/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.4–T3.6.5: Accept Flow ────────────────────────────────────────────

test.describe('3.6 Friend Request Flow — Accept', () => {
  test.setTimeout(180_000);

  test('T3.6.4 — Tab A: Pending tab shows incoming request from Tab B', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '364');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);

    // Wait for relay to deliver the request
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice navigates to Friends > Pending tab
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');

    // Alice should see the incoming request (Bob's name or DID in the Incoming section)
    const incomingVisible = await pageA
      .getByText('Incoming')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(incomingVisible).toBeTruthy();

    // Look for Bob's display name in the pending requests
    await expect(
      pageA.getByText(/Bob364/).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  test('T3.6.5 — Tab A: Accept — friend appears in All tab', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '365');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice navigates to Pending tab and accepts
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
    await acceptBtn.first().click();
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Switch to All tab — Bob should appear as a friend
    await clickTab(pageA, 'All');
    await expect(
      pageA.getByText(/Bob365/).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.6: Relay Sync ────────────────────────────────────────────────────

test.describe('3.6 Friend Request Flow — Relay Sync', () => {
  test.setTimeout(180_000);

  test('T3.6.6 — Tab B: Friend also appears in All tab after relay sync', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '366');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice accepts the request
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
    await acceptBtn.first().click();

    // Wait for relay to sync acceptance back to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob checks the All tab — Alice should appear as a friend
    await navigateToFriends(pageB);
    await clickTab(pageB, 'All');
    await expect(
      pageB.getByText(/Alice366/).first(),
    ).toBeVisible({ timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.7: DM Auto-Creation ──────────────────────────────────────────────

test.describe('3.6 Friend Request Flow — DM Auto-Creation', () => {
  test.setTimeout(180_000);

  test('T3.6.7 — Both tabs: DM conversation auto-created in sidebar', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '367');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice accepts the request
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
    await acceptBtn.first().click();

    // Wait for relay sync + DM creation
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Navigate to Conversations on both pages and check for DM
    // Click Conversations in the sidebar (navigate away from Friends)
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Alice should see a DM with Bob in the sidebar
    await expect(
      pageA.getByText(/Bob367/).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Bob should see a DM with Alice in the sidebar
    await pageB.getByText('Conversations').first().click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageB.getByText(/Alice367/).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.8: Decline Flow ──────────────────────────────────────────────────

test.describe('3.6 Friend Request Flow — Decline', () => {
  test.setTimeout(180_000);

  test('T3.6.8 — Tab A: Decline — request removed, no friendship created', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '368');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice navigates to Pending tab
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice should see the incoming request
    await expect(
      pageA.getByText(/Bob368/).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Alice declines the request
    const declineBtn = pageA.getByRole('button', { name: 'Decline' });
    await expect(declineBtn.first()).toBeVisible({ timeout: 5_000 });
    await declineBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The request should be removed from the Pending tab
    await expect(
      pageA.getByText(/Bob368/).first(),
    ).not.toBeVisible({ timeout: 5_000 });

    // Switch to All tab — Bob should NOT appear as a friend
    await clickTab(pageA, 'All');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    const bobVisible = await pageA
      .getByText(/Bob368/)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    expect(bobVisible).toBeFalsy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.9: Duplicate Request ──────────────────────────────────────────────

test.describe('3.6 Friend Request Flow — Duplicate Request', () => {
  test.setTimeout(180_000);

  test('T3.6.9 — Duplicate request to same DID — appropriate error', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '369');

    // Bob sends first friend request to Alice
    await sendFriendRequest(pageB, userA.did);

    // Wait for first request to settle
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob tries to send a second friend request to Alice
    await navigateToFriends(pageB);
    const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
    await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
    await addInput.first().fill(userA.did);

    await pageB
      .getByRole('button', { name: 'Send friend request' })
      .first()
      .click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should see an error or already-sent message
    const errorVisible = await pageB
      .getByText(/already sent|already pending|duplicate|request exists/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    expect(errorVisible).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T3.6.10: Accept Acknowledgment via Relay ───────────────────────────────

test.describe('3.6 Friend Request Flow — Accept Acknowledgment', () => {
  test.setTimeout(180_000);

  test('T3.6.10 — Accept acknowledgment sent via relay to requester', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, userA, userB } =
      await setupTwoUsers(browser, '3610');

    // Bob sends friend request to Alice
    await sendFriendRequest(pageB, userA.did);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see Alice in Outgoing on the Pending tab
    await navigateToFriends(pageB);
    await clickTab(pageB, 'Pending');
    await expect(
      pageB.getByText(/Alice3610/).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Alice accepts the request
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
    await acceptBtn.first().click();

    // Wait for relay to deliver the acceptance acknowledgment to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob's Pending tab should no longer show Alice (request resolved)
    await clickTab(pageB, 'Pending');
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    const aliceStillPending = await pageB
      .getByText(/Alice3610/)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // Alice should no longer be in the Pending/Outgoing section
    // (she moved to the All friends list)
    expect(aliceStillPending).toBeFalsy();

    // Bob should see Alice in the All tab now
    await clickTab(pageB, 'All');
    await expect(
      pageB.getByText(/Alice3610/).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});
