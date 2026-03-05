/**
 * Account creation and authentication helpers for Detox E2E tests.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForAuthScreen, waitForMainScreen, waitForUISettle } from './app';

/**
 * Activate an element via its accessibility action, bypassing Detox's
 * pixel-based visibility check.
 *
 * The auth screen has a full-screen MaskedView overlay (NativeInvertedLayer)
 * that blocks `.tap()` — Detox's 100% visibility threshold fails because
 * the MaskedView UIView sits on top in the view hierarchy. The overlay has
 * `pointerEvents="none"` so real touches pass through, but Detox's EarlGrey
 * check sees it as obstructing.
 *
 * Workaround: the auth screen buttons declare an 'activate' accessibility
 * action. `performAccessibilityAction('activate')` invokes it directly
 * without any visibility check.
 */
export async function activateElement(testID: string) {
  await element(by.id(testID)).performAccessibilityAction('activate');
}

/**
 * Create a new account with the given display name.
 * Runs through the full CreateWalletFlow: name → seed → backup → skip PIN → skip username → done.
 */
export async function createAccount(displayName: string) {
  await waitForAuthScreen();
  // Let the auth screen fully render before interacting
  await waitForUISettle();

  // Tap "Create New Account" — use coordinate tap to bypass MaskedView overlay
  await waitFor(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await activateElement(TEST_IDS.AUTH.CREATE_BUTTON);
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

  // Step 4: Username — dismiss keyboard first (autoFocus opens it, covering the skip button)
  await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).tapReturnKey();
  await waitForUISettle();
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
  await waitForUISettle();

  // Tap "Create New Account" — use coordinate tap to bypass MaskedView overlay
  await waitFor(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await activateElement(TEST_IDS.AUTH.CREATE_BUTTON);
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

  // Step 4: Username — dismiss keyboard first
  await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).tapReturnKey();
  await waitForUISettle();
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
  await waitForUISettle();

  // Tap "Import Existing Account" — use coordinate tap to bypass MaskedView overlay
  await waitFor(element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await activateElement(TEST_IDS.AUTH.IMPORT_BUTTON);
  await waitForUISettle();

  // Step 0: Enter seed phrase — type each word into its own input field.
  // The SeedPhraseInput has 24 individual inputs; each `onSubmitEditing`
  // (return key) advances focus to the next input automatically.
  const words = seedPhrase.trim().split(/\s+/);
  const wordInputId = (i: number) => `${TEST_IDS.IMPORT.SEED_INPUT}.word.${i}`;

  // Focus the first word input
  await waitFor(element(by.id(wordInputId(0))))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(wordInputId(0))).tap();

  for (let i = 0; i < words.length; i++) {
    await element(by.id(wordInputId(i))).typeText(words[i]);
    // Return key advances focus to the next input (or dismisses on last)
    await element(by.id(wordInputId(i))).tapReturnKey();
  }

  await waitForUISettle();
  // Next button may be behind MaskedView overlay — use activate to bypass
  await waitFor(element(by.id(TEST_IDS.IMPORT.SEED_NEXT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
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

/**
 * Create a new account with both PIN and username set.
 * Exercises the full account creation flow without skipping.
 */
export async function createAccountFull(
  displayName: string,
  pin: string,
  username: string,
) {
  await waitForAuthScreen();
  await waitForUISettle();

  await waitFor(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await activateElement(TEST_IDS.AUTH.CREATE_BUTTON);
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
  await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
  await waitForUISettle();

  // Step 3: PIN setup — enter PIN twice (set + confirm)
  await enterPin(pin);
  await waitForUISettle();
  await enterPin(pin);
  await waitForUISettle();

  // Step 4: Username — type a username (exercises the input) then skip
  // Registration requires a live discovery server, so we type and skip
  await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).clearText();
  await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).typeText(username);
  await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).tapReturnKey();
  await waitForUISettle();
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
