/**
 * T2.1 Navigation Rail — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the vertical nav rail:
 * rail visibility, home button, files button, settings button,
 * and avatar display.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFiles, navigateToFriends, navigateHome, closeSettings } from '../helpers/navigation';

describe('T2.1 Navigation Rail', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T2.1.1 — nav rail is visible on main screen', async () => {
    await waitFor(element(by.id(TEST_IDS.NAV.RAIL)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.1.2 — home button is present in nav rail', async () => {
    await expect(element(by.id(TEST_IDS.NAV.HOME))).toExist();
  });

  it('T2.1.3 — home button navigates to conversations view', async () => {
    // Navigate away first (to files)
    await navigateToFiles();

    // Then back to home
    await navigateHome();
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toExist();
  });

  it('T2.1.4 — files button is present and works', async () => {
    await expect(element(by.id(TEST_IDS.NAV.FILES))).toExist();

    await navigateToFiles();

    // Navigate back to home after verifying files navigation
    await navigateHome();
  });

  it('T2.1.5 — settings button opens settings dialog', async () => {
    await expect(element(by.id(TEST_IDS.NAV.SETTINGS))).toExist();

    await navigateToSettings();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toExist();

    // Close settings
    await closeSettings();
  });

  it('T2.1.6 — user avatar is displayed in nav rail', async () => {
    await expect(element(by.id(TEST_IDS.NAV.AVATAR))).toExist();
  });

  it('T2.1.7 — create community button is present', async () => {
    await expect(element(by.id(TEST_IDS.NAV.CREATE_COMMUNITY))).toExist();
  });

  it('T2.1.8 — notifications button is present', async () => {
    await waitFor(element(by.id(TEST_IDS.NAV.NOTIFICATIONS)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });
});
