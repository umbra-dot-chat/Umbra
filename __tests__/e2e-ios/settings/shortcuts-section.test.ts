/**
 * Shortcuts Section — verifies the Keyboard Shortcuts settings section is visible.
 * This is a stub on mobile since keyboard shortcuts are primarily a desktop feature.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Shortcuts Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_SHORTCUTS,
      TEST_IDS.SETTINGS.SECTION_SHORTCUTS,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the shortcuts section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_SHORTCUTS))).toBeVisible();
  });

  it.todo('should show a list of available keyboard shortcuts');
  it.todo('should indicate that shortcuts are desktop-only on mobile');
  it.todo('should allow customizing shortcut key bindings on desktop');
  it.todo('should allow resetting shortcuts to defaults');
});
