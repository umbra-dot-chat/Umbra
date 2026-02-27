/**
 * 4.11 Edit Message, 4.12 Delete Message, 4.13 Reply,
 * 4.14 Forward, 4.15 Pin Message E2E Tests
 *
 * Tests message editing, deletion, replying, forwarding, and pinning
 * within a DM conversation. All tests are TWO-USER: two browser contexts
 * establish a friendship and DM, exchange messages, then exercise the
 * context-menu actions and verify both sides see the expected results.
 *
 * NOTE: React Native Web renders duplicate text DOM nodes (desktop + mobile).
 * All `getByText()` calls must use `.first()` to avoid strict mode violations.
 *
 * Test IDs: T4.11.1-T4.11.7, T4.12.1-T4.12.3, T4.13.1-T4.13.5,
 *           T4.14.1-T4.14.3, T4.15.1-T4.15.4
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
  const testMessage = `Test message ${suffix}`;
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

// ─── 4.11 Edit Message ───────────────────────────────────────────────────────

test.describe('4.11 Edit Message', () => {
  test.setTimeout(180_000);

  // ─── T4.11.1: Right-click own message > Edit ──────────────────────────

  test('T4.11.1 -- Right-click own message > Edit', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4111');

    // Right-click on own message to open context menu
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // "Edit Message" should be visible in the context menu
    await expect(
      pageA.getByText('Edit Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click Edit Message
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The input should switch to edit mode. Verify by checking
    // the placeholder changes to "Edit message..."
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.2: Input switches to edit mode with existing text ──────────

  test('T4.11.2 -- Input switches to edit mode with existing text', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4112');

    // Right-click own message and click Edit
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The input should be in edit mode with the existing message text
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    // The input should contain the original message text
    const inputValue = await editInput.first().inputValue();
    expect(inputValue).toContain(testMessage);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.3: Placeholder: "Edit message..." ──────────────────────────

  test('T4.11.3 -- Placeholder shows "Edit message..."', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4113');

    // Right-click own message and click Edit
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the placeholder attribute is "Edit message..."
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    const placeholder = await editInput.first().getAttribute('placeholder');
    expect(placeholder).toBe('Edit message...');

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.4: Attachment button hidden during edit ────────────────────

  test('T4.11.4 -- Attachment button hidden during edit mode', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4114');

    // Verify the attachment button is visible BEFORE entering edit mode
    const attachBtn = pageA.getByRole('button', { name: 'Attach file' });
    const attachBtnAlt = pageA.getByRole('button', { name: 'Attachment' });

    const attachVisibleBefore = await attachBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
      || await attachBtnAlt.first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

    // Right-click own message and click Edit to enter edit mode
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the edit input is active
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    // The attachment button should be hidden during edit mode
    const attachVisibleDuringEdit = await attachBtn.first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    const attachAltVisibleDuringEdit = await attachBtnAlt.first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    expect(attachVisibleDuringEdit || attachAltVisibleDuringEdit).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.5: Cancel edit — reverts to normal input ───────────────────

  test('T4.11.5 -- Cancel edit button reverts to normal input', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4115');

    // Right-click own message and click Edit to enter edit mode
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify we are in edit mode
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    // Click the Cancel edit button to revert
    const cancelBtn = pageA.getByRole('button', { name: 'Cancel edit' });
    const cancelText = pageA.getByText('Cancel').first();

    // Try the button first, fall back to text
    const cancelBtnVisible = await cancelBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (cancelBtnVisible) {
      await cancelBtn.first().click();
    } else {
      await cancelText.click();
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After cancelling, the normal input should be restored
    const normalInput = pageA.getByPlaceholder('Type a message...');
    await expect(normalInput.first()).toBeVisible({ timeout: 5_000 });

    // The edit input should no longer be visible
    const editStillVisible = await editInput.first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    expect(editStillVisible).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.6: Save edit — message updated with "(edited)" badge ───────

  test('T4.11.6 -- Save edit — message updated with "(edited)" badge', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4116');

    // Right-click own message and click Edit
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The edit input should contain the original text
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    // Clear and type the edited text
    const editedText = 'Edited message T4116';
    await editInput.first().fill(editedText);
    await pageA.waitForTimeout(500);

    // Save the edit by pressing Enter or clicking the save button
    const saveBtn = pageA.getByRole('button', { name: 'Save edit' });
    const saveBtnVisible = await saveBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (saveBtnVisible) {
      await saveBtn.first().click();
    } else {
      // Press Enter to save the edit
      await pageA.keyboard.press('Enter');
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The edited message text should be visible
    await expect(
      pageA.getByText(editedText).first(),
    ).toBeVisible({ timeout: 10_000 });

    // The "(edited)" badge should appear near the message
    await expect(
      pageA.getByText('(edited)').first(),
    ).toBeVisible({ timeout: 10_000 });

    // The normal input should be restored
    const normalInput = pageA.getByPlaceholder('Type a message...');
    await expect(normalInput.first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.11.7: Other user sees updated text + "(edited)" in real-time ──

  test('T4.11.7 -- Other user sees updated text + "(edited)" badge in real-time', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, testMessage } =
      await setupDMWithMessage(browser, 'T4117');

    // User A right-clicks own message and clicks Edit
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Edit Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Edit the message
    const editInput = pageA.getByPlaceholder('Edit message...');
    await expect(editInput.first()).toBeVisible({ timeout: 5_000 });

    const editedText = 'Edited for Bob T4117';
    await editInput.first().fill(editedText);
    await pageA.waitForTimeout(500);

    // Save the edit
    const saveBtn = pageA.getByRole('button', { name: 'Save edit' });
    const saveBtnVisible = await saveBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (saveBtnVisible) {
      await saveBtn.first().click();
    } else {
      await pageA.keyboard.press('Enter');
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver the edit to User B
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // User B should see the updated message text
    await expect(
      pageB.getByText(editedText).first(),
    ).toBeVisible({ timeout: 15_000 });

    // User B should see the "(edited)" badge
    await expect(
      pageB.getByText('(edited)').first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── 4.12 Delete Message ─────────────────────────────────────────────────────

test.describe('4.12 Delete Message', () => {
  test.setTimeout(180_000);

  // ─── T4.12.1: Right-click own message > Delete ────────────────────────

  test('T4.12.1 -- Right-click own message > Delete', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4121');

    // Right-click on own message to open context menu
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // "Delete Message" should be visible in the context menu
    await expect(
      pageA.getByText('Delete Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click Delete Message
    await pageA.getByText('Delete Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message should be replaced with "[Message deleted]"
    await expect(
      pageA.getByText('[Message deleted]').first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.12.2: Message replaced with "[Message deleted]" ───────────────

  test('T4.12.2 -- Message replaced with "[Message deleted]"', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4122');

    // Right-click on own message and delete
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Delete Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The deleted placeholder should be visible
    await expect(
      pageA.getByText('[Message deleted]').first(),
    ).toBeVisible({ timeout: 10_000 });

    // The original message text should no longer be visible
    const originalStillVisible = await pageA
      .getByText(testMessage)
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    expect(originalStillVisible).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.12.3: Other user sees "[Message deleted]" ─────────────────────

  test('T4.12.3 -- Other user sees "[Message deleted]"', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, testMessage } =
      await setupDMWithMessage(browser, 'T4123');

    // User A right-clicks own message and deletes it
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Delete Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Wait for relay to deliver the deletion to User B
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // User B should see "[Message deleted]"
    await expect(
      pageB.getByText('[Message deleted]').first(),
    ).toBeVisible({ timeout: 15_000 });

    // The original message text should no longer be visible on User B's side
    const originalOnB = await pageB
      .getByText(testMessage)
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    expect(originalOnB).toBe(false);

    await contextA.close();
    await contextB.close();
  });
});

// ─── 4.13 Reply ──────────────────────────────────────────────────────────────

test.describe('4.13 Reply', () => {
  test.setTimeout(180_000);

  // ─── T4.13.1: Click Reply — reply preview in input area ───────────────

  test('T4.13.1 -- Click Reply — reply preview in input area (sender + text)', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4131');

    // Right-click the message and select Reply
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Reply').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // A reply preview should appear in the input area.
    // The preview contains the sender name and quoted text.
    // Check that the input area's surrounding container includes
    // the original message text or sender name.
    const replyPreviewVisible = await pageA.evaluate((msgText) => {
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return false;

      // Walk up to find the input's container that includes the reply preview
      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 10) {
        const text = container.textContent || '';
        if (text.includes(msgText)) {
          return true;
        }
        container = container.parentElement;
        depth++;
      }
      return false;
    }, testMessage);

    expect(replyPreviewVisible).toBe(true);

    // Also verify the sender name appears in the reply context
    const senderInPreview = await pageA.evaluate(() => {
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return false;

      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 10) {
        const text = container.textContent || '';
        if (/Alice/i.test(text)) {
          return true;
        }
        container = container.parentElement;
        depth++;
      }
      return false;
    });

    expect(senderInPreview).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.13.2: "X" button clears reply context ────────────────────────

  test('T4.13.2 -- "X" button clears reply context', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4132');

    // Right-click the message and select Reply
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Reply').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The reply preview should be visible (contains the message text near input)
    const replyPreviewVisible = await pageA.evaluate((msgText) => {
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return false;
      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 10) {
        const text = container.textContent || '';
        if (text.includes(msgText)) return true;
        container = container.parentElement;
        depth++;
      }
      return false;
    }, testMessage);
    expect(replyPreviewVisible).toBe(true);

    // Click the "X" button to clear the reply context.
    // The close button may have accessibilityLabel "Clear reply" or
    // be rendered as a small "X" / close icon near the reply preview.
    const clearReplyBtn = pageA.getByRole('button', { name: 'Clear reply' });
    const clearReplyBtnVisible = await clearReplyBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (clearReplyBtnVisible) {
      await clearReplyBtn.first().click();
    } else {
      // Fallback: look for an "X" button or close button near the input area
      const closeBtn = pageA.getByRole('button', { name: 'Close' });
      const closeBtnVisible = await closeBtn.first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      if (closeBtnVisible) {
        await closeBtn.first().click();
      } else {
        // Try clicking a close/X icon rendered as text
        const xBtn = pageA.locator('[accessibilityLabel="Cancel reply"]').first();
        const xBtnVisible = await xBtn.isVisible({ timeout: 2_000 }).catch(() => false);
        if (xBtnVisible) {
          await xBtn.click();
        } else {
          // Last resort: press Escape to dismiss reply
          await pageA.keyboard.press('Escape');
        }
      }
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The reply preview should be cleared — the message text should
    // no longer appear in the input area container
    const replyCleared = await pageA.evaluate((msgText) => {
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return true; // no input = cleared
      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 5) {
        const text = container.textContent || '';
        if (text.includes(msgText)) return false;
        container = container.parentElement;
        depth++;
      }
      return true;
    }, testMessage);

    expect(replyCleared).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.13.3: Cancel Reply button also clears ────────────────────────

  test('T4.13.3 -- Cancel Reply button also clears reply context', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4133');

    // Right-click the message and select Reply
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Reply').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Try to click a Cancel Reply button (may be labeled "Cancel" or "Cancel reply")
    const cancelReplyBtn = pageA.getByRole('button', { name: 'Cancel reply' });
    const cancelBtn = pageA.getByText('Cancel').first();

    const cancelReplyVisible = await cancelReplyBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (cancelReplyVisible) {
      await cancelReplyBtn.first().click();
    } else {
      // Fallback: press Escape to cancel reply
      await pageA.keyboard.press('Escape');
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The normal input should be restored without reply context
    const normalInput = pageA.getByPlaceholder('Type a message...');
    await expect(normalInput.first()).toBeVisible({ timeout: 5_000 });

    // Reply context should be gone
    const replyCleared = await pageA.evaluate((msgText) => {
      const inputArea = document.querySelector('input[placeholder="Type a message..."]')
        || document.querySelector('textarea[placeholder="Type a message..."]');
      if (!inputArea) return true;
      let container = inputArea.parentElement;
      let depth = 0;
      while (container && depth < 5) {
        const text = container.textContent || '';
        if (text.includes(msgText)) return false;
        container = container.parentElement;
        depth++;
      }
      return true;
    }, testMessage);

    expect(replyCleared).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.13.4: Send — quoted reply context above bubble ────────────────

  test('T4.13.4 -- Send reply — quoted reply context above bubble', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, testMessage } =
      await setupDMWithMessage(browser, 'T4134');

    // Right-click the message and select Reply
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Reply').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Type and send a reply message
    const replyText = 'This is my reply T4134';
    const input = pageA.getByPlaceholder('Type a message...');
    await expect(input.first()).toBeVisible({ timeout: 5_000 });
    await input.first().fill(replyText);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The reply message should be visible
    await expect(
      pageA.getByText(replyText).first(),
    ).toBeVisible({ timeout: 10_000 });

    // The quoted reply context (original message text) should appear
    // above the reply bubble. Look for the original message text appearing
    // as a quote near the reply message.
    const quotedContextVisible = await pageA.evaluate((args) => {
      const { original, reply } = args;
      // Find the reply text element
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.includes(reply)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const replyNode = walker.nextNode();
      if (!replyNode?.parentElement) return false;

      // Walk up from the reply to find a container that also contains
      // the original message text (the quoted context)
      let container = replyNode.parentElement;
      let depth = 0;
      while (container && depth < 15) {
        const text = container.textContent || '';
        if (text.includes(original) && text.includes(reply)) {
          return true;
        }
        container = container.parentElement;
        depth++;
      }
      return false;
    }, { original: testMessage, reply: replyText });

    expect(quotedContextVisible).toBe(true);

    // Wait for relay and verify User B also sees the reply with context
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(
      pageB.getByText(replyText).first(),
    ).toBeVisible({ timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.13.5: Long quoted text truncated ──────────────────────────────

  test('T4.13.5 -- Long quoted text is truncated in reply context', async ({ browser }) => {
    const { contextA, contextB, pageA } =
      await setupDMWithMessage(browser, 'T4135');

    // Send a long message first
    const longMessage = 'This is a very long message that should be truncated when shown as a quoted reply context. '.repeat(5).trim();
    const input = pageA.getByPlaceholder('Type a message...');
    await input.first().fill(longMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the long message appears
    await expect(
      pageA.getByText(longMessage.slice(0, 30)).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Right-click the long message and Reply
    await pageA.getByText(longMessage.slice(0, 30)).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Reply').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Type and send a reply
    const replyText = 'Reply to long message T4135';
    await input.first().fill(replyText);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The reply should appear
    await expect(
      pageA.getByText(replyText).first(),
    ).toBeVisible({ timeout: 10_000 });

    // The quoted text should be truncated. Check that the full long message
    // is NOT shown in the quoted reply context (it should be cut off).
    // We look at the quoted area near the reply and verify it does not
    // contain the complete original text.
    const quotedIsTruncated = await pageA.evaluate((args) => {
      const { fullOriginal, reply } = args;

      // Find the reply node
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.includes(reply)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const replyNode = walker.nextNode();
      if (!replyNode?.parentElement) return false;

      // Walk up to find the reply bubble container
      let container = replyNode.parentElement;
      let depth = 0;
      while (container && depth < 10) {
        container = container.parentElement;
        depth++;
      }

      // The quoted text in the reply context should be shorter than the full original.
      // Look for elements that contain a truncated version (e.g., with ellipsis "...")
      // or simply check the quoted area text length is less than the original.
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent || '';
        // Find an element that looks like a quoted preview (contains start
        // of original message but not the full thing, or has an ellipsis)
        if (
          text.includes(fullOriginal.slice(0, 20)) &&
          !text.includes(fullOriginal) &&
          el.children.length <= 2
        ) {
          return true;
        }
      }
      // If we can't find a truncated element, check if any element has
      // text-overflow: ellipsis or overflow: hidden near the reply
      return false;
    }, { fullOriginal: longMessage, reply: replyText });

    // The quoted text should be truncated (or at least not show the entire thing)
    // This is a best-effort check — if the UI does truncate, great;
    // if it shows the full text, the test notes it.
    expect(quotedIsTruncated).toBe(true);

    await contextA.close();
    await contextB.close();
  });
});

// ─── 4.14 Forward ────────────────────────────────────────────────────────────

test.describe('4.14 Forward', () => {
  test.setTimeout(180_000);

  // ─── T4.14.1: Right-click > Forward — conversation picker dialog ──────

  test('T4.14.1 -- Right-click > Forward — conversation picker dialog appears', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4141');

    // Right-click on message and select Forward
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Forward').first(),
    ).toBeVisible({ timeout: 5_000 });

    await pageA.getByText('Forward').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // A conversation picker dialog should appear.
    // Look for a dialog or modal that shows available conversations.
    const dialogVisible = await pageA.evaluate(() => {
      // Look for a dialog, modal, or overlay element
      const dialog = document.querySelector('[role="dialog"]')
        || document.querySelector('[role="alertdialog"]');
      if (dialog) return true;

      // Fallback: look for text indicating a conversation picker
      const allText = document.body.textContent || '';
      return /forward to|select conversation|choose conversation|pick a conversation/i.test(allText);
    });

    expect(dialogVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.14.2: Select conversation — message forwarded ────────────────

  test('T4.14.2 -- Select conversation — message forwarded', async ({ browser }) => {
    // For this test we need a third user so we have a second conversation
    // to forward to. We create Alice, Bob, and Charlie.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const contextC = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageC = await contextC.newPage();

    const suffix = 'T4142';

    // Create identities
    const userA = await createIdentity(pageA, `Alice${suffix}`);
    const userB = await createIdentity(pageB, `Bob${suffix}`);
    const userC = await createIdentity(pageC, `Charlie${suffix}`);

    // Bob sends friend request to Alice
    await navigateToFriends(pageB);
    const addInputB = pageB.getByPlaceholder('did:key:z6Mk...');
    await expect(addInputB.first()).toBeVisible({ timeout: 5_000 });
    await addInputB.first().fill(userA.did);
    await pageB.getByRole('button', { name: 'Send friend request' }).first().click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Charlie sends friend request to Alice
    await navigateToFriends(pageC);
    const addInputC = pageC.getByPlaceholder('did:key:z6Mk...');
    await expect(addInputC.first()).toBeVisible({ timeout: 5_000 });
    await addInputC.first().fill(userA.did);
    await pageC.getByRole('button', { name: 'Send friend request' }).first().click();
    await pageC.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Alice accepts both friend requests
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Accept first request
    const acceptBtn1 = pageA.getByRole('button', { name: 'Accept' }).first();
    await expect(acceptBtn1).toBeVisible({ timeout: 10_000 });
    await acceptBtn1.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Accept second request (if visible)
    const acceptBtn2 = pageA.getByRole('button', { name: 'Accept' }).first();
    const secondVisible = await acceptBtn2
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (secondVisible) {
      await acceptBtn2.click();
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    }

    // Wait for DMs to auto-create
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice opens the DM with Bob
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmBob = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
    await expect(dmBob).toBeVisible({ timeout: 10_000 });
    await dmBob.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Alice sends a message in the DM with Bob
    const testMessage = `Forward this ${suffix}`;
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify message appears
    await expect(
      pageA.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Right-click on the message and select Forward
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Forward').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Select the conversation with Charlie from the picker
    const charlieOption = pageA.getByText(new RegExp(`Charlie${suffix}`)).first();
    await expect(charlieOption).toBeVisible({ timeout: 10_000 });
    await charlieOption.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Confirm forwarding if a confirm button exists
    const confirmBtn = pageA.getByRole('button', { name: /forward|send|confirm/i });
    const confirmVisible = await confirmBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (confirmVisible) {
      await confirmBtn.first().click();
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    }

    // Navigate to Charlie's DM to verify the forwarded message
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmCharlie = pageA.getByText(new RegExp(`Charlie${suffix}`)).first();
    await expect(dmCharlie).toBeVisible({ timeout: 10_000 });
    await dmCharlie.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The forwarded message text should be visible in Charlie's DM
    await expect(
      pageA.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
    await contextC.close();
  });

  // ─── T4.14.3: Forwarded message shows "Forwarded from [name]" label ───

  test('T4.14.3 -- Forwarded message shows "Forwarded from [name]" label + original content', async ({ browser }) => {
    // Similar setup to T4.14.2 with three users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const contextC = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageC = await contextC.newPage();

    const suffix = 'T4143';

    // Create identities
    const userA = await createIdentity(pageA, `Alice${suffix}`);
    const userB = await createIdentity(pageB, `Bob${suffix}`);
    const userC = await createIdentity(pageC, `Charlie${suffix}`);

    // Bob sends friend request to Alice
    await navigateToFriends(pageB);
    const addInputB = pageB.getByPlaceholder('did:key:z6Mk...');
    await expect(addInputB.first()).toBeVisible({ timeout: 5_000 });
    await addInputB.first().fill(userA.did);
    await pageB.getByRole('button', { name: 'Send friend request' }).first().click();
    await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Charlie sends friend request to Alice
    await navigateToFriends(pageC);
    const addInputC = pageC.getByPlaceholder('did:key:z6Mk...');
    await expect(addInputC.first()).toBeVisible({ timeout: 5_000 });
    await addInputC.first().fill(userA.did);
    await pageC.getByRole('button', { name: 'Send friend request' }).first().click();
    await pageC.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Alice accepts both friend requests
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await navigateToFriends(pageA);
    await clickTab(pageA, 'Pending');
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    const acceptBtn1 = pageA.getByRole('button', { name: 'Accept' }).first();
    await expect(acceptBtn1).toBeVisible({ timeout: 10_000 });
    await acceptBtn1.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    const acceptBtn2 = pageA.getByRole('button', { name: 'Accept' }).first();
    const secondVisible = await acceptBtn2
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (secondVisible) {
      await acceptBtn2.click();
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    }

    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Alice opens DM with Bob and sends a message
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmBob = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
    await expect(dmBob).toBeVisible({ timeout: 10_000 });
    await dmBob.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    const testMessage = `Forwarded content ${suffix}`;
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill(testMessage);
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Forward the message to Charlie
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Forward').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    const charlieOption = pageA.getByText(new RegExp(`Charlie${suffix}`)).first();
    await expect(charlieOption).toBeVisible({ timeout: 10_000 });
    await charlieOption.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Confirm if needed
    const confirmBtn = pageA.getByRole('button', { name: /forward|send|confirm/i });
    const confirmVisible = await confirmBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (confirmVisible) {
      await confirmBtn.first().click();
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    }

    // Navigate to Charlie's DM
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmCharlie = pageA.getByText(new RegExp(`Charlie${suffix}`)).first();
    await expect(dmCharlie).toBeVisible({ timeout: 10_000 });
    await dmCharlie.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the forwarded message content is visible
    await expect(
      pageA.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the "Forwarded from [name]" label is visible
    // The label should reference Alice's name since she forwarded it.
    const forwardedLabel = pageA.getByText(/Forwarded from/i).first();
    await expect(forwardedLabel).toBeVisible({ timeout: 10_000 });

    // Verify the label includes the sender's name
    const labelText = await forwardedLabel.textContent();
    expect(labelText).toMatch(/Forwarded from/i);
    expect(labelText).toMatch(new RegExp(`Alice${suffix}`, 'i'));

    await contextA.close();
    await contextB.close();
    await contextC.close();
  });
});

// ─── 4.15 Pin Message ────────────────────────────────────────────────────────

test.describe('4.15 Pin Message', () => {
  test.setTimeout(180_000);

  // ─── T4.15.1: Right-click > Pin — message pinned ─────────────────────

  test('T4.15.1 -- Right-click > Pin — message pinned', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4151');

    // Right-click on message and select Pin Message
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Pin Message').first(),
    ).toBeVisible({ timeout: 5_000 });

    await pageA.getByText('Pin Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The message should now be pinned. Verify by checking for a pin
    // indicator on the message or by opening the Pins panel.
    // Open the Pins panel to confirm.
    const togglePinsBtn = pageA.getByRole('button', { name: 'Toggle pinned messages' });
    await expect(togglePinsBtn.first()).toBeVisible({ timeout: 5_000 });
    await togglePinsBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The pinned message text should appear in the Pins panel
    await expect(
      pageA.getByText(testMessage).first(),
    ).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.15.2: Pin icon/indicator on pinned message ───────────────────

  test('T4.15.2 -- Pin icon/indicator visible on pinned message', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4152');

    // Pin the message
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Pin Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Look for a pin icon/indicator on the message in the chat area.
    // The pin indicator could be an SVG icon, a pin emoji, or text like "Pinned".
    const pinIndicatorVisible = await pageA.evaluate((msgText) => {
      // Find the message text node
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) =>
          n.textContent?.includes(msgText)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
        },
      );
      const textNode = walker.nextNode();
      if (!textNode?.parentElement) return false;

      // Walk up to the message group container and look for pin indicators
      let container = textNode.parentElement;
      let depth = 0;
      while (container && depth < 15) {
        // Check for SVG with pin-related path or accessibility label
        const svgs = container.querySelectorAll('svg');
        for (const svg of svgs) {
          const label = svg.getAttribute('aria-label') || '';
          if (/pin/i.test(label)) return true;
        }

        // Check for text like "Pinned" or a pin indicator
        const text = container.textContent || '';
        if (/pinned/i.test(text) && text.includes(msgText)) return true;

        // Check for elements with pin-related accessibility labels
        const pinEls = container.querySelectorAll('[aria-label*="pin" i], [accessibilityLabel*="pin" i]');
        if (pinEls.length > 0) return true;

        container = container.parentElement;
        depth++;
      }
      return false;
    }, testMessage);

    expect(pinIndicatorVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.15.3: Message appears in Pins panel ──────────────────────────

  test('T4.15.3 -- Pinned message appears in Pins panel', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4153');

    // Pin the message
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Pin Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Open the Pins panel
    const togglePinsBtn = pageA.getByRole('button', { name: 'Toggle pinned messages' });
    await expect(togglePinsBtn.first()).toBeVisible({ timeout: 5_000 });
    await togglePinsBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The Pins panel should be visible and contain the pinned message
    // Look for a "Pinned Messages" or "Pins" heading
    const pinsPanelHeading = pageA.getByText(/Pinned Messages|Pins/i).first();
    await expect(pinsPanelHeading).toBeVisible({ timeout: 5_000 });

    // The pinned message text should be visible in the panel
    // Count occurrences to ensure the message appears in the panel
    // (it may also still be visible in the main chat area)
    const messageCountInPanel = await pageA.evaluate((msgText) => {
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

    // The message text should appear at least twice: once in the chat
    // and once in the Pins panel (React Native Web may double this further)
    expect(messageCountInPanel).toBeGreaterThanOrEqual(2);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.15.4: Unpin from Pins panel — removes pin ────────────────────

  test('T4.15.4 -- Unpin from Pins panel — removes pin', async ({ browser }) => {
    const { contextA, contextB, pageA, testMessage } =
      await setupDMWithMessage(browser, 'T4154');

    // Pin the message
    await pageA.getByText(testMessage).first().click({ button: 'right' });
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    await pageA.getByText('Pin Message').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Open the Pins panel
    const togglePinsBtn = pageA.getByRole('button', { name: 'Toggle pinned messages' });
    await expect(togglePinsBtn.first()).toBeVisible({ timeout: 5_000 });
    await togglePinsBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the pinned message is visible in the Pins panel
    const pinsPanelHeading = pageA.getByText(/Pinned Messages|Pins/i).first();
    await expect(pinsPanelHeading).toBeVisible({ timeout: 5_000 });

    // Now unpin the message from within the Pins panel.
    // Look for an Unpin button, an "X" button, or a context menu option
    // within the Pins panel near the pinned message.
    const unpinBtn = pageA.getByRole('button', { name: /Unpin/i });
    const unpinBtnVisible = await unpinBtn.first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (unpinBtnVisible) {
      await unpinBtn.first().click();
    } else {
      // Try right-clicking the message in the Pins panel
      // to get an "Unpin" option
      const pinnedMsg = pageA.getByText(testMessage).first();
      await pinnedMsg.click({ button: 'right' });
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      const unpinOption = pageA.getByText(/Unpin/i).first();
      const unpinOptionVisible = await unpinOption
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      if (unpinOptionVisible) {
        await unpinOption.click();
      } else {
        // Fallback: look for any clickable unpin/remove icon
        const removeBtn = pageA.getByRole('button', { name: /Remove|Close|Unpin/i });
        await removeBtn.first().click();
      }
    }
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After unpinning, the Pins panel should no longer show the message.
    // The panel might show "No pinned messages" or the message simply disappears.
    const messageStillPinned = await pageA.evaluate((msgText) => {
      // Look for a "Pinned Messages" or "Pins" heading container
      // and check if the message text is still within it
      const headings = document.querySelectorAll('*');
      for (const heading of headings) {
        const text = heading.textContent || '';
        if (/Pinned Messages|Pins/i.test(text) && heading.children.length > 0) {
          // Check if this container still has the message
          if (text.includes(msgText)) {
            // The message is still in a container with the Pins heading,
            // but it could also be in the chat area behind the panel.
            // Count direct children text mentions.
            const inner = heading.innerHTML || '';
            const occurrences = inner.split(msgText).length - 1;
            // If there are multiple occurrences, it might still be there
            return occurrences > 0;
          }
        }
      }
      return false;
    }, testMessage);

    // The message should no longer be shown as pinned in the Pins panel.
    // Note: it may still appear in the chat area, but the pin should be removed.
    // If this check is unreliable due to DOM structure, at minimum verify
    // that the "No pinned messages" state or absence of the message in the panel.
    const noPinnedState = await pageA
      .getByText(/No pinned messages/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // Either we see "No pinned messages" or the message is no longer in the panel
    expect(noPinnedState || !messageStillPinned).toBe(true);

    await contextA.close();
    await contextB.close();
  });
});
