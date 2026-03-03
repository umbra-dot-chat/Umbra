/**
 * Account Backup — verifies the backup flow is accessible from the account section.
 * This is largely a stub since the full backup flow is not yet implemented.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Account Backup', () => {
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
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toBeVisible();
  });

  it('should show the backup button in the account section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.BACKUP_BUTTON))).toBeVisible();
  });

  it('should be able to tap the backup button', async () => {
    await element(by.id(TEST_IDS.SETTINGS.BACKUP_BUTTON)).tap();
    await waitForUISettle();
  });

  it.todo('should open the backup dialog when backup button is tapped');
  it.todo('should display the recovery phrase in the backup dialog');
  it.todo('should require confirmation before showing the recovery phrase');
  it.todo('should allow copying the recovery phrase');
  it.todo('should close the backup dialog and return to account section');
});
