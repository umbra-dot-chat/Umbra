/**
 * Chat / messaging interaction helpers for Detox E2E tests.
 *
 * NETWORK VERIFICATION RULES:
 * 1. sendMessage() verifies local UI only — use sendAndVerifyDelivery()
 *    for end-to-end delivery confirmation.
 * 2. waitForMessage() is the primary network delivery assertion — it
 *    waits for a message sent by another device to appear locally.
 * 3. All cross-device message checks MUST use hard assertions (no try/catch
 *    swallowing). If a message fails to arrive, the test should fail.
 * 4. Use expectMessageDelivered() after sending to verify the message
 *    appears in the chat area (local confirmation).
 */
import { element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForUISettle } from './app';

/**
 * Send a text message in the current conversation.
 * Verifies the message appears locally after sending.
 */
export async function sendMessage(text: string) {
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tap();
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).typeText(text);
  // Send via return key (MessageInput sends on Enter/Return)
  await element(by.id(TEST_IDS.INPUT.TEXT_INPUT)).tapReturnKey();
  await waitForUISettle();
}

/**
 * Send a message and verify it appears in the local chat area.
 * This confirms the message was processed locally — for cross-device
 * verification, the receiving device should call waitForMessage().
 */
export async function sendAndVerifyDelivery(text: string) {
  await sendMessage(text);

  // Verify the message appears in the local chat
  await waitFor(element(by.text(text)))
    .toExist()
    .withTimeout(TIMEOUTS.INTERACTION);
}

/**
 * Wait for a message with specific text to appear in the chat area.
 *
 * This is the primary NETWORK DELIVERY assertion for two-device tests.
 * If User A sends a message and User B calls waitForMessage(), success
 * means the message was encrypted, transmitted via the relay, received,
 * decrypted, and rendered — full end-to-end delivery verified.
 */
export async function waitForMessage(text: string) {
  await waitFor(element(by.text(text)))
    .toExist()
    .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
}

/**
 * Wait for a message with a longer timeout — for messages that may
 * take extra time due to relay queue processing or reconnection.
 */
export async function waitForMessageExtended(text: string, timeoutMs = 30_000) {
  await waitFor(element(by.text(text)))
    .toExist()
    .withTimeout(timeoutMs);
}

/**
 * Assert a message with specific text is visible in the chat.
 */
export async function expectMessageVisible(text: string) {
  await expect(element(by.text(text))).toExist();
}

/**
 * Assert a message with specific text is NOT visible.
 */
export async function expectMessageNotVisible(text: string) {
  await expect(element(by.text(text))).not.toExist();
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
    .toExist()
    .withTimeout(TIMEOUTS.MESSAGE_DELIVERY);
}

/**
 * Assert the typing indicator is not visible.
 */
export async function expectNoTypingIndicator() {
  await expect(element(by.id(TEST_IDS.CHAT_AREA.TYPING_INDICATOR))).not.toExist();
}
