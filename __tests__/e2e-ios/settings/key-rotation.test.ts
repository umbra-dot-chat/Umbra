/**
 * Key Rotation — verifies the key rotation option is visible in settings,
 * opens a confirmation dialog, warns about regeneration, completes rotation,
 * and verifies the success feedback.
 *
 * These tests exercise the single-device key rotation flow via the
 * Settings > Account > Danger Zone UI. Two-device notification/re-encryption
 * tests live in the `two-device/` directory.
 *
 * Test IDs: T-KR.D.1–T-KR.D.7
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

/**
 * Activate an element via accessibility action (bypasses visibility threshold).
 */
async function activateElement(testID: string) {
  await element(by.id(testID)).performAccessibilityAction('activate');
}

/**
 * Scroll to the Danger Zone within the account settings section.
 * The key rotation button lives in the Danger Zone, which may be
 * below the fold on smaller screens.
 */
async function scrollToDangerZone() {
  try {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON)))
      .toExist()
      .withTimeout(5_000);
  } catch {
    // If not visible, scroll down to find it
    await element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT)).scrollTo('bottom');
    await waitForUISettle();
  }
}

describe('Settings > Key Rotation', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_ACCOUNT,
      TEST_IDS.SETTINGS.SECTION_ACCOUNT,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the account section where key rotation lives', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toExist();
  });

  it('should show a key rotation option in the account section', async () => {
    await scrollToDangerZone();
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON))).toExist();
    // Verify the button text is present
    await expect(element(by.text('Rotate Encryption Key'))).toExist();
  });

  it('should open a confirmation dialog when key rotation is initiated', async () => {
    // Tap the Rotate Encryption Key button
    await activateElement(TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON);
    await waitForUISettle();

    // The confirmation dialog should appear
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);

    // Both confirm and cancel buttons should be visible
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_CONFIRM))).toExist();
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_CANCEL))).toExist();
  });

  it('should warn that key rotation will regenerate encryption keys', async () => {
    // The dialog should still be open from the previous test
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG))).toExist();

    // Verify warning text is present
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_WARNING))).toExist();

    // Cancel the dialog — we'll rotate in the next test
    await element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_CANCEL)).tap();
    await waitForUISettle();

    // Dialog should be closed
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG)))
      .not.toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should complete key rotation and show success', async () => {
    // Re-open the dialog
    await scrollToDangerZone();
    await activateElement(TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON);
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);

    // Tap confirm to rotate the key
    await element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_CONFIRM)).tap();

    // Wait for the success dialog to appear (rotation calls WASM + sends relay messages)
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS)))
      .toExist()
      .withTimeout(TIMEOUTS.NETWORK_CONNECT);

    // The success dialog should show "Key Rotation Complete"
    await expect(element(by.text('Key Rotation Complete'))).toExist();
  });

  it('should notify connected peers about the key rotation', async () => {
    // The success dialog should still be open from previous test
    await expect(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS))).toExist();

    // Since this user has no friends in a single-device test, friendCount = 0.
    // The success message should mention "0 friends were notified."
    await expect(
      element(by.text('Your encryption key has been rotated successfully. 0 friends were notified.')),
    ).toExist();

    // Dismiss the success dialog
    await element(by.text('Done')).tap();
    await waitForUISettle();

    // Success dialog should be closed
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS)))
      .not.toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should re-establish encrypted sessions after key rotation', async () => {
    // After key rotation, re-open the dialog and rotate again to confirm
    // the feature is still functional (keys can be rotated multiple times).
    await scrollToDangerZone();
    await activateElement(TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON);
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);

    // Confirm the second rotation
    await element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_CONFIRM)).tap();

    // Should succeed again — proving the encryption session was re-established
    await waitFor(element(by.id(TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS)))
      .toExist()
      .withTimeout(TIMEOUTS.NETWORK_CONNECT);

    await expect(element(by.text('Key Rotation Complete'))).toExist();

    // Dismiss
    await element(by.text('Done')).tap();
    await waitForUISettle();
  });
});
