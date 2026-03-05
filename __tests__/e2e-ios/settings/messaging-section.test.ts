/**
 * Messaging Section — verifies the Messaging settings section is visible
 * and message display options are present.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Messaging Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_MESSAGING,
      TEST_IDS.SETTINGS.SECTION_MESSAGING,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the messaging section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_MESSAGING))).toExist();
  });

  it('should contain at least one settings toggle for message display', async () => {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.TOGGLE)).atIndex(0))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
  });

  it.todo('should toggle read receipts on and off');
  it.todo('should toggle typing indicators on and off');
  it.todo('should toggle link previews on and off');
  it.todo('should persist messaging preferences after closing and reopening');
});
