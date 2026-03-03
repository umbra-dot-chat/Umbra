/**
 * Profile Section — verifies the Profile settings section shows the display name
 * input and allows editing the display name.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Profile Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_PROFILE,
      TEST_IDS.SETTINGS.SECTION_PROFILE,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the profile section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_PROFILE))).toBeVisible();
  });

  it('should show the display name input', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT))).toBeVisible();
  });

  it('should pre-fill the display name with the current name', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT))).toHaveText(
      FIXTURES.USER_A.displayName,
    );
  });

  it('should allow clearing and editing the display name', async () => {
    await element(by.id(TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT)).clearText();
    await element(by.id(TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT)).typeText('New Name');
    await expect(element(by.id(TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT))).toHaveText('New Name');
  });

  it('should show the bio input', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.BIO_INPUT))).toBeVisible();
  });

  it('should show the avatar picker', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.AVATAR_PICKER))).toBeVisible();
  });

  it('should show the save profile button', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SAVE_PROFILE))).toBeVisible();
  });

  it.todo('should persist edited display name after save and reopen');
  it.todo('should persist edited bio after save and reopen');
  it.todo('should allow selecting a new avatar image');
});
