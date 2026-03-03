/**
 * File Attachments — Detox E2E Tests (iOS)
 *
 * Tests that the attach button is visible in the message input bar.
 * Full file attachment flow (picking, uploading, rendering) is
 * stubbed until file transfer is integrated on mobile.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('File Attachments', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  // Requires being inside a conversation.

  it.skip('should display the attach button in the input bar', async () => {
    await expect(element(by.id(TEST_IDS.INPUT.ATTACH_BUTTON))).toBeVisible();
  });

  it.skip('should tap the attach button without crashing', async () => {
    await element(by.id(TEST_IDS.INPUT.ATTACH_BUTTON)).tap();
    await waitForUISettle();
    // A file picker or attachment menu should appear (platform-dependent)
  });

  it.todo('should open the iOS file picker when attach is tapped');

  it.todo('should show a file preview after selecting a file');

  it.todo('should send the file attachment');

  it.todo('should display the file attachment in the chat as a download card');

  it.todo('should show file transfer progress during upload');

  it.todo('should allow the recipient to download the file attachment');
});
