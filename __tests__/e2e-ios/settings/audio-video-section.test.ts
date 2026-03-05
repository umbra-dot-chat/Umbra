/**
 * Audio/Video Section — verifies the Audio/Video settings section is visible.
 * Device selection is stubbed for future implementation.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToSettings, closeSettings, navigateToSettingsSection } from '../helpers/navigation';

describe('Settings > Audio/Video Section', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToSettingsSection(
      TEST_IDS.SETTINGS.NAV_AUDIO_VIDEO,
      TEST_IDS.SETTINGS.SECTION_AUDIO_VIDEO,
    );
  });

  afterAll(async () => {
    await closeSettings();
  });

  it('should display the audio/video section', async () => {
    await expect(element(by.id(TEST_IDS.SETTINGS.SECTION_AUDIO_VIDEO))).toExist();
  });

  it.todo('should show microphone input device selector');
  it.todo('should show speaker output device selector');
  it.todo('should show camera device selector');
  it.todo('should allow testing microphone input level');
  it.todo('should allow testing speaker output');
  it.todo('should persist audio/video device selections after closing and reopening');
});
