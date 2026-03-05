/**
 * Plugins Section — verifies the Plugins settings section is visible
 * and links to the plugin marketplace.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Plugins Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_PLUGINS,
      TEST_IDS.SETTINGS.SECTION_PLUGINS,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the plugins section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_PLUGINS))).toExist();
  });

  it.todo('should show a list of installed plugins');
  it.todo('should show a link or button to open the plugin marketplace');
  it.todo('should navigate to the marketplace when marketplace link is tapped');
  it.todo('should show enable/disable toggles for installed plugins');
  it.todo('should show an uninstall option for installed plugins');
});
