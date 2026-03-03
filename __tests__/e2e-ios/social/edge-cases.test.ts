/**
 * Edge Cases — Detox E2E Tests (iOS)
 *
 * Tests edge cases for messaging: very long messages, special characters,
 * rapid message sending, and other boundary conditions.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin } from '../helpers/auth';
import { navigateToFriends, navigateToSettings, navigateHome, openConversation } from '../helpers/navigation';
import { sendMessage, waitForMessage, expectMessageVisible, longPressMessage } from '../helpers/messaging';

describe('Messaging Edge Cases', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it('should show the main screen', async () => {
    await expect(element(by.id(TEST_IDS.MAIN.CONTAINER))).toBeVisible();
  });

  describe('Very long messages', () => {
    it.skip('should accept a very long message in the input', async () => {
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(FIXTURES.MESSAGES.LONG);
      await waitForUISettle();
    });

    it.skip('should send a very long message and render it', async () => {
      await sendMessage(FIXTURES.MESSAGES.LONG);
      await waitForUISettle();

      // The long message should be visible (possibly truncated or scrollable)
      await waitFor(element(by.id(TEST_IDS.BUBBLE.CONTAINER)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.INTERACTION);
    });
  });

  describe('Special characters', () => {
    it.skip('should send and render messages with special characters', async () => {
      await sendMessage(FIXTURES.MESSAGES.SPECIAL_CHARS);
      await waitForUISettle();

      await expectMessageVisible(FIXTURES.MESSAGES.SPECIAL_CHARS);
    });
  });

  describe('Rapid message sending', () => {
    it.skip('should handle sending multiple messages in quick succession', async () => {
      const messages = [
        'Rapid message 1',
        'Rapid message 2',
        'Rapid message 3',
        'Rapid message 4',
        'Rapid message 5',
      ];

      for (const msg of messages) {
        await sendMessage(msg);
      }

      await waitForUISettle();

      // All messages should be visible in the chat
      for (const msg of messages) {
        await expectMessageVisible(msg);
      }
    });
  });

  describe('Empty and whitespace messages', () => {
    it.skip('should not send a message that is only whitespace', async () => {
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText('   ');
      await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tapReturnKey();
      await waitForUISettle();

      // The whitespace-only message should not appear as a bubble
    });
  });

  describe('Unicode and emoji in text', () => {
    it.skip('should render emoji characters in messages', async () => {
      await sendMessage(FIXTURES.MESSAGES.EMOJI);
      await waitForUISettle();
      await expectMessageVisible(FIXTURES.MESSAGES.EMOJI);
    });
  });
});
