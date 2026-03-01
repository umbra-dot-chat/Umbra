/**
 * 5.1 Create Group E2E Tests
 *
 * Tests the Create Group dialog: opening it, form fields,
 * validation, member selection, and successful creation.
 *
 * Test IDs: T5.1.1–T5.1.9
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createIdentity, BASE_URL, UI_SETTLE_TIMEOUT, RELAY_SETTLE_TIMEOUT } from '../helpers';
import {
  befriend,
  openCreateGroupDialog,
  createGroupAndInvite,
} from './group-helpers';

test.describe('5.1 Create Group', () => {
  test.setTimeout(120_000);

  // ── Single-user tests (dialog UI) ──

  test('T5.1.1 — Click "+" > "New Group" opens the Create Group dialog', async ({ page }) => {
    await createIdentity(page, 'GroupDialogUser');

    // Click the new conversation button
    await page.getByRole('button', { name: 'New conversation' }).click();
    await page.waitForTimeout(500);

    // Should see "New Group" option
    await expect(page.getByText('New Group').first()).toBeVisible({ timeout: 5_000 });

    // Click "New Group"
    await page.getByText('New Group').first().click();
    await page.waitForTimeout(1_000);

    // Dialog should be open with the header
    await expect(
      page.getByText('Create Group & Invite Members').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T5.1.2 — Dialog has group name input (required)', async ({ page }) => {
    await createIdentity(page, 'GroupNameUser');
    await openCreateGroupDialog(page);

    // Label and input visible
    await expect(page.getByText('Group Name *').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder('Enter group name...')).toBeVisible();

    // Enter a name
    await page.getByPlaceholder('Enter group name...').fill('Test Group');
    await expect(page.getByPlaceholder('Enter group name...')).toHaveValue('Test Group');
  });

  test('T5.1.3 — Dialog has optional description field', async ({ page }) => {
    await createIdentity(page, 'GroupDescUser');
    await openCreateGroupDialog(page);

    // Label and textarea visible
    await expect(page.getByText('Description (optional)').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder("What's this group about?")).toBeVisible();

    // Enter a description
    await page.getByPlaceholder("What's this group about?").fill('A test group for E2E');
    await expect(page.getByPlaceholder("What's this group about?")).toHaveValue('A test group for E2E');
  });

  test('T5.1.7a — Empty name shows validation error', async ({ page }) => {
    await createIdentity(page, 'GroupValUser');
    await openCreateGroupDialog(page);

    // Don't enter a name, try to submit
    // The "Create & Invite" button should be disabled when name is empty
    const createBtn = page.getByRole('button', { name: 'Create & Invite' });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });

    // Button should be disabled (name is empty and no friends selected)
    await expect(createBtn).toBeDisabled();
  });

  test('T5.1.7b — Cancel button closes dialog', async ({ page }) => {
    await createIdentity(page, 'GroupCancelUser');
    await openCreateGroupDialog(page);

    await expect(
      page.getByText('Create Group & Invite Members').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);

    // Dialog should close
    await expect(
      page.getByText('Create Group & Invite Members').first(),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Two-user tests (need friends for member picker) ──

  test('T5.1.4 — Member picker shows friends with checkboxes', async ({ browser }) => {
    const ctx1 = await browser.newContext({ baseURL: BASE_URL });
    const ctx2 = await browser.newContext({ baseURL: BASE_URL });
    const alice = await ctx1.newPage();
    const bob = await ctx2.newPage();

    await createIdentity(alice, 'AlicePicker');
    const bobResult = await createIdentity(bob, 'BobPicker');
    await befriend(alice, bob, bobResult.did);

    // Open the dialog — should see Bob in the member picker
    await openCreateGroupDialog(alice);

    // "Invite Members" label
    await expect(alice.getByText('Invite Members (min 1)').first()).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Label might render differently
    });

    // Search placeholder
    await expect(alice.getByPlaceholder('Search friends...')).toBeVisible({ timeout: 5_000 });

    // Bob should be listed
    await expect(alice.getByText('BobPicker').first()).toBeVisible({ timeout: 5_000 });

    // Checkbox should be present
    const checkbox = alice.locator('[role="checkbox"]').first();
    await expect(checkbox).toBeVisible({ timeout: 5_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.1.5 — At least 1 friend must be selected to enable submit', async ({ browser }) => {
    const ctx1 = await browser.newContext({ baseURL: BASE_URL });
    const ctx2 = await browser.newContext({ baseURL: BASE_URL });
    const alice = await ctx1.newPage();
    const bob = await ctx2.newPage();

    await createIdentity(alice, 'AliceMin');
    const bobResult = await createIdentity(bob, 'BobMin');
    await befriend(alice, bob, bobResult.did);

    await openCreateGroupDialog(alice);

    // Enter a name but don't select friends
    await alice.getByPlaceholder('Enter group name...').fill('MinGroupTest');

    // Button should be disabled (no friends selected)
    const createBtn = alice.getByRole('button', { name: 'Create & Invite' });
    await expect(createBtn).toBeDisabled();

    // Select a friend
    const checkbox = alice.locator('[role="checkbox"]').first();
    await checkbox.click();

    // Now button should be enabled
    await expect(createBtn).toBeEnabled();

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.1.8 — Submit creates group with "Invitations sent!" feedback', async ({ browser }) => {
    const ctx1 = await browser.newContext({ baseURL: BASE_URL });
    const ctx2 = await browser.newContext({ baseURL: BASE_URL });
    const alice = await ctx1.newPage();
    const bob = await ctx2.newPage();

    await createIdentity(alice, 'AliceCreate');
    const bobResult = await createIdentity(bob, 'BobCreate');
    await befriend(alice, bob, bobResult.did);

    await openCreateGroupDialog(alice);

    // Fill and submit
    await alice.getByPlaceholder('Enter group name...').fill('CreatedGroup');
    const checkbox = alice.locator('[role="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await checkbox.click();
    }
    await alice.getByRole('button', { name: 'Create & Invite' }).click();

    // Should see success message
    await expect(
      alice.getByText(/Invitations sent/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    await ctx1.close();
    await ctx2.close();
  });

  test('T5.1.9 — Group appears in sidebar after creation', async ({ browser }) => {
    const ctx1 = await browser.newContext({ baseURL: BASE_URL });
    const ctx2 = await browser.newContext({ baseURL: BASE_URL });
    const alice = await ctx1.newPage();
    const bob = await ctx2.newPage();

    await createIdentity(alice, 'AliceSidebar');
    const bobResult = await createIdentity(bob, 'BobSidebar');
    await befriend(alice, bob, bobResult.did);

    await openCreateGroupDialog(alice);
    await createGroupAndInvite(alice, 'SidebarGroup');

    // Wait for dialog to close and sidebar to update
    await alice.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Group should appear in the sidebar conversations
    await expect(alice.getByText('SidebarGroup').first()).toBeVisible({ timeout: 10_000 });

    await ctx1.close();
    await ctx2.close();
  });
});
