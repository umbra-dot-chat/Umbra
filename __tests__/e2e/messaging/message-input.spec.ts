/**
 * 4.5 Message Input Features E2E Tests
 *
 * Tests the interactive elements of the MessageInput component within a DM
 * conversation: emoji picker toggle, attachment button, send button shape,
 * and mention highlighting as the user types.
 *
 * These are TWO-USER tests: two browser contexts establish a friendship
 * and User A opens the DM conversation with User B before each test.
 *
 * Test IDs: T4.5.1-T4.5.4
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

// ─── T4.5.1: Emoji button opens combined emoji/GIF picker ──────────────────

test.describe('4.5 Message Input Features', () => {
  test.setTimeout(180_000);

  test('T4.5.1 — Emoji button opens combined emoji/GIF picker', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, 'T451');

    // The MessageInput component renders an emoji button with
    // accessibilityLabel="Add emoji" when showEmoji is true.
    const emojiBtn = pageA.getByRole('button', { name: 'Add emoji' });
    await expect(emojiBtn.first()).toBeVisible({ timeout: 5_000 });

    // Click the emoji button to open the CombinedPicker
    await emojiBtn.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The CombinedPicker should now be visible. It renders tab buttons with
    // accessibilityRole="tab" for "Emoji" and "Stickers" tabs.
    // Verify the picker is open by checking for the "Emoji" tab.
    const emojiTab = pageA.locator('[role="tab"]').filter({ hasText: 'Emoji' }).first();
    await expect(emojiTab).toBeVisible({ timeout: 5_000 });

    // The close backdrop should also be present (accessibilityLabel="Close picker")
    const closeBackdrop = pageA.getByLabel('Close picker');
    await expect(closeBackdrop.first()).toBeVisible({ timeout: 5_000 });

    // Close the picker by clicking the backdrop
    await closeBackdrop.first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the picker is dismissed — the tab should no longer be visible
    const emojiTabAfterClose = pageA.locator('[role="tab"]').filter({ hasText: 'Emoji' }).first();
    await expect(emojiTabAfterClose).not.toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.5.2: Attachment/file button visible — opens file picker ─────────

  test('T4.5.2 — Attachment/file button visible — opens file picker', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, 'T452');

    // The MessageInput renders an attachment button with
    // accessibilityLabel="Attach file" when showAttachment is true.
    // In the ChatInput component, showAttachment={!editing}, so in normal
    // (non-editing) mode the button should be visible.
    const attachBtn = pageA.getByRole('button', { name: 'Attach file' });
    await expect(attachBtn.first()).toBeVisible({ timeout: 5_000 });

    // Verify the button is clickable. Clicking it triggers onAttachmentClick
    // which opens a native file picker dialog. We cannot directly verify the
    // file picker dialog opens (native OS dialog), but we can verify the
    // button is enabled and interactable by checking it is not disabled.
    const isDisabled = await attachBtn.first().evaluate((el) => {
      // React Native Web Pressable renders as div[role="button"].
      // Check for aria-disabled or a disabled data attribute.
      return (
        el.getAttribute('aria-disabled') === 'true' ||
        el.hasAttribute('disabled')
      );
    });
    expect(isDisabled).toBe(false);

    // Additionally verify the button contains the paperclip icon by checking
    // that an SVG element is present within the button.
    const hasSvg = await attachBtn.first().evaluate((el) => {
      return el.querySelector('svg') !== null;
    });
    expect(hasSvg).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.5.3: Send button centered in circle shape ─────────────────────

  test('T4.5.3 — Send button centered in circle shape', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, 'T453');

    // The send button has accessibilityLabel="Send message". It is always
    // rendered but disabled when the input is empty.
    const sendBtn = pageA.getByRole('button', { name: 'Send message' });
    await expect(sendBtn.first()).toBeVisible({ timeout: 5_000 });

    // Verify the send button is a circle: width === height and
    // borderRadius >= width/2 (making it fully rounded).
    const shapeInfo = await sendBtn.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      const width = parseFloat(style.width);
      const height = parseFloat(style.height);
      const borderRadius = parseFloat(style.borderRadius);
      const alignItems = style.alignItems;
      const justifyContent = style.justifyContent;

      return { width, height, borderRadius, alignItems, justifyContent };
    });

    // Width and height should be equal (square/circle)
    expect(shapeInfo.width).toBe(shapeInfo.height);

    // Border radius should be at least half the width, making it a circle
    expect(shapeInfo.borderRadius).toBeGreaterThanOrEqual(shapeInfo.width / 2);

    // Content should be centered (the SendIcon is centered inside the button)
    expect(shapeInfo.alignItems).toBe('center');
    expect(shapeInfo.justifyContent).toBe('center');

    // Type some text so the button becomes enabled, then verify it remains
    // circular and is now interactable.
    const input = pageA.getByPlaceholder('Type a message...');
    await input.fill('Circle check');
    await pageA.waitForTimeout(500);

    const enabledShapeInfo = await sendBtn.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      const width = parseFloat(style.width);
      const height = parseFloat(style.height);
      const borderRadius = parseFloat(style.borderRadius);
      return { width, height, borderRadius };
    });

    // Still a circle when enabled
    expect(enabledShapeInfo.width).toBe(enabledShapeInfo.height);
    expect(enabledShapeInfo.borderRadius).toBeGreaterThanOrEqual(
      enabledShapeInfo.width / 2,
    );

    await contextA.close();
    await contextB.close();
  });

  // ─── T4.5.4: Mention highlighting renders inline as you type ──────────

  test('T4.5.4 — Mention highlighting renders inline as you type', async ({ browser }) => {
    const { contextA, contextB, pageA } = await setupDMConversation(browser, 'T454');

    // The input should be visible and ready
    const input = pageA.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Type a mention using Bob's display name. The ChatInput component has
    // highlightMentions enabled and builds mentionNames from the friends list.
    // When we type @Bob<suffix>, the mention overlay should render with a
    // highlighted span (color = themeColors.status.info, fontWeight: '600').
    //
    // First, type the @ character followed by the friend's name.
    await input.fill('@BobT454');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The MessageInput renders a mention highlight overlay when:
    //   - Platform.OS === 'web'
    //   - highlightMentions is true
    //   - mentionParts is non-empty (text matches @<mentionName>)
    //
    // The overlay is a <Text aria-hidden> element positioned absolutely over
    // the input. Inside it, matched @mentions are rendered as <Text> spans
    // with a distinct color (themeColors.status.info) and fontWeight '600'.
    //
    // When the overlay is active, the actual input text becomes transparent
    // (color: 'transparent') so the overlay text shows through.
    //
    // Verify: look for a mention-highlighted span inside the overlay.
    const mentionHighlightInfo = await pageA.evaluate((mentionText) => {
      // The mention overlay is an aria-hidden Text element that sits over the input.
      // Find elements with aria-hidden="true" that contain the mention text.
      const overlayElements = document.querySelectorAll('[aria-hidden="true"]');
      for (const overlay of overlayElements) {
        // Check if this overlay contains the mention text
        if (!overlay.textContent?.includes(mentionText)) continue;

        // Look for a child span/text element that has the mention styling
        const allSpans = overlay.querySelectorAll('*');
        for (const span of allSpans) {
          const text = span.textContent?.trim();
          if (!text?.includes(mentionText)) continue;

          // Check if this span has the highlight styling
          const style = window.getComputedStyle(span);
          const color = style.color;
          const fontWeight = style.fontWeight;

          // The mention highlight uses themeColors.status.info color
          // and fontWeight: '600'. If fontWeight is 600 or bold, it is
          // the highlighted mention.
          if (fontWeight === '600' || fontWeight === 'bold') {
            return {
              found: true,
              color,
              fontWeight,
              text: text,
            };
          }
        }
      }
      return { found: false, color: '', fontWeight: '', text: '' };
    }, '@BobT454');

    expect(mentionHighlightInfo.found).toBe(true);
    expect(mentionHighlightInfo.fontWeight).toBe('600');

    // Verify the actual input text is transparent (the overlay draws the
    // colored text on top). When showMentionOverlay is true, the TextInput
    // gets style: { color: 'transparent', caretColor: <theme text color> }.
    const inputTextColor = await input.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });

    // 'transparent' is serialized as 'rgba(0, 0, 0, 0)' in computed styles
    const isTransparent =
      inputTextColor === 'transparent' ||
      inputTextColor === 'rgba(0, 0, 0, 0)';
    expect(isTransparent).toBe(true);

    await contextA.close();
    await contextB.close();
  });
});
