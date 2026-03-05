/**
 * Group Messaging — Detox E2E Tests (iOS)
 *
 * [TWO-USER STUB] Tests sending and receiving messages within a group
 * conversation. Requires multiple users in an existing group.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Group Messaging [TWO-USER]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  // TWO-USER tests: require a group with multiple members.

  it.todo('should open a group conversation from the sidebar');

  it.todo('should display the group chat area with message list');

  it.todo('should send a message in the group');

  it.todo('should show the sent message in the group chat');

  it.todo('should receive a message from another group member');

  it.todo('should display sender name on received group messages');

  it.todo('should show sender avatar on received group messages');

  it.todo('should display messages in chronological order');

  it.todo('should show message timestamps in the group chat');
});
