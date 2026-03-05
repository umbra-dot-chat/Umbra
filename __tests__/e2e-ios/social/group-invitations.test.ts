/**
 * Group Invitations — Detox E2E Tests (iOS)
 *
 * [TWO-USER STUB] Tests inviting a user to a group and the invitee
 * seeing the invitation. All multi-device tests are stubbed.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Group Invitations [TWO-USER]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toExist();
  });

  it('should show the sidebar with group invite section', async () => {
    // The group invite section may be visible if invitations exist.
    // On a fresh account it should either be hidden or show empty state.
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toExist();
  });

  // TWO-USER tests: require User A to create a group and invite User B.

  it.todo('should send a group invitation to User B');

  it.todo('should show the group invitation on User B sidebar');

  it.todo('should display the group invite item with group name');

  it.todo('should allow User B to accept the group invitation');

  it.todo('should add User B to the group after accepting');

  it.todo('should allow User B to decline the group invitation');

  it.todo('should remove the invitation after declining');
});
