/**
 * Group File Attachments — Detox E2E Tests (iOS)
 *
 * Stub tests for file sharing within group conversations.
 * Full implementation pending file transfer integration in groups.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Group File Attachments [STUB]', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should load the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  // All group file attachment tests are stubbed.
  // Requires: group creation, file transfer in groups, multi-user sync.

  it.todo('should show the attach button in a group conversation input');

  it.todo('should open the file picker in a group conversation');

  it.todo('should send a file in a group conversation');

  it.todo('should display the file attachment card in the group chat');

  it.todo('should show file transfer progress for group file sends');

  it.todo('should allow group members to download the shared file');

  it.todo('should show the files panel in the group header');

  it.todo('should list all shared files in the group files panel');
});
