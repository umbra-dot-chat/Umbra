/**
 * Appearance Section — verifies the Appearance settings section is visible
 * and the theme selector is present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Appearance Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_APPEARANCE,
      TEST_IDS.SETTINGS.SECTION_APPEARANCE,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the appearance section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_APPEARANCE))).toBeVisible();
  });

  it('should show the theme selector', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.THEME_SELECTOR))).toBeVisible();
  });

  it('should show the font size control', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.FONT_SIZE))).toBeVisible();
  });

  it('should show the compact mode toggle', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.COMPACT_MODE))).toBeVisible();
  });

  it.todo('should switch theme when a different theme option is selected');
  it.todo('should persist theme selection after closing and reopening settings');
  it.todo('should adjust font size when font size control is changed');
  it.todo('should toggle compact mode on and off');
});
