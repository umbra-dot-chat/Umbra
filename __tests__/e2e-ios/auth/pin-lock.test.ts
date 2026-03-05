/**
 * T1.3 PIN Lock — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for PIN lock functionality:
 * PIN setup during creation, PIN confirm must match, wrong confirm error,
 * skip PIN, lock screen on relaunch, correct/wrong PIN unlock,
 * and cooldown after failed attempts.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';

describe('T1.3 PIN Lock', () => {
  describe('PIN setup during account creation', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true, delete: true });
      await waitForAuthScreen();

      // Navigate to PIN setup step manually
      await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
      await waitForUISettle();

      // Step 0: Display name
      await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);
      await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText('PinTestUser');
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
    });

    it('T1.3.1 — PIN setup step is visible during creation', async () => {
      await waitFor(element(by.id(TEST_IDS.PIN.SETUP_TITLE)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);
      await expect(element(by.id(TEST_IDS.PIN.INPUT))).toExist();
    });

    it('T1.3.2 — skip PIN button is available', async () => {
      await expect(element(by.id(TEST_IDS.PIN.SKIP_BUTTON))).toExist();
    });

    it('T1.3.3 — entering PIN proceeds to confirm step', async () => {
      await enterPin(FIXTURES.USER_A.pin);
      await waitForUISettle();

      // Confirm title should appear
      await waitFor(element(by.id(TEST_IDS.PIN.CONFIRM_TITLE)))
        .toExist()
        .withTimeout(TIMEOUTS.NAVIGATION);
    });

    it('T1.3.4 — mismatched PIN confirm shows error', async () => {
      // Enter a different PIN for confirmation
      await enterPin(FIXTURES.MISMATCHED_PIN);
      await waitForUISettle();

      // Error text should appear
      await waitFor(element(by.id(TEST_IDS.PIN.ERROR_TEXT)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });
  });

  describe('PIN confirm matches and creation completes', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true, delete: true });
    });

    it('T1.3.5 — matching PIN confirm completes setup', async () => {
      await createAccountWithPin(FIXTURES.USER_A.displayName, FIXTURES.USER_A.pin);
      await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
    });
  });

  describe('Skip PIN flow', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true, delete: true });
    });

    it('T1.3.6 — skipping PIN proceeds past PIN step', async () => {
      await createAccount(FIXTURES.USER_B.displayName);
      await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
    });
  });

  describe('PIN lock screen on relaunch', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true, delete: true });
      await createAccountWithPin('PinLockUser', FIXTURES.USER_A.pin);
      // Terminate and relaunch to trigger PIN lock
      await device.terminateApp();
      await device.launchApp({ newInstance: true, delete: false });
    });

    it('T1.3.7 — PIN lock screen appears on relaunch', async () => {
      await waitFor(element(by.id(TEST_IDS.PIN.LOCK_SCREEN)))
        .toExist()
        .withTimeout(TIMEOUTS.APP_LAUNCH);
    });

    it('T1.3.8 — lock screen shows title and input', async () => {
      await expect(element(by.id(TEST_IDS.PIN.LOCK_TITLE))).toExist();
      await expect(element(by.id(TEST_IDS.PIN.LOCK_INPUT))).toExist();
    });

    it('T1.3.9 — correct PIN unlocks the app', async () => {
      await element(by.id(TEST_IDS.PIN.LOCK_INPUT)).tap();
      await waitForUISettle();
      await element(by.id(TEST_IDS.PIN.HIDDEN_INPUT)).typeText(FIXTURES.USER_A.pin);
      await waitForUISettle();

      await waitForMainScreen();
      await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
    });
  });

  describe('Wrong PIN and cooldown', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true, delete: true });
      await createAccountWithPin('CooldownUser', FIXTURES.USER_A.pin);
      await device.terminateApp();
      await device.launchApp({ newInstance: true, delete: false });
    });

    it('T1.3.10 — wrong PIN shows error message', async () => {
      await waitFor(element(by.id(TEST_IDS.PIN.LOCK_SCREEN)))
        .toExist()
        .withTimeout(TIMEOUTS.APP_LAUNCH);

      await element(by.id(TEST_IDS.PIN.LOCK_INPUT)).tap();
      await waitForUISettle();
      await element(by.id(TEST_IDS.PIN.HIDDEN_INPUT)).typeText(FIXTURES.MISMATCHED_PIN);
      await waitForUISettle();

      await waitFor(element(by.id(TEST_IDS.PIN.LOCK_ERROR)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });

    it('T1.3.11 — 5 failed attempts trigger cooldown', async () => {
      // Enter wrong PIN multiple times to trigger cooldown
      for (let i = 0; i < 4; i++) {
        await element(by.id(TEST_IDS.PIN.LOCK_INPUT)).tap();
        await waitForUISettle();
        await element(by.id(TEST_IDS.PIN.HIDDEN_INPUT)).typeText(FIXTURES.MISMATCHED_PIN);
        await waitForUISettle();
      }

      // After 5 total failed attempts, cooldown message should appear
      await waitFor(element(by.id(TEST_IDS.PIN.LOCK_COOLDOWN)))
        .toExist()
        .withTimeout(TIMEOUTS.INTERACTION);
    });
  });
});
