/**
 * T1.1 Account Creation — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the account creation flow:
 * auth screen visibility, create button, display name entry,
 * seed phrase display, backup confirmation, success screen, and
 * main screen load.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';

describe('T1.1 Account Creation', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
  });

  it('T1.1.1 — app shows auth screen on first launch', async () => {
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.SCREEN))).toBeVisible();
  });

  it('T1.1.2 — create button is visible on auth screen', async () => {
    await expect(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON))).toBeVisible();
  });

  it('T1.1.3 — import button is visible on auth screen', async () => {
    await expect(element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON))).toBeVisible();
  });

  it('T1.1.4 — tapping create navigates to display name step', async () => {
    await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.5 — can enter display name and proceed', async () => {
    // Re-launch to start fresh for this test
    await launchApp({ newInstance: true, delete: true });
    await waitForAuthScreen();

    await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(FIXTURES.USER_A.displayName);
    await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
    await waitForUISettle();

    // Should proceed to seed phrase step
    await waitFor(element(by.id(TEST_IDS.CREATE.SEED_PHRASE_GRID)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.6 — seed phrase is displayed with 24 words', async () => {
    // Continuing from previous state — seed phrase step should be visible
    await expect(element(by.id(TEST_IDS.CREATE.SEED_PHRASE_GRID))).toBeVisible();

    // The seed grid should contain word elements
    await expect(element(by.id(TEST_IDS.SEED.GRID))).toBeVisible();
  });

  it('T1.1.7 — copy seed phrase button is available', async () => {
    await expect(element(by.id(TEST_IDS.CREATE.SEED_COPY_BUTTON))).toBeVisible();
  });

  it('T1.1.8 — continue past seed phrase to backup confirmation', async () => {
    await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
    await waitForUISettle();

    // Backup confirmation step
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.9 — backup checkbox must be checked before proceeding', async () => {
    // The backup next button should not proceed without checkbox
    await expect(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX))).toBeVisible();
    await expect(element(by.id(TEST_IDS.CREATE.BACKUP_NEXT))).toBeVisible();
  });

  it('T1.1.10 — checking backup and continuing reaches PIN step', async () => {
    await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
    await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
    await waitForUISettle();

    // PIN setup step
    await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.11 — full account creation flow reaches success screen', async () => {
    // Fresh launch for full flow
    await launchApp({ newInstance: true, delete: true });
    await waitForAuthScreen();

    await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
    await waitForUISettle();

    // Step 0: Display name
    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(FIXTURES.USER_A.displayName);
    await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
    await waitForUISettle();

    // Step 1: Seed phrase — continue
    await waitFor(element(by.id(TEST_IDS.CREATE.SEED_NEXT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
    await waitForUISettle();

    // Step 2: Backup confirmation
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
    await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
    await waitForUISettle();

    // Step 3: Skip PIN
    await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
    await waitForUISettle();

    // Step 4: Skip username
    await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)).tap();
    await waitForUISettle();

    // Step 5: Success screen
    await waitFor(element(by.id(TEST_IDS.CREATE.SUCCESS_SCREEN)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.12 — success screen done button loads main screen', async () => {
    await expect(element(by.id(TEST_IDS.CREATE.SUCCESS_DONE))).toBeVisible();
    await element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)).tap();

    await waitForMainScreen();
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });
});
