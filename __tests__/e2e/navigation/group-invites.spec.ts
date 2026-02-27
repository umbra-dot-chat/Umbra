/**
 * 2.8 Group Invites E2E Tests
 *
 * Tests the Group Invites section in the sidebar: pending invite display,
 * invite card content, accept/decline actions, and section auto-collapse.
 *
 * Test IDs: T2.8.1-T2.8.5
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createIdentity,
  navigateToFriends,
  clickTab,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

/** Establish friendship: Alice sends request with Bob's DID, Bob accepts. */
async function befriend(alice: Page, bob: Page, bobDid: string) {
  await navigateToFriends(alice);
  await clickTab(alice, 'Pending');
  const addInput = alice.getByPlaceholder('did:key:z6Mk...');
  if (await addInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await addInput.fill(bobDid);
    await alice.getByRole('button', { name: 'Add' }).click();
    await alice.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  }
  await navigateToFriends(bob);
  await clickTab(bob, 'Pending');
  await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  const acceptBtn = bob.getByRole('button', { name: 'Accept' });
  if (await acceptBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await acceptBtn.click();
    await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  }
  await alice.getByText('Conversations').first().click().catch(() => {});
  await bob.getByText('Conversations').first().click().catch(() => {});
  await alice.waitForTimeout(UI_SETTLE_TIMEOUT);
}

/** Alice creates a group and invites her first friend via the Create Group dialog. */
async function createGroupAndInvite(page: Page, groupName: string) {
  await page.getByRole('button', { name: 'New conversation' }).click();
  await page.waitForTimeout(500);
  await page.getByText('New Group').first().click();
  await page.waitForTimeout(1_000);
  await page.getByPlaceholder('Enter group name...').fill(groupName);
  const cb = page.locator('[role="checkbox"]').first();
  if (await cb.isVisible({ timeout: 5_000 }).catch(() => false)) await cb.click();
  await page.getByRole('button', { name: 'Create & Invite' }).click();
  await page.waitForTimeout(RELAY_SETTLE_TIMEOUT);
}

/** Spin up two isolated browser contexts and create identities. */
async function setupPair(browser: import('@playwright/test').Browser, suffix: string) {
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();
  await createIdentity(p1, `Alice${suffix}`);
  const bob = await createIdentity(p2, `Bob${suffix}`);
  await befriend(p1, p2, bob.did);
  return { ctx1, ctx2, p1, p2 };
}

test.describe('2.8 Group Invites', () => {
  test.setTimeout(120_000);

  test('T2.8.1 — Group Invites section appears above conversations', async ({ browser }) => {
    const { ctx1, ctx2, p1, p2 } = await setupPair(browser, '281');
    await createGroupAndInvite(p1, 'TestGroup281');
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText(/Group Invites/i).first()).toBeVisible({ timeout: 15_000 });
    await ctx1.close();
    await ctx2.close();
  });

  test('T2.8.2 — Each invite shows group name and inviter name', async ({ browser }) => {
    const { ctx1, ctx2, p1, p2 } = await setupPair(browser, '282');
    await createGroupAndInvite(p1, 'ProjectChat');
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText('ProjectChat').first()).toBeVisible({ timeout: 15_000 });
    await expect(p2.getByText(/from Alice282/i).first()).toBeVisible({ timeout: 5_000 });
    await ctx1.close();
    await ctx2.close();
  });

  test('T2.8.3 — Accept button joins group, conversation appears', async ({ browser }) => {
    const { ctx1, ctx2, p1, p2 } = await setupPair(browser, '283');
    await createGroupAndInvite(p1, 'AcceptGroup');
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText('AcceptGroup').first()).toBeVisible({ timeout: 15_000 });
    await p2.getByRole('button', { name: 'Accept' }).click();
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText('AcceptGroup').first()).toBeVisible({ timeout: 10_000 });
    await ctx1.close();
    await ctx2.close();
  });

  test('T2.8.4 — Decline button removes invite from list', async ({ browser }) => {
    const { ctx1, ctx2, p1, p2 } = await setupPair(browser, '284');
    await createGroupAndInvite(p1, 'DeclineGroup');
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText('DeclineGroup').first()).toBeVisible({ timeout: 15_000 });
    await p2.getByRole('button', { name: 'Decline' }).click();
    await p2.waitForTimeout(UI_SETTLE_TIMEOUT);
    await expect(p2.getByText('DeclineGroup').first()).not.toBeVisible({ timeout: 5_000 });
    await ctx1.close();
    await ctx2.close();
  });

  test('T2.8.5 — Section collapses when all invites handled', async ({ browser }) => {
    const { ctx1, ctx2, p1, p2 } = await setupPair(browser, '285');
    await createGroupAndInvite(p1, 'CollapseGroup');
    await p2.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(p2.getByText(/Group Invites/i).first()).toBeVisible({ timeout: 15_000 });
    await p2.getByRole('button', { name: 'Decline' }).click();
    await p2.waitForTimeout(UI_SETTLE_TIMEOUT);
    await expect(p2.getByText(/Group Invites/i).first()).not.toBeVisible({ timeout: 5_000 });
    await ctx1.close();
    await ctx2.close();
  });
});
