/**
 * T1.7 Discovery — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for discovery / identity information:
 * DID is displayed in settings, DID format is valid (did:key:...),
 * and connection info is available.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, navigateToFriends, navigateHome, openConversation } from '../helpers/navigation';

describe('T1.7 Discovery', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T1.7.1 — DID is displayed in account settings', async () => {
    await navigateToSettings();
    await waitForUISettle();

    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.7.2 — DID format is valid (did:key:...)', async () => {
    // The DID display element should contain text matching the did:key: prefix
    await expect(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY))).toBeVisible();

    // Verify the DID text matches expected format
    // Detox supports text matching — check for the did:key: prefix
    await waitFor(element(by.text(/^did:key:z/)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('T1.7.3 — connection/network info is available in settings', async () => {
    // Navigate to network settings section
    await element(by.id(TEST_IDS.SETTINGS.NAV_NETWORK)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);

    // Relay status should be displayed
    await expect(element(by.id(TEST_IDS.SETTINGS.RELAY_STATUS))).toBeVisible();
  });

  it('T1.7.4 — identity card is visible in account settings', async () => {
    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.SETTINGS.IDENTITY_CARD)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });
});
