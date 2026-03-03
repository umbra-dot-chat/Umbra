/**
 * Privacy Section — verifies the Privacy settings section is visible
 * and privacy toggles are present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Privacy Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_PRIVACY,
      TEST_IDS.SETTINGS.SECTION_PRIVACY,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the privacy section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_PRIVACY))).toBeVisible();
  });

  it('should show at least one privacy toggle', async () => {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0))
      .toBeVisible()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it('should allow toggling the first privacy option', async () => {
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
    // Restore default
    await element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0).tap();
    await waitForUISettle();
  });

  it.todo('should toggle online status visibility');
  it.todo('should toggle read receipt sharing');
  it.todo('should configure who can send friend requests');
  it.todo('should persist privacy settings after closing and reopening');
});
