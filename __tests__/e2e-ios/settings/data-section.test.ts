/**
 * Data Section — verifies the Data settings section is visible
 * and storage info is present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Data Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_DATA,
      TEST_IDS.SETTINGS.SECTION_DATA,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the data section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_DATA))).toExist();
  });

  it.todo('should show total storage usage');
  it.todo('should show message storage breakdown');
  it.todo('should show file storage breakdown');
  it.todo('should offer a clear cache option');
  it.todo('should offer an export data option');
  it.todo('should show confirmation dialog before clearing cache');
});
