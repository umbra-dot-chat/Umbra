/**
 * Sounds Section — verifies the Sounds settings section is visible
 * and the sound toggle is present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Sounds Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_SOUNDS,
      TEST_IDS.SETTINGS.SECTION_SOUNDS,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the sounds section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_SOUNDS))).toExist();
  });

  it('should show a sound toggle', async () => {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should be able to toggle sounds off and on', async () => {
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
    // Restore default
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
  });

  it.todo('should mute all sounds when master toggle is off');
  it.todo('should allow configuring individual sound events');
  it.todo('should persist sound settings after closing and reopening');
});
