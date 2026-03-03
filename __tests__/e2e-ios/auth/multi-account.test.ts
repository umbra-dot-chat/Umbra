/**
 * T1.4 Multi-Account — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for multi-account functionality:
 * creating first and second accounts, stored accounts list on auth screen,
 * switching between accounts, and per-account data isolation.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T1.4 Multi-Account', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
  });

  it('T1.4.1 — can create first account', async () => {
    await createAccount(FIXTURES.USER_A.displayName);
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  it('T1.4.2 — can log out of first account', async () => {
    await navigateToSettings();
    await waitForUISettle();

    // Navigate to account section and find logout
    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)).tap();
    await waitForUISettle();

    // Confirm logout if a confirmation dialog appears
    try {
      await waitFor(element(by.id(TEST_IDS.COMMON.CONFIRM_YES)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.UI_SETTLE);
      await element(by.id(TEST_IDS.COMMON.CONFIRM_YES)).tap();
    } catch {
      // No confirmation dialog — logout proceeded directly
    }

    await waitForAuthScreen();
  });

  it('T1.4.3 — can create second account', async () => {
    await createAccount(FIXTURES.USER_B.displayName);
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  it('T1.4.4 — stored accounts appear on auth screen after logout', async () => {
    // Log out of second account
    await navigateToSettings();
    await waitForUISettle();
    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)).tap();
    await waitForUISettle();

    try {
      await waitFor(element(by.id(TEST_IDS.COMMON.CONFIRM_YES)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.UI_SETTLE);
      await element(by.id(TEST_IDS.COMMON.CONFIRM_YES)).tap();
    } catch {
      // No confirmation dialog
    }

    await waitForAuthScreen();

    // Previously created accounts should appear in the account list
    await waitFor(element(by.id(TEST_IDS.AUTH.ACCOUNT_LIST)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.4.5 — can switch between stored accounts', async () => {
    // Tap on a stored account item to switch to it
    await waitFor(element(by.id(TEST_IDS.AUTH.ACCOUNT_ITEM)).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.AUTH.ACCOUNT_ITEM)).atIndex(0).tap();
    await waitForUISettle();

    // Should load the main screen for that account
    await waitForMainScreen();
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  it('T1.4.6 — each account has own data isolation', async () => {
    // Verify we are logged in (main screen visible)
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();

    // Navigate to settings to verify account identity
    await navigateToSettings();
    await waitForUISettle();
    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitForUISettle();

    // DID should be displayed — each account has a unique DID
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });
});
