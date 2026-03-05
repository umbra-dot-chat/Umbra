/**
 * Settings Navigation — verifies settings dialog opens from the navigation rail,
 * all nav items are visible, tapping nav items switches sections, and close works.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection, tapSettingsNavItem } from '../helpers/navigation';

describe('Settings Navigation', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should open settings dialog from the navigation rail', async () => {
    await navigateToSettings();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toExist();
  });

  it('should display the Account nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT))).toExist();
  });

  it('should display the Profile nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PROFILE))).toExist();
  });

  it('should display the Appearance nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_APPEARANCE))).toExist();
  });

  it('should display the Messaging nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_MESSAGING))).toExist();
  });

  it('should display the Notifications nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_NOTIFICATIONS))).toExist();
  });

  it('should display the Sounds nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_SOUNDS))).toExist();
  });

  it('should display the Privacy nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PRIVACY))).toExist();
  });

  it('should display the Audio/Video nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_AUDIO_VIDEO))).toExist();
  });

  it('should display the Network nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_NETWORK))).toExist();
  });

  it('should display the Data nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_DATA))).toExist();
  });

  it('should display the Plugins nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PLUGINS))).toExist();
  });

  it('should display the Shortcuts nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_SHORTCUTS))).toExist();
  });

  it('should display the About nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_ABOUT))).toExist();
  });

  it('should switch to Profile section when Profile nav is tapped', async () => {
    await tapSettingsNavItem(TEST_IDS.SETTINGS.NAV_PROFILE);
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_PROFILE)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should switch to Network section when Network nav is tapped', async () => {
    await tapSettingsNavItem(TEST_IDS.SETTINGS.NAV_NETWORK);
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should switch back to Account section when Account nav is tapped', async () => {
    await tapSettingsNavItem(TEST_IDS.SETTINGS.NAV_ACCOUNT);
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should close settings dialog when close button is tapped', async () => {
    await closeSettings();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).not.toExist();
  });

  it('should return to the main screen after closing settings', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });
});
