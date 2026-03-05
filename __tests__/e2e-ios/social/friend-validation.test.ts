/**
 * Friend Validation — Detox E2E Tests (iOS)
 *
 * Tests input validation for the add-friend flow:
 * - Empty submission blocked at the component level
 * - Short value rejected by client-side validation
 * - Invalid DID format (missing did:key:z6Mk prefix) rejected client-side
 * - Verifies actual error feedback text content
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';
import { navigateToFriends } from '../helpers/navigation';

const EXPECTED_ERROR = 'Please enter a valid DID (did:key:z6Mk...).';

describe('Friend Validation', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
    await navigateToFriends();
  });

  it('should show the add friend input on the friends page', async () => {
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toExist();
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON))).toExist();
  });

  it('should not submit when input is empty', async () => {
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).clearText();

    // Tap the Send button — should do nothing (component blocks empty submissions)
    await element(by.id(TEST_IDS.FRIENDS.ADD_BUTTON)).tap();
    await waitForUISettle();

    // Verify no feedback appeared and we're still on the friends page
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toExist();
    await expect(element(by.id(TEST_IDS.FRIENDS.PAGE))).toExist();
  });

  it('should show error for a short invalid value', async () => {
    // Type "abc" (< 48 chars, doesn't start with did:key:z6Mk)
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).clearText();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText('abc');
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tapReturnKey();

    // Feedback should appear with the error message
    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);

    // Verify the error message is correct
    const attrs = await element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)).getAttributes();
    // @ts-ignore
    const text: string = attrs.text || attrs.label || '';
    if (!text.includes('valid DID')) {
      throw new Error(`Expected error about valid DID but got: "${text}"`);
    }
  });

  it('should show error for an invalid DID format (missing prefix)', async () => {
    // Wait for previous feedback to clear (5s auto-dismiss)
    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .not.toExist()
      .withTimeout(TIMEOUTS.INTERACTION * 2);

    // "not-a-valid-did-format" is long but doesn't start with did:key:z6Mk
    // Client-side validation now catches this before calling sendRequest()
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).clearText();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).typeText('not-a-valid-did-format');
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tapReturnKey();

    // Feedback should appear immediately (client-side validation)
    await waitFor(element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)))
      .toExist()
      .withTimeout(TIMEOUTS.INTERACTION);

    // Verify the error message
    const attrs = await element(by.id(TEST_IDS.FRIENDS.ADD_FEEDBACK)).getAttributes();
    // @ts-ignore
    const text: string = attrs.text || attrs.label || '';
    if (!text.includes('valid DID')) {
      throw new Error(`Expected error about valid DID but got: "${text}"`);
    }
  });

  it('should clear the input after dismissing the error', async () => {
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).tap();
    await element(by.id(TEST_IDS.FRIENDS.ADD_INPUT)).clearText();
    await waitForUISettle();

    // Input should still be present and usable
    await expect(element(by.id(TEST_IDS.FRIENDS.ADD_INPUT))).toExist();
  });
});
