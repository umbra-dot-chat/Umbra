/**
 * Account Section — verifies the Account settings section shows DID,
 * logout button, and backup button.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Account Section', () => {
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

  it('should show the DID display', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY))).toExist();
  });

  it('should show a non-empty DID string', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY))).not.toHaveText('');
  });

  it('should display the logout button', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.LOGOUT_BUTTON))).toExist();
  });

  it('should display the backup button', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.BACKUP_BUTTON))).toExist();
  });

  it('should display the identity card', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.IDENTITY_CARD))).toExist();
  });

  it.todo('should show a confirmation dialog when logout is tapped');
  it.todo('should log out and return to auth screen on confirmation');
  it.todo('should show the delete account button');
});
