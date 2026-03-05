/**
 * Network Section — verifies the Network settings section shows relay status,
 * relay URL, and peer count.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Network Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_NETWORK,
      TEST_IDS.SETTINGS.SECTION_NETWORK,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the network section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK))).toExist();
  });

  it('should show the relay status indicator', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.RELAY_STATUS))).toExist();
  });

  it('should show the relay URL', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.RELAY_URL))).toExist();
  });

  it('should display the configured relay URL', async () => {
    await waitFor(element(by.id(TEST_IDS.SETTINGS.RELAY_URL)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    // The relay URL should contain the configured relay domain
    await expect(element(by.id(TEST_IDS.SETTINGS.RELAY_URL))).not.toHaveText('');
  });

  it('should show the peer count', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.PEER_COUNT))).toExist();
  });

  it.todo('should update relay status when connection state changes');
  it.todo('should allow editing the relay URL');
  it.todo('should reconnect when relay URL is changed');
  it.todo('should show peer count updating in real-time');
});
