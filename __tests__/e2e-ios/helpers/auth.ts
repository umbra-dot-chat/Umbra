/**
 * Account creation and authentication helpers for Detox E2E tests.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForAuthScreen, waitForMainScreen, waitForUISettle } from './app';

/**
 * Create a new account with the given display name.
 * Runs through the full CreateWalletFlow: name → seed → backup → skip PIN → skip username → done.
 */
export async function createAccount(displayName: string) {
  await waitForAuthScreen();
  // Let the auth screen fully render before interacting
  await waitForUISettle();

  // Tap "Create New Account"
  await waitFor(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
  await waitForUISettle();

  // Step 0: Enter display name
  await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(displayName);
  await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).tapReturnKey();
  await waitFor(element(by.id(TEST_IDS.CREATE.NAME_NEXT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
  await waitForUISettle();

  // Step 1: Seed phrase — just continue
  await waitFor(element(by.id(TEST_IDS.CREATE.SEED_NEXT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
  await waitForUISettle();

  // Step 2: Backup confirmation — check the box and continue
  await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
  await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
  await waitForUISettle();

  // Step 3: PIN setup — skip for now
  await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
  await waitForUISettle();

  // Step 4: Username — skip
  await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)).tap();
  await waitForUISettle();

  // Step 5: Success — tap done
  await waitFor(element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)).tap();

  // Wait for main screen to load
  await waitForMainScreen();
}

/**
 * Create a new account with PIN protection.
 */
export async function createAccountWithPin(displayName: string, pin: string) {
  await waitForAuthScreen();

  // Tap "Create New Account"
  await element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)).tap();
  await waitForUISettle();

  // Step 0: Enter display name
  await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(displayName);
  await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).tapReturnKey();
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

  // Step 3: PIN setup — enter PIN twice
  await enterPin(pin);
  await waitForUISettle();
  await enterPin(pin); // Confirm
  await waitForUISettle();

  // Step 4: Username — skip
  await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)).tap();
  await waitForUISettle();

  // Step 5: Success — tap done
  await waitFor(element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)).tap();

  await waitForMainScreen();
}

/**
 * Import an account using a seed phrase.
 */
export async function importAccount(seedPhrase: string, displayName: string) {
  await waitForAuthScreen();

  // Tap "Import Existing Account"
  await element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON)).tap();
  await waitForUISettle();

  // Step 0: Enter seed phrase
  await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).typeText(seedPhrase);
  await element(by.id(TEST_IDS.IMPORT.SEED_INPUT)).tapReturnKey();
  await element(by.id(TEST_IDS.IMPORT.SEED_NEXT)).tap();
  await waitForUISettle();

  // Step 1: Enter display name
  await waitFor(element(by.id(TEST_IDS.IMPORT.NAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.IMPORT.NAME_INPUT)).typeText(displayName);
  await element(by.id(TEST_IDS.IMPORT.NAME_INPUT)).tapReturnKey();
  await element(by.id(TEST_IDS.IMPORT.NAME_NEXT)).tap();
  await waitForUISettle();

  // Step 2: Skip PIN
  await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
  await waitForUISettle();

  // Step 3: Wait for success and tap done
  await waitFor(element(by.id(TEST_IDS.IMPORT.DONE_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.CORE_INIT);
  await element(by.id(TEST_IDS.IMPORT.DONE_BUTTON)).tap();

  await waitForMainScreen();
}

/**
 * Enter a PIN code by tapping the PIN input and typing digits.
 */
export async function enterPin(pin: string) {
  // Tap the visible cells to focus the hidden input
  await element(by.id(TEST_IDS.PIN.INPUT)).tap();
  await waitForUISettle();
  // Type the PIN digits into the hidden input
  await element(by.id(TEST_IDS.PIN.HIDDEN_INPUT)).typeText(pin);
}

/**
 * Skip PIN setup by tapping "Skip for now".
 */
export async function skipPin() {
  await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
}
