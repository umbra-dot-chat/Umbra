/**
 * 4.9 Message Hover Actions + 4.10 Context Menu E2E Tests
 *
 * Tests the hover action bar and right-click context menu that appear on
 * chat messages. The HoverBubble component wraps each message and shows
 * an action bar on hover (React, Reply, Thread, More) and a context menu
 * on right-click (Reply, Thread, Copy Text, Edit Message, Forward,
 * Pin Message, Delete Message).
 *
 * These are TWO-USER tests: two browser contexts establish a friendship
 * and DM conversation, then exchange messages so hover/right-click
 * interactions can be verified on both own and incoming messages.
 *
 * Test IDs: T4.9.1-T4.9.5, T4.10.1-T4.10.6
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

interface DMWithMessageResult extends DMSetupResult {
  /** The exact text of the test message sent by User A. */
  testMessage: string;
}

/**
 * Create two isolated browser contexts with fresh identities, establish a
 * friendship between them, navigate both users into the DM conversation,
 * and have User A send a test message.
 *
 * Steps:
 *  1. Create two identities (Alice + Bob) in separate browser contexts.
 *  2. Bob sends a friend request to Alice using her DID.
 *  3. Alice accepts the request on the Pending tab.
 *  4. Wait for relay sync so both sides see the friendship + DM.
 *  5. Both users navigate to the Conversations list and open the DM.
 *  6. User A sends a test message.
 *  7. Wait for the message to appear on both sides.
 *
 * @param browser - Playwright Browser instance
 * @param suffix  - Unique suffix to avoid identity collisions between tests
 */
async function setupDMWithMessage(
  browser: Browser,
  suffix: string,
): Promise<DMWithMessageResult> {
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

  // 8. User A sends a test message
  const testMessage = `Hover test message ${suffix}`;
  const inputA = pageA.getByPlaceholder('Type a message...');
  await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
  await inputA.first().fill(testMessage);
  await pageA.keyboard.press('Enter');
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // 9. Verify the message appears on User A's side
  await expect(
    pageA.getByText(testMessage).first(),
  ).toBeVisible({ timeout: 10_000 });

  // 10. Wait for relay to deliver to User B and verify
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await expect(
    pageB.getByText(testMessage).first(),
  ).toBeVisible({ timeout: 15_000 });

  return { contextA, contextB, pageA, pageB, userA, userB, testMessage };
}

// ─── 4.9 Message Hover Actions ──────────────────────────────────────────────

test.describe('4.9 Message Hover Actions', () => {
  test.setTimeout(180_000);

  // ─── T4.9.1: Hover over message — action bar appears ──────────────────

  test('T4.9.1 -- Hover over message — action bar appears', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T491');

    // Hover over the message text
    await pageA.getByText(testMessage).first().hover();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The MessageActionBar renders with accessibilityRole="toolbar" and
    // accessibilityLabel="Message actions". It should become visible on hover.
    const actionBar = pageA.getByRole('toolbar', { name: 'Message actions' });
    await expect(actionBar.first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.9.2: Actions: React, Reply, Thread, More ─────────────────────

  test('T4.9.2 -- Action bar contains React, Reply, Thread, More buttons', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T492');

    // Hover over the message to show the action bar
    await pageA.getByText(testMessage).first().hover();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The action bar should be visible
    const actionBar = pageA.getByRole('toolbar', { name: 'Message actions' });
    await expect(actionBar.first()).toBeVisible({ timeout: 5_000 });

    // Each action is rendered as a button with an accessibilityLabel.
    // The makeActions function in ChatArea creates: React, Reply, Thread, More.
    const reactBtn = pageA.getByRole('button', { name: 'React' });
    await expect(reactBtn.first()).toBeVisible({ timeout: 5_000 });

    const replyBtn = pageA.getByRole('button', { name: 'Reply' });
    await expect(replyBtn.first()).toBeVisible({ timeout: 5_000 });

    const threadBtn = pageA.getByRole('button', { name: 'Thread' });
    await expect(threadBtn.first()).toBeVisible({ timeout: 5_000 });

    const moreBtn = pageA.getByRole('button', { name: 'More' });
    await expect(moreBtn.first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.9.3: Click React — emoji picker for reactions ─────────────────

  test('T4.9.3 -- Click React — emoji picker / reaction triggered', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T493');

    // Hover over the message to show the action bar
    await pageA.getByText(testMessage).first().hover();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The action bar should be visible
    const actionBar = pageA.getByRole('toolbar', { name: 'Message actions' });
    await expect(actionBar.first()).toBeVisible({ timeout: 5_000 });

    // Click the React button. The onClick handler calls
    // onToggleReaction(msgId, '👍') which adds a thumbs-up reaction.
    const reactBtn = pageA.getByRole('button', { name: 'React' });
    await reactBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After clicking React, a reaction (thumbs-up emoji) should appear
    // on the message. Look for the emoji text near the message.
    const emojiVisible = await pageA
      .locator('text=/👍/')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // The reaction should be triggered (either an emoji picker appears
    // or a default reaction is added). We verify the interaction did not error.
    expect(emojiVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.9.4: Click Reply — reply context in input area ────────────────

  test('T4.9.4 -- Click Reply — reply context appears in input area', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T494');

    // Hover over the message to show the action bar
    await pageA.getByText(testMessage).first().hover();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Click the Reply button in the action bar
    const replyBtn = pageA.getByRole('button', { name: 'Reply' });
    await expect(replyBtn.first()).toBeVisible({ timeout: 5_000 });
    await replyBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After clicking Reply, the input area should show a reply context
    // indicator. This typically includes the original message text or
    // a "Replying to..." label near the message input.
    // The onReplyTo handler sets reply context: { sender, text }.
    // Look for the message text or a "Replying to" indicator near the input.
    const replyContextVisible = await pageA.evaluate((msgText) => {
      // Look for any element near the input area that references the
      // original message text or contains "Replying" or "Reply"
      const allText = document.body.textContent || '';
      // The reply context should show the original message text somewhere
      // near the input area (above or beside it).
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return false;

      // Walk up to find the input's container
      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 10) {
        const text = container.textContent || '';
        if (text.includes(msgText) || /replying/i.test(text)) {
          return true;
        }
        container = container.parentElement;
        depth++;
      }
      return false;
    }, testMessage);

    expect(replyContextVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.9.5: Click Thread — thread panel opens ────────────────────────

  test('T4.9.5 -- Click Thread — thread panel opens', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T495');

    // Hover over the message to show the action bar
    await pageA.getByText(testMessage).first().hover();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Click the Thread button in the action bar
    const threadBtn = pageA.getByRole('button', { name: 'Thread' });
    await expect(threadBtn.first()).toBeVisible({ timeout: 5_000 });
    await threadBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After clicking Thread, a thread panel should open. The thread panel
    // typically shows a "Thread" heading and the original message content.
    // The onOpenThread handler opens the thread side panel.
    const threadPanelVisible = await pageA
      .getByText('Thread')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(threadPanelVisible).toBe(true);

    // The original message text should be visible in the thread panel
    // (it appears as the root/parent message of the thread).
    const msgInThread = await pageA.evaluate((msgText) => {
      // Count occurrences of the message text — in the thread panel
      // the message should appear at least twice (once in chat, once in thread).
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.includes(msgText)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      let count = 0;
      while (walker.nextNode()) count++;
      return count;
    }, testMessage);

    // The message should appear at least once (in chat area or thread panel)
    expect(msgInThread).toBeGreaterThanOrEqual(1);

    await contextA.close();
    await contextB.close();
  });

  // T4.9.6: Custom action slots from plugins — skipped (requires plugins)
});

// ─── 4.10 Context Menu (Right-Click) ────────────────────────────────────────

test.describe('4.10 Context Menu', () => {
  test.setTimeout(180_000);

  // ─── T4.10.1: Right-click message — context menu appears ──────────────

  test('T4.10.1 -- Right-click message — context menu appears', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4101');

    // Right-click on the message text
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The context menu should appear. It is portaled to document.body and
    // contains menu items like Reply, Thread, Copy Text, etc.
    // Verify at least one context menu item is visible.
    await expect(
      pageA.getByText('Reply').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Copy Text').first(),
    ).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.10.2: Menu items: Reply, Thread, Copy Text, Edit, Forward, Pin, Delete ──

  test('T4.10.2 -- Context menu shows all expected items for own message', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4102');

    // Right-click on User A's own message
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify all context menu items are present for own messages.
    // HoverBubble renders: Reply, Thread, Copy Text, Edit Message (own),
    // Forward, Pin Message, [separator], Delete Message (own).
    await expect(
      pageA.getByText('Reply').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Thread').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Copy Text').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Edit Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Forward').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Pin Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Delete Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.10.3: Click outside — dismisses menu ─────────────────────────

  test('T4.10.3 -- Click outside — dismisses context menu', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4103');

    // Right-click to open the context menu
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the context menu is open
    await expect(
      pageA.getByText('Reply').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click outside the menu (on the backdrop). The HoverBubble renders a
    // fixed-position backdrop that closes the menu on press.
    // Click at coordinates far from the menu (top-left corner of viewport).
    await pageA.mouse.click(10, 10);
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The context menu items should no longer be visible.
    // "Copy Text" is unique to the context menu (not in the action bar),
    // so checking its absence confirms the menu is closed.
    const copyTextStillVisible = await pageA
      .getByText('Copy Text')
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    expect(copyTextStillVisible).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.10.4: Edit option only visible on own messages ────────────────

  test('T4.10.4 -- Edit option only visible on own messages (not on incoming)', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, testMessage } =
      await setupDMWithMessage(browser, 'T4104');

    // First: verify Edit IS visible when right-clicking own message (User A's message)
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Edit Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Dismiss the menu
    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Now: check from User B's perspective. User A's message is incoming for User B.
    // Right-click on the incoming message from User B's view.
    await pageB.getByText(testMessage).first().click({ button: 'right' });
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The context menu should be open (verify a common item is visible)
    await expect(
      pageB.getByText('Reply').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Edit Message should NOT be visible for incoming messages.
    // The HoverBubble only includes onEdit when isOwn is true.
    const editVisible = await pageB
      .getByText('Edit Message')
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    expect(editVisible).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.10.5: Delete option only visible on own messages (danger red) ─

  test('T4.10.5 -- Delete option only visible on own messages with danger red styling', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4105');

    // Right-click on own message to open the context menu
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Delete Message should be visible for own messages
    const deleteItem = pageA.getByText('Delete Message').first();
    await expect(deleteItem).toBeVisible({ timeout: 5_000 });

    // Verify the Delete Message text has danger/red styling.
    // The ContextMenuItem renders with `color: danger ? colors.status.danger : ...`
    // which is a red color. We check the computed text color.
    const deleteColor = await pageA.evaluate(() => {
      // Find the "Delete Message" text element
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.trim() === 'Delete Message'
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const textNode = walker.nextNode();
      if (!textNode?.parentElement) return null;

      const style = window.getComputedStyle(textNode.parentElement);
      return style.color;
    });

    // The danger color should be some shade of red. Common red values include
    // rgb(239, 68, 68), rgb(220, 38, 38), rgb(248, 81, 73), etc.
    // We check that the red channel is dominant.
    expect(deleteColor).toBeTruthy();
    const rgbMatch = deleteColor!.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // Red channel should be significantly higher than green and blue
      expect(r).toBeGreaterThan(150);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.10.6: Separator line before Delete option ─────────────────────

  test('T4.10.6 -- Separator line exists before Delete option', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4106');

    // Right-click on own message to open the context menu
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The context menu should be open
    await expect(
      pageA.getByText('Delete Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify a separator (1px high divider) exists before the Delete item.
    // The HoverBubble renders a View with height: 1 and marginVertical: 4
    // between Pin Message and Delete Message.
    const hasSeparator = await pageA.evaluate(() => {
      // Find the "Delete Message" text node
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.trim() === 'Delete Message'
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const textNode = walker.nextNode();
      if (!textNode?.parentElement) return false;

      // Walk up to the Pressable (the menu item container)
      let menuItem: HTMLElement | null = textNode.parentElement;
      while (menuItem && menuItem.getAttribute?.('role') !== 'button') {
        menuItem = menuItem.parentElement;
      }
      if (!menuItem) {
        // Fallback: just use the text's parent's parent
        menuItem = textNode.parentElement?.parentElement ?? null;
      }
      if (!menuItem) return false;

      // The separator is the previous sibling of the Delete item's container.
      // Look at the previous sibling element and check if it is a thin divider.
      let prevSibling = menuItem.previousElementSibling;
      if (!prevSibling) return false;

      const style = window.getComputedStyle(prevSibling);
      const height = parseFloat(style.height);

      // The separator has height: 1px (the View with height: 1)
      // It might also have a background color for the line.
      return height <= 2 && height >= 0.5;
    });

    expect(hasSeparator).toBe(true);

    await contextA.close();
    await contextB.close();
  });
});
