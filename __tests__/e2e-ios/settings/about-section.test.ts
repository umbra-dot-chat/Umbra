/**
 * About Section — verifies the About settings section shows the app version
 * and relevant links.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > About Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_ABOUT,
      TEST_IDS.SETTINGS.SECTION_ABOUT,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the about section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ABOUT))).toBeVisible();
  });

  it('should show a version string', async () => {
    await waitFor(element(by.text(/\d+\.\d+\.\d+/)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.todo('should show a link to the project website');
  it.todo('should show a link to the source code repository');
  it.todo('should show a link to the privacy policy');
  it.todo('should show a link to the terms of service');
  it.todo('should display open-source license information');
});
