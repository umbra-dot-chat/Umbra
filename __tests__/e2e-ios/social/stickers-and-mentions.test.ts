/**
 * Stickers and Mentions — Detox E2E Tests (iOS)
 *
 * Stub tests for sticker sending and @mention functionality.
 * Both features are pending implementation on the mobile client.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Stickers and Mentions [STUB]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  describe('Stickers', () => {
    it.todo('should open a sticker picker');

    it.todo('should send a sticker in a conversation');

    it.todo('should render a received sticker in the chat');

    it.todo('should display sticker in correct size');
  });

  describe('Mentions (@)', () => {
    it.todo('should trigger mention autocomplete when typing @');

    it.todo('should show a list of mentionable users');

    it.todo('should insert the mentioned user name into the input');

    it.todo('should highlight the mention in the sent message');

    it.todo('should notify the mentioned user');
  });
});
