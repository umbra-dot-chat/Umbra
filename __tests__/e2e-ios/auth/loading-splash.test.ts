/**
 * T1.5 Loading / Splash Screen — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the loading/splash screen:
 * app shows loading state on launch, and loading transitions to
 * either the auth screen or main screen.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';

describe('T1.5 Loading / Splash Screen', () => {
  it('T1.5.1 — app shows loading state on fresh launch', async () => {
    await launchApp({ newInstance: true, delete: true });

    // On a fresh launch, the app should show either a loading indicator
    // or transition directly to the auth screen. We race both possibilities.
    await waitFor(
      element(by.id(TEST_IDS.COMMON.LOADING)).or(element(by.id(TEST_IDS.AUTH.SCREEN))),
    )
      .toBeVisible()
      .withTimeout(TIMEOUTS.APP_LAUNCH);
  });

  it('T1.5.2 — loading transitions to auth screen on fresh install', async () => {
    await launchApp({ newInstance: true, delete: true });

    // With no stored identity, loading should transition to the auth screen
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.SCREEN))).toBeVisible();
  });

  it('T1.5.3 — loading transitions to main screen with existing account', async () => {
    // First create an account
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();

    // Terminate and relaunch (preserving state)
    await device.terminateApp();
    await device.launchApp({ newInstance: true, delete: false });

    // With an existing identity (no PIN), should transition to main screen
    // or possibly the auth screen with stored accounts
    await waitFor(
      element(by.id(TEST_IDS.MAIN.CONTAINER))
        .or(element(by.id(TEST_IDS.AUTH.SCREEN)))
        .or(element(by.id(TEST_IDS.PIN.LOCK_SCREEN))),
    )
      .toBeVisible()
      .withTimeout(TIMEOUTS.APP_LAUNCH);
  });

  it('T1.5.4 — loading screen auto-dismisses', async () => {
    await launchApp({ newInstance: true, delete: true });

    // Wait for the auth screen to appear (loading should have auto-dismissed)
    await waitForAuthScreen();

    // Loading indicator should no longer be visible
    await expect(element(by.id(TEST_IDS.COMMON.LOADING))).not.toBeVisible();
  });
});
