/**
 * 13. Command Palette E2E Tests
 *
 * Tests the Command Palette (Cmd+K / Ctrl+K): opening, search,
 * navigation items, friend search, and keyboard navigation.
 *
 * Test IDs: T13.0.1–T13.0.11
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('13. Command Palette', () => {
  test.setTimeout(90_000);

  test('T13.0.1 — Ctrl+K opens the command palette', async ({ page }) => {
    await createIdentity(page, 'CmdPaletteUser');

    // Press Ctrl+K (or Cmd+K on macOS)
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should see the search input placeholder
    await expect(
      page.getByPlaceholder(/Search users, messages, or type a command/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.2 — Search input is focused automatically', async ({ page }) => {
    await createIdentity(page, 'CmdFocusUser');

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The search input should be focused — typing should work immediately
    await page.keyboard.type('test');

    // The input should contain what we typed
    const input = page.getByPlaceholder(/Search users, messages, or type a command/i).first();
    await expect(input).toHaveValue('test');
  });

  test('T13.0.3 — Type "friends" shows navigation option', async ({ page }) => {
    await createIdentity(page, 'CmdFriendsUser');

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    await page.keyboard.type('friends');
    await page.waitForTimeout(500);

    // Should see "Go to Friends" or similar navigation item
    await expect(
      page.getByText(/Go to Friends/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.5 — Type "settings" shows settings option', async ({ page }) => {
    await createIdentity(page, 'CmdSettingsUser');

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    await page.keyboard.type('settings');
    await page.waitForTimeout(500);

    // Should see "Open Settings" or similar
    await expect(
      page.getByText(/Open Settings/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.6 — Type "chat" shows conversation results', async ({ page }) => {
    await createIdentity(page, 'CmdChatUser');

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    await page.keyboard.type('chat');
    await page.waitForTimeout(500);

    // Should see "Go to Chat" or similar
    await expect(
      page.getByText(/Go to Chat/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.7 — Type "marketplace" shows marketplace option', async ({ page }) => {
    await createIdentity(page, 'CmdMktUser');

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    await page.keyboard.type('marketplace');
    await page.waitForTimeout(500);

    // Should see "Plugin Marketplace" or similar
    await expect(
      page.getByText(/Marketplace/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.8 — Escape closes the palette', async ({ page }) => {
    await createIdentity(page, 'CmdEscUser');

    // Open palette
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify it's open
    await expect(
      page.getByPlaceholder(/Search users, messages, or type a command/i).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Palette should be gone
    await expect(
      page.getByPlaceholder(/Search users, messages, or type a command/i).first(),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('T13.0.9 — Select item navigates to correct location', async ({ page }) => {
    await createIdentity(page, 'CmdNavUser');

    // Open palette
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Type "friends"
    await page.keyboard.type('friends');
    await page.waitForTimeout(500);

    // Select "Go to Friends" by pressing Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should have navigated to Friends page — look for "Or add by DID" or friend-related UI
    await expect(
      page.getByText(/add by DID|Friends|Pending|Online/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
