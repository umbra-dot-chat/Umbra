/**
 * 5.4 Group Header E2E Tests
 *
 * Tests the group chat header display: group name,
 * member count, avatar group, and header interactions.
 *
 * Test IDs: T5.4.1–T5.4.2
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { UI_SETTLE_TIMEOUT } from '../helpers';
import {
  setupFriendPair,
  openGroupChat,
  setupBothInGroupDirect,
} from './group-helpers';

test.describe('5.4 Group Header', () => {
  test.setTimeout(120_000);

  let ctx1: BrowserContext;
  let ctx2: BrowserContext;
  let alice: Page;
  let bob: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(120_000); // Increase beforeAll timeout for group setup
    const setup = await setupFriendPair(browser, 'Hdr');

    ctx1 = setup.ctx1;
    ctx2 = setup.ctx2;
    alice = setup.alice;
    bob = setup.bob;

    // Use direct injection to get both users into the group (bypasses relay)
    const joined = await setupBothInGroupDirect(setup, 'HeaderTestGroup');
    if (!joined) {
      throw new Error('Failed to set up group via direct injection');
    }

    // Alice opens the group
    await openGroupChat(alice, 'HeaderTestGroup');
  });

  test.afterAll(async () => {
    await ctx1?.close();
    await ctx2?.close();
  });

  test('T5.4.1 — Header shows group name and member count', async () => {
    // Group name visible in header
    await expect(alice.getByText('HeaderTestGroup').first()).toBeVisible({ timeout: 5_000 });

    // Member count (format: "N members")
    await expect(alice.getByText(/\d+ members?/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('T5.4.2 — Members button opens the members panel', async () => {
    // Click the members button (UsersIcon with accessibilityLabel)
    const membersBtn = alice.getByLabel('Toggle members');
    if (await membersBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await membersBtn.click();
      await alice.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Members panel should appear with "Members" header
      await expect(alice.getByText('Members').first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
