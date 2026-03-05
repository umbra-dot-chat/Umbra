/**
 * T1.6 Logout — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the logout flow:
 * navigate to settings, find logout button, confirm logout returns
 * to auth screen, and data is cleared after logout.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, closeSettings, tapSettingsNavItem } from '../helpers/navigation';

describe('T1.6 Logout', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T1.6.1 — can navigate to settings', async () => {
    await navigateToSettings();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toExist();
  });

  it('T1.6.2 — logout button is visible in account settings', async () => {
    await tapSettingsNavItem(TEST_IDS.SETTINGS.NAV_ACCOUNT);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.6.3 — tapping logout triggers confirmation', async () => {
    await element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)).performAccessibilityAction('activate');
    await waitForUISettle();

    // Confirmation dialog should appear
    await waitFor(element(by.id(TEST_IDS.COMMON.CONFIRM_DIALOG)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('T1.6.4 — confirming logout returns to auth screen', async () => {
    // Confirm the logout
    await element(by.id(TEST_IDS.COMMON.CONFIRM_YES)).tap();
    await waitForUISettle();

    // Should return to the auth screen
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.SCREEN))).toExist();
  });

  it('T1.6.5 — data cleared after logout: relaunching shows auth screen', async () => {
    // Relaunch to verify state is clean
    await device.terminateApp();
    await device.launchApp({ newInstance: true, delete: false });

    // Should show the auth screen (possibly with stored accounts list)
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.SCREEN))).toExist();
  });

  it('T1.6.6 — cancel logout stays in settings', async () => {
    // Create a fresh account to test cancel
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);

    await navigateToSettings();
    await tapSettingsNavItem(TEST_IDS.SETTINGS.NAV_ACCOUNT);
    await waitForUISettle();

    await element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON)).performAccessibilityAction('activate');
    await waitForUISettle();

    // Cancel the logout
    await waitFor(element(by.id(TEST_IDS.COMMON.CONFIRM_NO)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.id(TEST_IDS.COMMON.CONFIRM_NO)).tap();
    await waitForUISettle();

    // Should still be in settings
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toExist();
  });
});
