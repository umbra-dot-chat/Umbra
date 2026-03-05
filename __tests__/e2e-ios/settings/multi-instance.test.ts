/**
 * Multi-Instance / Device Management — verifies multi-instance device management
 * options are accessible. This is a stub for future implementation.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Multi-Instance / Device Management', () => {
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

  it('should display the account section where device management lives', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toExist();
  });

  it.todo('should show a linked devices section');
  it.todo('should display the current device in the linked devices list');
  it.todo('should show a link device button or QR code generator');
  it.todo('should allow removing a linked device');
  it.todo('should show confirmation before removing a linked device');
  it.todo('should sync identity across linked devices');
});
