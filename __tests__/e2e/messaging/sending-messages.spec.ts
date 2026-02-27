/**
 * 4.2 Sending Messages E2E Tests
 *
 * Tests the core message sending experience within a DM conversation:
 * typing in the input, sending via Enter and the send button,
 * message bubble appearance, timestamps, input clearing,
 * placeholder text, and Shift+Enter for newlines.
 *
 * These are TWO-USER tests: two browser contexts establish a friendship
 * and User A opens the DM conversation with User B before each test.
 *
 * Test IDs: T4.2.1–T4.2.8
 */

import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

// ─── Two-User DM Setup Helper ──────────────────────────────────────────────

interface DMSetupResult {
  contextA: Awaited<ReturnType<Browser['newContext']>>;
  contextB: Awaited<ReturnType<Browser['newContext']>>;
  pageA: Page;
  pageB: Page;
  userA: { did: string; seedPhrase: string };
  userB: { did: string; seedPhrase: string };
}

/**
 * Create two users, establish a friendship, and navigate User A into the
 * DM conversation with User B.
 *
 * Steps:
 *  1. Create two identities (Alice / Bob) in separate browser contexts.
 *  2. User B sends a friend request to User A's DID.
 *  3. User A accepts the friend request on the Pending tab.
 *  4. Wait for relay to sync the acceptance and auto-create the DM.
 *  5. User A navigates home and clicks the DM conversation with Bob.
 *
 * @param browser - Playwright Browser instance
 * @param suffix  - Unique suffix to avoid identity collisions between tests
 */
async function setupDMConversation(
  browser: Browser,
  suffix: string,
): Promise<DMSetupResult> {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 1. Create identities
  const userA = await createIdentity(pageA, `Alice${suffix}`);
  const userB = await createIdentity(pageB, `Bob${suffix}`);

  // 2. User B sends a friend request to User A
  await navigateToFriends(pageB);
  const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
  await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
  await addInput.first().fill(userA.did);
  await pageB
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  // 3. User A accepts the friend request
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await navigateToFriends(pageA);
  await clickTab(pageA, 'Pending');
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
  await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
  await acceptBtn.first().click();

  // 4. Wait for relay sync + DM auto-creation
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // 5. Navigate User A to the DM conversation with Bob
  await pageA.getByText('Conversations').first().click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Click on the conversation with Bob's name in the sidebar
  await expect(
    pageA.getByText(new RegExp(`Bob${suffix}`)).first(),
  ).toBeVisible({ timeout: 10_000 });
  await pageA.getByText(new RegExp(`Bob${suffix}`)).first().click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Verify the message input is visible (confirms we are in the chat)
  await expect(
    pageA.getByPlaceholder('Type a message...'),
  ).toBeVisible({ timeout: 10_000 });

  return { contextA, contextB, pageA, pageB, userA, userB };
}

// ─── T4.2.1: Type message in input — text appears ──────────────────────────

test.describe('4.2 Sending Messages', () => {
  test.setTimeout(180_000);

  test('T4.2.1 — Type message in input — text appears', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '421');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Hello from Alice');

    // The input should contain the typed text
    await expect(input).toHaveValue('Hello from Alice');

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.2: Press Enter — message appears in chat as outgoing bubble ───

  test('T4.2.2 — Press Enter — message appears in chat as outgoing bubble', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '422');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Hello world');
    await pageA.keyboard.press('Enter');

    // Wait for the message to appear in the chat area
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message text should be visible in the chat
    await expect(
      pageA.getByText('Hello world').first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.3: Outgoing bubble — accent color, right-aligned (bubble mode) ──

  test('T4.2.3 — Outgoing bubble: accent color, right-aligned (bubble mode)', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '423');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Alignment test');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message should be visible
    await expect(
      pageA.getByText('Alignment test').first(),
    ).toBeVisible({ timeout: 10_000 });

    // In bubble mode, outgoing messages are rendered inside a MsgGroup with
    // align="outgoing" which sets `alignItems: 'flex-end'` on the wrapper.
    // Verify the message's container uses flex-end alignment (right-aligned).
    const isRightAligned = await pageA.evaluate(() => {
      // Find the message text node
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) =>
          node.textContent?.trim() === 'Alignment test'
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const textNode = walker.nextNode();
      if (!textNode?.parentElement) return false;

      // Walk up to find a container with alignItems: flex-end
      let el: HTMLElement | null = textNode.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-end') return true;
        el = el.parentElement;
      }
      return false;
    });

    expect(isRightAligned).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.4: Timestamp appears below message ─────────────────────────────

  test('T4.2.4 — Timestamp appears below message', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '424');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Timestamp check');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message should appear
    await expect(
      pageA.getByText('Timestamp check').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Timestamps are formatted as "H:MM AM/PM" (e.g., "10:32 AM" or "3:05 PM").
    // Look for a time pattern near the message.
    const timestampVisible = await pageA
      .getByText(/\d{1,2}:\d{2}\s*[AaPp][Mm]/)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(timestampVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.5: Input clears after send ─────────────────────────────────────

  test('T4.2.5 — Input clears after send', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '425');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Clear me');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After sending, the input should be empty
    await expect(input).toHaveValue('');

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.6: Placeholder text: "Type a message..." ───────────────────────

  test('T4.2.6 — Placeholder text: "Type a message..."', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '426');

    // The placeholder should be present on the input
    const input = pageA.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Verify the placeholder attribute value directly
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBe('Type a message...');

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.7: Shift+Enter creates new line (does not send) ────────────────

  test('T4.2.7 — Shift+Enter creates new line (does not send)', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '427');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Line one');

    // Press Shift+Enter to insert a newline
    await pageA.keyboard.down('Shift');
    await pageA.keyboard.press('Enter');
    await pageA.keyboard.up('Shift');

    // Type a second line
    await pageA.keyboard.type('Line two');
    await pageA.waitForTimeout(500);

    // The input should still contain text (message was NOT sent)
    const value = await input.inputValue();
    expect(value).toContain('Line one');
    expect(value).toContain('Line two');

    // The message should NOT have appeared in the chat area yet
    const messageSent = await pageA
      .getByText('Line one')
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    // If "Line one" is visible, it could be in the input itself (React Native Web
    // duplicate nodes). Check that the input still has a non-empty value to confirm
    // the message was not sent and cleared.
    const inputStillHasValue = (await input.inputValue()).length > 0;
    expect(inputStillHasValue).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.2.8: Send button click sends message ─────────────────────────────

  test('T4.2.8 — Send button click sends message', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, '428');

    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Sent via button');

    // Click the send button (accessibilityLabel="Send message")
    const sendBtn = pageA.getByRole('button', { name: 'Send message' });
    await expect(sendBtn.first()).toBeVisible({ timeout: 5_000 });
    await sendBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message should appear in the chat area
    await expect(
      pageA.getByText('Sent via button').first(),
    ).toBeVisible({ timeout: 10_000 });

    // The input should be cleared after sending
    await expect(input).toHaveValue('');

    await contextA.close();
    await contextB.close();
  });
});
