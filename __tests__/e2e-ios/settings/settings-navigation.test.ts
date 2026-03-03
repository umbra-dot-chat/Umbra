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
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings Navigation', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should open settings dialog from the navigation rail', async () => {
    await element(by.id(TEST_IDS.NAV.SETTINGS)).tap();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DIALOG)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).toBeVisible();
  });

  it('should display the Account nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT))).toBeVisible();
  });

  it('should display the Profile nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PROFILE))).toBeVisible();
  });

  it('should display the Appearance nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_APPEARANCE))).toBeVisible();
  });

  it('should display the Messaging nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_MESSAGING))).toBeVisible();
  });

  it('should display the Notifications nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_NOTIFICATIONS))).toBeVisible();
  });

  it('should display the Sounds nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_SOUNDS))).toBeVisible();
  });

  it('should display the Privacy nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PRIVACY))).toBeVisible();
  });

  it('should display the Audio/Video nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_AUDIO_VIDEO))).toBeVisible();
  });

  it('should display the Network nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_NETWORK))).toBeVisible();
  });

  it('should display the Data nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_DATA))).toBeVisible();
  });

  it('should display the Plugins nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_PLUGINS))).toBeVisible();
  });

  it('should display the Shortcuts nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_SHORTCUTS))).toBeVisible();
  });

  it('should display the About nav item', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.NAV_ABOUT))).toBeVisible();
  });

  it('should switch to Profile section when Profile nav is tapped', async () => {
    await element(by.id(TEST_IDS.SETTINGS.NAV_PROFILE)).tap();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_PROFILE)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_PROFILE))).toBeVisible();
  });

  it('should switch to Network section when Network nav is tapped', async () => {
    await element(by.id(TEST_IDS.SETTINGS.NAV_NETWORK)).tap();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK))).toBeVisible();
  });

  it('should switch back to Account section when Account nav is tapped', async () => {
    await element(by.id(TEST_IDS.SETTINGS.NAV_ACCOUNT)).tap();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT)))
      .toBeVisible()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_ACCOUNT))).toBeVisible();
  });

  it('should close settings dialog when close button is tapped', async () => {
    await element(by.id(TEST_IDS.SETTINGS.CLOSE_BUTTON)).tap();
    await waitForUISettle();
    await expect(element(by.id(TEST_IDS.SETTINGS.DIALOG))).not.toBeVisible();
  });

  it('should return to the main screen after closing settings', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });
});
