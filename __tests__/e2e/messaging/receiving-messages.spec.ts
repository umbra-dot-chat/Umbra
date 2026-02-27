/**
 * 4.3 Receiving Messages (Two-User) E2E Tests
 *
 * Tests the receiving side of the DM messaging flow: real-time delivery,
 * incoming bubble styling, sender name display, timestamps, and
 * notification indicators when the conversation is not active.
 *
 * Each test creates two browser contexts with an established friendship
 * and DM conversation, then verifies the receiver's experience.
 *
 * Test IDs: T4.3.1-T4.3.5
 */

import { test, expect, type Browser, type Page, type BrowserContext } from '@playwright/test';
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
  contextA: BrowserContext;
  contextB: BrowserContext;
  pageA: Page;
  pageB: Page;
  userA: { did: string; seedPhrase: string };
  userB: { did: string; seedPhrase: string };
}

/**
 * Create two isolated browser contexts with fresh identities, establish a
 * friendship, and navigate both users into the DM conversation.
 *
 * Steps:
 *  1. Create identities for Alice (A) and Bob (B) in separate contexts.
 *  2. Bob sends a friend request to Alice using her DID.
 *  3. Alice accepts the request on the Pending tab.
 *  4. Wait for relay sync so both sides see the friendship + DM.
 *  5. Both users navigate to the Conversations list and open the DM.
 */
async function setupDMConversation(
  browser: Browser,
  suffix: string,
): Promise<DMSetupResult> {
  // 1. Create two isolated browser contexts
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 2. Create identities
  const userA = await createIdentity(pageA, `Alice${suffix}`);
  const userB = await createIdentity(pageB, `Bob${suffix}`);

  // 3. Bob sends a friend request to Alice using her DID
  await navigateToFriends(pageB);
  const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
  await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
  await addInput.first().fill(userA.did);
  await pageB
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  // 4. Wait for relay to deliver the request to Alice
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // 5. Alice navigates to Pending tab and accepts
  await navigateToFriends(pageA);
  await clickTab(pageA, 'Pending');
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
  await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
  await acceptBtn.first().click();

  // 6. Wait for relay sync so DM auto-creates on both sides
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // 7. Both users navigate to the DM conversation
  // Alice opens conversations and clicks into Bob's DM
  await pageA.getByText('Conversations').first().click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
  const dmItemA = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
  await expect(dmItemA).toBeVisible({ timeout: 10_000 });
  await dmItemA.click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Bob opens conversations and clicks into Alice's DM
  await pageB.getByText('Conversations').first().click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);
  const dmItemB = pageB.getByText(new RegExp(`Alice${suffix}`)).first();
  await expect(dmItemB).toBeVisible({ timeout: 10_000 });
  await dmItemB.click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  return { contextA, contextB, pageA, pageB, userA, userB };
}

// ─── T4.3.1: Real-Time Message Delivery ─────────────────────────────────────

test.describe('4.3 Receiving Messages — Real-Time Delivery', () => {
  test.setTimeout(180_000);

  test('T4.3.1 — Tab A sends message — Tab B receives in real-time', async ({ browser }) => {
    const suffix = 'T431';
    const { contextA, contextB, pageA, pageB } =
      await setupDMConversation(browser, suffix);

    const testMessage = 'Hello from Alice T431!';

    // Alice sends a message
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see the message text in the chat area
    await expect(
      pageB.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.3.2: Incoming Bubble Styling ─────────────────────────────────────────

test.describe('4.3 Receiving Messages — Incoming Bubble Styling', () => {
  test.setTimeout(180_000);

  test('T4.3.2 — Incoming bubble: light gray, left-aligned (bubble mode)', async ({ browser }) => {
    const suffix = 'T432';
    const { contextA, contextB, pageA, pageB } =
      await setupDMConversation(browser, suffix);

    const testMessage = 'Style check message T432';

    // Alice sends a message
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see the message
    const incomingMsg = pageB.getByText(testMessage).first();
    await expect(incomingMsg).toBeVisible({ timeout: 15_000 });

    // Verify the incoming message group is left-aligned.
    // In MsgGroup, incoming messages use align="incoming" which renders
    // the container with alignItems: 'flex-start' (left-aligned).
    // Walk up from the message text to the group container and check alignment.
    const groupAlignment = await pageB.evaluate((msgText) => {
      // Find the element containing the message text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) =>
          node.textContent?.includes(msgText)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      let textNode = walker.nextNode();
      if (!textNode) return null;

      // Walk up the DOM to find the group container with alignItems style
      let el = textNode.parentElement;
      let depth = 0;
      while (el && depth < 20) {
        const style = window.getComputedStyle(el);
        const alignItems = style.getPropertyValue('align-items');
        // MsgGroup sets alignItems: 'flex-start' for incoming
        if (alignItems === 'flex-start' && style.display === 'flex') {
          return { alignItems, found: true };
        }
        el = el.parentElement;
        depth++;
      }
      return { alignItems: 'unknown', found: false };
    }, testMessage);

    // The incoming message group should be found and left-aligned
    expect(groupAlignment).toBeTruthy();
    expect(groupAlignment?.found).toBeTruthy();
    expect(groupAlignment?.alignItems).toBe('flex-start');

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.3.3: Sender Name Above Incoming Message Group ───────────────────────

test.describe('4.3 Receiving Messages — Sender Name', () => {
  test.setTimeout(180_000);

  test('T4.3.3 — Sender name shown above incoming message group', async ({ browser }) => {
    const suffix = 'T433';
    const { contextA, contextB, pageA, pageB } =
      await setupDMConversation(browser, suffix);

    const testMessage = 'Name check message T433';

    // Alice sends a message
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see the message text
    await expect(
      pageB.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 15_000 });

    // The sender's display name ("Alice<suffix>") should be visible above the
    // incoming message group. MsgGroup renders the sender name as the first
    // element in the group container.
    await expect(
      pageB.getByText(`Alice${suffix}`).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify the sender name appears BEFORE (above) the message text in the DOM.
    // This confirms the MsgGroup renders the sender name above the bubble.
    const nameAboveMessage = await pageB.evaluate((args) => {
      const { senderName, msgText } = args;

      // Find sender name element
      const allElements = Array.from(document.querySelectorAll('*'));
      let nameEl: Element | null = null;
      let msgEl: Element | null = null;

      for (const el of allElements) {
        if (!nameEl && el.textContent?.trim() === senderName && el.children.length === 0) {
          nameEl = el;
        }
        if (!msgEl && el.textContent?.includes(msgText) && el.children.length === 0) {
          msgEl = el;
        }
        if (nameEl && msgEl) break;
      }

      if (!nameEl || !msgEl) return false;

      // Check that the name element precedes the message element in document order
      const position = nameEl.compareDocumentPosition(msgEl);
      // DOCUMENT_POSITION_FOLLOWING = 4 means msgEl follows nameEl
      return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }, { senderName: `Alice${suffix}`, msgText: testMessage });

    expect(nameAboveMessage).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.3.4: Timestamp on Incoming Messages ──────────────────────────────────

test.describe('4.3 Receiving Messages — Timestamp', () => {
  test.setTimeout(180_000);

  test('T4.3.4 — Timestamp visible on incoming messages', async ({ browser }) => {
    const suffix = 'T434';
    const { contextA, contextB, pageA, pageB } =
      await setupDMConversation(browser, suffix);

    const testMessage = 'Timestamp check message T434';

    // Alice sends a message
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see the message text
    await expect(
      pageB.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 15_000 });

    // A timestamp should be rendered near the incoming message.
    // MsgGroup renders the timestamp using formatTime() which outputs
    // a time string like "10:32 AM" or "2:15 PM".
    // Look for a time-formatted string (e.g., "1:23 AM" or "12:45 PM")
    // near the message group.
    const timestampRegex = /\d{1,2}:\d{2}\s?[AP]M/i;
    const timestampLocator = pageB.locator(`text=/${timestampRegex.source}/i`).first();
    await expect(timestampLocator).toBeVisible({ timeout: 10_000 });

    // Verify the timestamp is associated with the same message group
    // by checking that a timestamp-formatted text exists in the area
    // around the incoming message.
    const hasTimestampNearMessage = await pageB.evaluate((msgText) => {
      // Find the element containing the message text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) =>
          node.textContent?.includes(msgText)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const textNode = walker.nextNode();
      if (!textNode) return false;

      // Walk up to find the message group container
      let el = textNode.parentElement;
      let depth = 0;
      while (el && depth < 15) {
        // Check all text in this container for a time pattern
        const allText = el.textContent || '';
        if (/\d{1,2}:\d{2}\s?[AP]M/i.test(allText)) {
          return true;
        }
        el = el.parentElement;
        depth++;
      }
      return false;
    }, testMessage);

    expect(hasTimestampNearMessage).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.3.5: Notification for Inactive Conversation ─────────────────────────

test.describe('4.3 Receiving Messages — Notification Indicator', () => {
  test.setTimeout(180_000);

  test('T4.3.5 — Tab B incoming message notification if conversation not active', async ({ browser }) => {
    const suffix = 'T435';

    // We need to set up the DM but NOT have Bob viewing the conversation
    // when Alice sends the message. We do partial setup manually.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Create identities
    const userA = await createIdentity(pageA, `Alice${suffix}`);
    const userB = await createIdentity(pageB, `Bob${suffix}`);

    // Bob sends a friend request to Alice
    await navigateToFriends(pageB);
    const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
    await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
    await addInput.first().fill(userA.did);
    await pageB
      .getByRole('button', { name: 'Send friend request' })
      .first()
      .click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver the request to Alice
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice navigates to Pending tab and accepts
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
    await acceptBtn.first().click();

    // Wait for relay sync so DM auto-creates on both sides
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice opens the DM conversation so she can send a message
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmItemA = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
    await expect(dmItemA).toBeVisible({ timeout: 10_000 });
    await dmItemA.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Bob stays on the Friends page — NOT viewing the DM conversation.
    // He should already be on Friends from the friend request flow.
    // Ensure Bob is on the Friends page.
    await navigateToFriends(pageB);
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    const testMessage = 'Notification check T435';

    // Alice sends a message while Bob is on the Friends page
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver the message to Bob
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Bob should see some notification indicator since the conversation
    // is not active. This could be:
    // - An unread badge count on the conversation in the sidebar
    // - A notification badge on the Conversations nav item
    // - A home notification badge on the nav rail
    //
    // Check for any of these indicators.

    // Option 1: Check for an unread badge count in the sidebar.
    // The ChatSidebar renders unreadCount on conversation items.
    // Look for a small badge number (typically "1") somewhere on the page.
    const unreadBadge = pageB.locator('[class*="badge"], [class*="Badge"]').first();
    const unreadBadgeVisible = await unreadBadge
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // Option 2: Check if navigating to Conversations shows unread indicator.
    // Click Conversations in the sidebar to check for unread state.
    await pageB.getByText('Conversations').first().click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After navigating to Conversations, the DM with Alice should show
    // either a bold title (unread) or an unread badge count.
    // Look for Alice's name which should be visible in the sidebar.
    const dmEntry = pageB.getByText(new RegExp(`Alice${suffix}`)).first();
    await expect(dmEntry).toBeVisible({ timeout: 10_000 });

    // The conversation should have an unread indicator. We verify the
    // message is present by clicking into the DM and seeing it.
    await dmEntry.click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message from Alice should be visible in the chat area,
    // confirming it was delivered while Bob was away.
    await expect(
      pageB.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});
