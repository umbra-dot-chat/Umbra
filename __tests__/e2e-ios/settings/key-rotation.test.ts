/**
 * Key Rotation — verifies the key rotation option is visible in settings.
 * This is a stub for future key rotation implementation.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

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
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toBeVisible();
  });

  it.todo('should show a key rotation option in the account section');
  it.todo('should open a confirmation dialog when key rotation is initiated');
  it.todo('should warn that key rotation will regenerate encryption keys');
  it.todo('should complete key rotation and update the DID');
  it.todo('should notify connected peers about the key rotation');
  it.todo('should re-establish encrypted sessions after key rotation');
});
