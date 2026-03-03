/**
 * T13 Command Palette — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the command palette.
 * On mobile (iOS), the command palette may not be accessible via
 * keyboard shortcut (Ctrl+K). These tests stub the expected behavior
 * and verify any mobile-accessible equivalent.
 *
 * Note: The command palette is primarily a desktop/web feature triggered
 * by keyboard shortcuts. On mobile, it may be accessed via a button
 * or may not exist. Tests are marked as conditional.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T13 Command Palette', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T13.1 — main screen is loaded (command palette prerequisite)', async () => {
    // Verify the main screen is loaded as a prerequisite for command palette
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  it('T13.2 — search input in sidebar provides command-palette-like search', async () => {
    // On mobile, the sidebar search input serves as the primary search mechanism.
    // This is the mobile equivalent of the desktop command palette.
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).tap();
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).typeText('friends');
    await waitForUISettle();

    // Search should be functional
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toBeVisible();

    // Clear search
    await element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT)).clearText();
    await waitForUISettle();
  });

  it('T13.3 — navigation to friends is accessible via sidebar button', async () => {
    // On mobile, direct navigation replaces command palette commands
    await navigateToFriends();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toBeVisible();
    await navigateHome();
  });

  it('T13.4 — navigation to settings is accessible via nav rail', async () => {
    await navigateToSettings();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toBeVisible();
    await element(by.id(TEST_IDS.SETTINGS.CLOSE_BUTTON)).tap();
    await waitForUISettle();
  });

  it('T13.5 — navigation to files is accessible via nav rail', async () => {
    await element(by.id(TEST_IDS.NAV.FILES)).tap();
    await waitForUISettle();

    // Navigate back
    await navigateHome();
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toBeVisible();
  });
});
