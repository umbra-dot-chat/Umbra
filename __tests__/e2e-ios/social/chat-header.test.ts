/**
 * Chat Header — Detox E2E Tests (iOS)
 *
 * Tests the conversation header: displays conversation name, avatar,
 * status indicator, and call buttons (voice/video).
 *
 * Requires navigating into an active conversation. Single-device tests
 * validate header UI once a conversation exists.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Chat Header', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  // TWO-USER: A real DM conversation requires two users to be friends.
  // These tests assume a conversation has been opened via a helper or
  // prior test setup.

  it.skip('should display the conversation name in the header', async () => {
    // Requires an active conversation
    await expect(element(by.id(TEST_IDS.CHAT.HEADER))).toExist();
    await expect(element(by.id(TEST_IDS.CHAT.HEADER_NAME))).toExist();
  });

  it.skip('should display the avatar in the header', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER_AVATAR))).toExist();
  });

  it.skip('should display the status indicator in the header', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER_STATUS))).toExist();
  });

  it.skip('should show the voice call button', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.CALL_VOICE))).toExist();
  });

  it.skip('should show the video call button', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.CALL_VIDEO))).toExist();
  });

  it.skip('should show the back button on mobile layout', async () => {
    await expect(element(by.id(TEST_IDS.CHAT.HEADER_BACK))).toExist();
  });

  it.skip('should navigate back when tapping the back button', async () => {
    await element(by.id(TEST_IDS.CHAT.HEADER_BACK)).tap();
    await waitForUISettle();
    // Should return to the conversation list / sidebar
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('should show the main screen when no conversation is selected', async () => {
    // On fresh launch with no conversation open, verify the empty state
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });
});
