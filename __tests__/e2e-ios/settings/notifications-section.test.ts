/**
 * Notifications Section — verifies the Notifications settings section is visible
 * and the notification toggle is present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Notifications Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_NOTIFICATIONS,
      TEST_IDS.SETTINGS.SECTION_NOTIFICATIONS,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the notifications section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_NOTIFICATIONS))).toExist();
  });

  it('should show the notification toggle', async () => {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should be able to tap the notification toggle', async () => {
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
    // Tap again to restore default
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
  });

  it.todo('should enable desktop notifications when toggled on');
  it.todo('should disable desktop notifications when toggled off');
  it.todo('should configure notification sound preference');
  it.todo('should persist notification settings after closing and reopening');
});
