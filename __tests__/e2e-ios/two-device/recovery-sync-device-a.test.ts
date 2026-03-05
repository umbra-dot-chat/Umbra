/**
 * Recovery & Settings Sync — Device A (iPhone 17 Pro)
 *
 * Run via: scripts/run-recovery-sync-test.sh
 *
 * Device A creates an account, captures the seed phrase, reads the DID,
 * changes appearance settings (text size → "lg"), then publishes
 * everything via the sync file for Device B to import and verify.
 */

import { device, element, by, waitFor } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import {
  launchApp,
  waitForMainScreen,
  waitForUISettle,
  waitForRelayConnection,
} from '../helpers/app';
import { navigateToSettings, closeSettings } from '../helpers/navigation';
import { writeSync, waitForSync, resetSync } from '../helpers/sync';

// Activation helper for clipped elements (MaskedView overlay)
async function activateElement(testID: string) {
  await element(by.id(testID)).performAccessibilityAction('activate');
}

describe('Recovery & Settings Sync — Device A', () => {
  let seedPhrase = '';
  let myDid = '';

  beforeAll(async () => {
    // Reset sync state — Device A starts first
    resetSync();
    await launchApp({ newInstance: true, delete: true });
  });

  it('should start account creation and capture seed phrase', async () => {
    // Wait for auth screen
    await waitFor(element(by.id(TEST_IDS.AUTH.SCREEN)))
      .toExist()
      .withTimeout(TIMEOUTS.APP_LAUNCH);
    await waitForUISettle();

    // Tap "Create New Account"
    await waitFor(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await activateElement(TEST_IDS.AUTH.CREATE_BUTTON);
    await waitForUISettle();

    // Step 0: Enter display name
    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).typeText(
      FIXTURES.USER_A.displayName,
    );
    await element(by.id(TEST_IDS.CREATE.NAME_INPUT)).tapReturnKey();
    await waitFor(element(by.id(TEST_IDS.CREATE.NAME_NEXT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.NAME_NEXT)).tap();
    await waitForUISettle();

    // Step 1: Seed phrase — READ the words via accessibilityValue on the grid
    await waitFor(element(by.id(TEST_IDS.SEED.GRID)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    const gridAttrs = await element(by.id(TEST_IDS.SEED.GRID)).getAttributes();
    // @ts-ignore — accessibilityValue.text has the full seed phrase
    seedPhrase = gridAttrs.value || '';

    if (!seedPhrase || seedPhrase.split(' ').length !== 24) {
      throw new Error(
        `Failed to read 24-word seed phrase from grid. Got: "${seedPhrase.slice(0, 60)}..."`,
      );
    }

    console.log(
      `[DeviceA] Captured seed phrase (${seedPhrase.split(' ').length} words): ${seedPhrase.slice(0, 30)}...`,
    );

    // Continue past seed phrase
    await element(by.id(TEST_IDS.CREATE.SEED_NEXT)).tap();
    await waitForUISettle();
  });

  it('should complete account creation', async () => {
    // Step 2: Backup confirmation
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.BACKUP_CHECKBOX)).tap();
    await waitFor(element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.BACKUP_NEXT)).tap();
    await waitForUISettle();

    // Step 3: Skip PIN
    await waitFor(element(by.id(TEST_IDS.PIN.SKIP_BUTTON)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.PIN.SKIP_BUTTON)).tap();
    await waitForUISettle();

    // Step 4: Username — dismiss keyboard and skip
    await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.USERNAME_INPUT)).tapReturnKey();
    await waitForUISettle();
    await waitFor(element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.USERNAME_SKIP)).tap();
    await waitForUISettle();

    // Step 5: Success — done
    await waitFor(element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await element(by.id(TEST_IDS.CREATE.SUCCESS_DONE)).tap();

    await waitForMainScreen();
    console.log('[DeviceA] Account created successfully');
  });

  it('should read own DID from settings', async () => {
    await navigateToSettings();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DID_DISPLAY)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    const attrs = await element(
      by.id(TEST_IDS.SETTINGS.DID_DISPLAY),
    ).getAttributes();
    // @ts-ignore — accessibilityValue.text has the full (non-truncated) DID
    myDid = attrs.value || attrs.text || attrs.label || '';

    if (!myDid.startsWith('did:key:z6Mk') || myDid.length < 48) {
      throw new Error(`Invalid DID read from settings: "${myDid}"`);
    }

    console.log(`[DeviceA] My DID: ${myDid.slice(0, 30)}...`);
    await closeSettings();
  });

  it('should change all appearance preferences', async () => {
    // Wait for relay connection before changing settings so sync events are sent
    await waitForRelayConnection();

    await navigateToSettings();
    await waitForUISettle();

    // Navigate to Appearance section
    await element(by.id(TEST_IDS.SETTINGS.NAV_APPEARANCE)).performAccessibilityAction('activate');
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_APPEARANCE)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
    await waitForUISettle();

    // ── 1. Text Size → Large ────────────────────────────────────────────
    await waitFor(element(by.id(TEST_IDS.SETTINGS.FONT_SIZE)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.id(TEST_IDS.SETTINGS.FONT_SIZE)).tap();
    await waitForUISettle();

    const lgOptionId = `${TEST_IDS.SETTINGS.FONT_SIZE}.option.lg`;
    await waitFor(element(by.id(lgOptionId)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.id(lgOptionId)).tap();
    await waitForUISettle();

    const sizeAttrs = await element(
      by.id(TEST_IDS.SETTINGS.FONT_SIZE),
    ).getAttributes();
    // @ts-ignore
    console.log(`[DeviceA] Text size set to: "${sizeAttrs.value}"`);

    // ── 2. Dark Mode → ON ───────────────────────────────────────────────
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DARK_MODE_TOGGLE)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.id(TEST_IDS.SETTINGS.DARK_MODE_TOGGLE)).tap();
    await waitForUISettle();
    console.log('[DeviceA] Dark mode toggled ON');

    // ── 3. Accent Color → Red (#EF4444) ─────────────────────────────────
    await waitFor(element(by.label('Select colour #EF4444')))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);
    await element(by.label('Select colour #EF4444')).tap();
    await waitForUISettle();

    const accentAttrs = await element(
      by.id(TEST_IDS.SETTINGS.ACCENT_COLOR),
    ).getAttributes();
    // @ts-ignore
    console.log(`[DeviceA] Accent color set to: "${accentAttrs.value}"`);

    await closeSettings();
  });

  it('should publish seed phrase, DID, and settings to sync file', async () => {
    writeSync('deviceA_seed', seedPhrase);
    writeSync('deviceA_did', myDid);
    writeSync('deviceA_text_size', 'lg');
    writeSync('deviceA_dark_mode', 'true');
    writeSync('deviceA_accent_color', '#EF4444');
    writeSync('deviceA_ready', 'true');
    console.log('[DeviceA] Published seed, DID, and settings to sync file');
  });

  it(
    'should wait for Device B to confirm recovery and settings sync',
    async () => {
      const status = await waitForSync('deviceB_verified', 180000);
      console.log(`[DeviceA] Device B verified: ${status}`);
    },
    200000,
  );
});
