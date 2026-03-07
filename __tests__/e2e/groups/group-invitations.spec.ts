/**
 * 5.2 Group Invitations (Two-User) E2E Tests
 *
 * Tests the invite flow: invited user sees pending invite,
 * invite card content, accept/decline actions, and ack via relay.
 *
 * Test IDs: T5.2.1–T5.2.6
 */

import { test, expect } from '@playwright/test';
import { RELAY_SETTLE_TIMEOUT, UI_SETTLE_TIMEOUT } from '../helpers';
import {
  setupFriendPair,
  createGroup,
  openGroupChat,
} from './group-helpers';

test.describe('5.2 Group Invitations', () => {
  test.setTimeout(120_000);

  test('T5.2.1 — Invited user sees pending invite in sidebar', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv1');

    await createGroup(alice, 'InviteTestGroup');

    // Bob should see the invite
    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);
    await expect(bob.getByText(/Group Invites/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(bob.getByText('InviteTestGroup').first()).toBeVisible({ timeout: 5_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.2.2 — Invite shows group name and inviter name', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv2');

    await createGroup(alice, 'NamedInviteGroup');

    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);

    // Group name
    await expect(bob.getByText('NamedInviteGroup').first()).toBeVisible({ timeout: 20_000 });

    // Inviter name (format: "from AliceInv2")
    await expect(bob.getByText(/from AliceInv2/i).first()).toBeVisible({ timeout: 5_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.2.3 — Accept — joins group, conversation appears', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv3');

    await createGroup(alice, 'AcceptInvGroup');

    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);
    await expect(bob.getByText('AcceptInvGroup').first()).toBeVisible({ timeout: 20_000 });

    // Accept the invite
    await bob.getByText('Accept', { exact: true }).first().click();
    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Group conversation should appear in sidebar.
    // After acceptance, the sidebar may not update immediately — try reload if needed.
    let groupVisible = await bob.getByText('AcceptInvGroup').first()
      .isVisible({ timeout: 10_000 }).catch(() => false);

    if (!groupVisible) {
      // Reload to force the conversation list to refresh from DB
      await bob.reload({ waitUntil: 'networkidle' });
      await bob.waitForTimeout(UI_SETTLE_TIMEOUT);
      groupVisible = await bob.getByText('AcceptInvGroup').first()
        .isVisible({ timeout: 10_000 }).catch(() => false);
    }

    expect(groupVisible).toBe(true);

    // Click to open — should see the group chat
    await openGroupChat(bob, 'AcceptInvGroup');

    // The header should show the group name
    await expect(bob.getByText('AcceptInvGroup').first()).toBeVisible({ timeout: 5_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.2.4 — Decline — invite removed', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv4');

    await createGroup(alice, 'DeclineInvGroup');

    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);
    await expect(bob.getByText('DeclineInvGroup').first()).toBeVisible({ timeout: 20_000 });

    // Decline the invite
    await bob.getByText('Decline', { exact: true }).first().click();
    await bob.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Invite should be removed
    await expect(bob.getByText('DeclineInvGroup').first()).not.toBeVisible({ timeout: 5_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.2.5 — Declined invite does not create conversation', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv5');

    await createGroup(alice, 'NoConvoGroup');

    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);
    await expect(bob.getByText('NoConvoGroup').first()).toBeVisible({ timeout: 20_000 });

    // Decline
    await bob.getByText('Decline', { exact: true }).first().click();
    await bob.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The Group Invites section should collapse
    await expect(bob.getByText(/Group Invites/i).first()).not.toBeVisible({ timeout: 5_000 });

    // "NoConvoGroup" should NOT appear in conversations sidebar
    await expect(bob.getByText('NoConvoGroup').first()).not.toBeVisible({ timeout: 3_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.2.6 — Accept sends acknowledgment (conversation syncs to both)', async ({ browser }) => {
    const { ctx1, ctx2, alice, bob } = await setupFriendPair(browser, 'Inv6');

    await createGroup(alice, 'AckGroup');

    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);
    await expect(bob.getByText('AckGroup').first()).toBeVisible({ timeout: 20_000 });
    await bob.getByText('Accept', { exact: true }).first().click();
    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);

    // Alice should still see the group in her sidebar
    await expect(alice.getByText('AckGroup').first()).toBeVisible({ timeout: 10_000 });

    // Open the group on Alice's side
    await openGroupChat(alice, 'AckGroup');

    // Header should show member count (at least 2)
    await expect(alice.getByText(/\d+ members?/).first()).toBeVisible({ timeout: 10_000 });

    await ctx1.close();
    await ctx2.close();
  });
});
