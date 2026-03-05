/**
 * T1.2 Account Import — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the account import flow:
 * import button visibility, seed phrase input, validation errors,
 * successful import, display name step, and main screen load.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin, activateElement } from '../helpers/auth';

describe('T1.2 Account Import', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await launchApp({ newInstance: true, delete: true });
    await waitForAuthScreen();
  });

  it('T1.2.1 — import button is visible on auth screen', async () => {
    await expect(element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON))).toExist();
  });

  it('T1.2.2 — tapping import opens the import flow', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.FLOW)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.2.3 — seed phrase input is visible in import flow', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.2.4 — seed phrase input accepts 24 words', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).typeText(FIXTURES.KNOWN_SEED_PHRASE);
    await waitForUISettle();

    // Seed next button should be available
    await expect(element(by.id(TEST_IDS.IMPORT.SEED_NEXT))).toExist();
  });

  it('T1.2.5 — invalid seed phrase shows error', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).typeText(FIXTURES.INVALID_SEED_PHRASE);
    await element(by.id(TEST_IDS.IMPORT.SEED_NEXT)).tap();
    await waitForUISettle();

    // Should show an error — either the error screen or inline error text
    await waitFor(element(by.text('Invalid recovery phrase')))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('T1.2.6 — valid seed phrase proceeds to display name step', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).typeText(FIXTURES.KNOWN_SEED_PHRASE);
    await element(by.id(TEST_IDS.IMPORT.SEED_NEXT)).tap();
    await waitForUISettle();

    // Display name input should appear
    await waitFor(element(by.id(TEST_IDS.IMPORT.NAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.CORE_INIT);
  });

  it('T1.2.7 — can enter display name after seed phrase', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).typeText(FIXTURES.KNOWN_SEED_PHRASE);
    await element(by.id(TEST_IDS.IMPORT.SEED_NEXT)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.NAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.CORE_INIT);

    await element(by.id(TEST_IDS.IMPORT.NAME_INPUT)).typeText(FIXTURES.USER_A.displayName);
    await expect(element(by.id(TEST_IDS.IMPORT.NAME_NEXT))).toExist();
  });

  it('T1.2.8 — full import flow loads main screen', async () => {
    await importAccount(FIXTURES.KNOWN_SEED_PHRASE, FIXTURES.USER_A.displayName);
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  it('T1.2.9 — back button on import flow returns to auth screen', async () => {
    await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.IMPORT.FLOW)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.IMPORT.BACK_BUTTON)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.AUTH.SCREEN)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });
});
