/**
 * Reactions and Threads — Detox E2E Tests (iOS)
 *
 * Stub tests for adding reactions to messages and thread replies.
 * Both features are stubbed until they are fully implemented
 * on the mobile client.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Reactions and Threads', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  describe('Reactions [STUB]', () => {
    it.todo('should show a reaction picker when reacting to a message');

    it.todo('should add a reaction to a message');

    it.todo('should display the reaction below the message bubble');

    it.todo('should remove a reaction by tapping it again');

    it.todo('should show reaction count when multiple users react');
  });

  describe('Threads [STUB]', () => {
    it.todo('should open a thread view from a message');

    it.todo('should send a reply in a thread');

    it.todo('should display thread reply count on the parent message');

    it.todo('should navigate back from thread view to main chat');
  });
});
