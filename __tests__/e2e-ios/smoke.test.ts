/**
 * Smoke test — quick validation that the app launches and account creation works.
 * Run after every build: `yarn detox:smoke`
 *
 * Expected duration: ~30 seconds.
 */
import { element, by, expect } from 'detox';
import { TEST_IDS } from '../shared/test-ids';
import { FIXTURES } from '../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen } from './helpers/app';
import { createAccount } from './helpers/auth';

describe('Smoke Test', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
  });

  it('should launch and show the auth screen', async () => {
    await waitForAuthScreen();
    await expect(element(by.id(TEST_IDS.AUTH.LOGO))).toExist();
    await expect(element(by.id(TEST_IDS.AUTH.CREATE_BUTTON))).toExist();
    await expect(element(by.id(TEST_IDS.AUTH.IMPORT_BUTTON))).toExist();
  });

  it('should create an account and reach the main screen', async () => {
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });
});
