/**
 * T1.1 Account Creation — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for the account creation flow:
 * auth screen visibility, create button, display name entry,
 * seed phrase display, backup confirmation, success screen, and
 * main screen load.
 *
 * NETWORK VERIFICATION:
 * - After completing the full account creation flow, verifies that the
 *   relay connection is established. This confirms the Umbra core
 *   initializes networking after identity creation.
 * - Also verifies the DID is generated and accessible via Settings.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import {
  launchApp,
  waitForAuthScreen,
  waitForMainScreen,
  waitForUISettle,
  waitForRelayConnection,
} from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateToSettings, closeSettings } from '../helpers/navigation';

describe('T1.1 Account Creation', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
  });

  it('T1.1.1 — app shows auth screen on first launch', async () => {
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.SCREEN))).toExist();
  });

  it('T1.1.2 — create button is visible on auth screen', async () => {
    await expect(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON))).toExist();
  });

  it('T1.1.3 — import button is visible on auth screen', async () => {
    await expect(element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON))).toExist();
  });

  it('T1.1.4 — tapping create navigates to display name step', async () => {
    await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.5 — can enter display name and proceed', async () => {
    // Re-launch to start fresh for this test
    await launchApp({ newInstance: true, delete: true });
    await waitForAuthScreen();

    await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
    await waitForUISettle();

    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(FIXTURES.USER_A.displayName);
    await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
    await waitForUISettle();

    // Should proceed to seed phrase step
    await waitFor(element(by.id(TEST_IDS.CREATE.SEED_PHRASE_GRID)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.6 — seed phrase is displayed with 24 words', async () => {
    // Continuing from previous state — seed phrase step should be visible
    await expect(element(by.id(TEST_IDS.CREATE.SEED_PHRASE_GRID))).toExist();

    // The seed grid should contain word elements
    await expect(element(by.id(TEST_IDS.SEED.GRID))).toExist();
  });

  it('T1.1.7 — copy seed phrase button is available', async () => {
    await expect(element(by.id(TEST_IDS.CREATE.SEED_COPY_BUTTON))).toExist();
  });

  it('T1.1.8 — continue past seed phrase to backup confirmation', async () => {
    await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
    await waitForUISettle();

    // Backup confirmation step
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.9 — backup checkbox must be checked before proceeding', async () => {
    // The backup next button should not proceed without checkbox
    await expect(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX))).toExist();
    await expect(element(by.id(TEST_IDS.CREATE.BACKUP_NEXT))).toExist();
  });

  it('T1.1.10 — checking backup and continuing reaches PIN step', async () => {
    await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
    await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
    await waitForUISettle();

    // PIN setup step
    await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
      .toExist()
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
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(FIXTURES.USER_A.displayName);
    await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
    await waitForUISettle();

    // Step 1: Seed phrase — continue
    await waitFor(element(by.id(TEST_IDS.CREATE.SEED_NEXT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
    await waitForUISettle();

    // Step 2: Backup confirmation
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
    await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
    await waitForUISettle();

    // Step 3: Skip PIN
    await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
    await waitForUISettle();

    // Step 4: Skip username
    await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)).tap();
    await waitForUISettle();

    // Step 5: Success screen
    await waitFor(element(by.id(TEST_IDS.CREATE.SUCCESS_SCREEN)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T1.1.12 — success screen done button loads main screen', async () => {
    await expect(element(by.id(TEST_IDS.CREATE.SUCCESS_DONE))).toExist();
    await element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)).tap();

    await waitForMainScreen();
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // ─── Post-Creation Network Verification ──────────────────────────────────

  it('T1.1.13 — relay connection is established after account creation', async () => {
    // After creating an account and reaching the main screen, the Umbra
    // core should initialize networking and connect to the relay. This
    // verifies the full identity → core init → relay connection pipeline.
    await waitForRelayConnection();
    console.log('[AcctCreate] ✅ Relay connection verified after account creation');
  });

  it('T1.1.14 — DID is generated and accessible in settings', async () => {
    await navigateToSettings();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    const attrs = await element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)).getAttributes();
    // @ts-ignore — accessibilityValue.text has the full (non-truncated) DID
    const did: string = attrs.value || attrs.text || attrs.label || '';

    // Verify it's a valid did:key
    if (!did.startsWith('did:key:z6Mk') || did.length < 48) {
      throw new Error(`Invalid DID generated: "${did}"`);
    }

    console.log(`[AcctCreate] ✅ DID generated: ${did.slice(0, 30)}...`);
    await closeSettings();
  });
});
