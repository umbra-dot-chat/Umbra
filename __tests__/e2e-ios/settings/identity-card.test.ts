/**
 * Identity Card — verifies the identity card is visible in the account section
 * and displays the user's DID.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Identity Card', () => {
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

  it('should display the account section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toExist();
  });

  it('should show the identity card', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.IDENTITY_CARD))).toExist();
  });

  it('should show the DID on the identity card', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY))).toExist();
  });

  it('should display a non-empty DID value', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY))).not.toHaveText('');
  });

  it.todo('should show the display name on the identity card');
  it.todo('should show the user avatar on the identity card');
  it.todo('should allow copying the DID by tapping on it');
  it.todo('should show a share button for the identity card');
  it.todo('should generate a QR code for the identity card');
});
