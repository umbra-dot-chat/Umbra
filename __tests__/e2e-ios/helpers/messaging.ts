/**
 * Chat / messaging interaction helpers for Detox E2E tests.
 */
import { element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForUISettle } from './app';

/**
 * Send a text message in the current conversation.
 */
export async function sendMessage(text: string) {
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(text);
  // Send via return key (MessageInput sends on Enter/Return)
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tapReturnKey();
  await waitForUISettle();
}

/**
 * Wait for a message with specific text to appear in the chat area.
 */
export async function waitForMessage(text: string) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
}

/**
 * Assert a message with specific text is visible in the chat.
 */
export async function expectMessageVisible(text: string) {
  await expect(element(by.text(text))).toBeVisible();
}

/**
 * Assert a message with specific text is NOT visible.
 */
export async function expectMessageNotVisible(text: string) {
  await expect(element(by.text(text))).not.toBeVisible();
}

/**
 * Long-press a message to trigger context menu / actions.
 */
export async function longPressMessage(text: string) {
  await element(by.text(text)).longPress();
  await waitForUISettle();
}

/**
 * Scroll up in the message list to load older messages.
 */
export async function scrollToOlderMessages() {
  await element(by.id(TEST_IDS.CHAT_AREA.MESSAGE_LIST)).scroll(300, 'down');
  await waitForUISettle();
}

/**
 * Tap the scroll-to-bottom button if visible.
 */
export async function scrollToBottom() {
  try {
    await element(by.id(TEST_IDS.CHAT_AREA.SCROLL_BOTTOM)).tap();
  } catch {
    // Button may not be visible if already at bottom
  }
}

/**
 * Wait for the typing indicator to appear.
 */
export async function waitForTypingIndicator() {
  await waitFor(element(by.id(TEST_IDS.CHAT_AREA.TYPING_INDICATOR)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
}

/**
 * Assert the typing indicator is not visible.
 */
export async function expectNoTypingIndicator() {
  await expect(element(by.id(TEST_IDS.CHAT_AREA.TYPING_INDICATOR))).not.toBeVisible();
}
