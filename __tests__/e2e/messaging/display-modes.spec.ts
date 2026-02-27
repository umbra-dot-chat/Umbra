/**
 * 4.4 Message Display Modes E2E Tests
 *
 * Tests the two message display modes (Bubble and Inline) and the ability to
 * switch between them via Settings > Messaging > Display Style. These are
 * two-user tests that establish a DM conversation with both outgoing and
 * incoming messages so alignment and layout differences can be verified.
 *
 * - Bubble mode: Colored bubbles, outgoing right-aligned, incoming left-aligned
 * - Inline mode: Slack/Discord style, all left-aligned with sender name + timestamp headers
 * - Settings toggle switches between Bubble and Inline
 * - Mode change applies immediately to all conversations
 * - Live preview shown in settings for each mode
 *
 * Test IDs: T4.4.1-T4.4.5
 */

import { test, expect, type Browser, type Page, type BrowserContext } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToFriends,
  navigateToSettings,
  navigateToSettingsSection,
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
 * friendship between them, and return both pages ready with a DM conversation.
 *
 * Steps:
 *  1. Create two identities (Alice + Bob) in separate browser contexts
 *  2. Bob sends a friend request to Alice using her DID
 *  3. Alice accepts the request on the Pending tab
 *  4. Wait for relay sync so both sides see the friendship + DM
 */
async function establishDMConversation(
  browser: Browser,
  suffix: string,
): Promise<DMSetupResult> {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Create identities
  const userA = await createIdentity(pageA, `Alice${suffix}`);
  const userB = await createIdentity(pageB, `Bob${suffix}`);

  // Bob sends a friend request to Alice using her DID
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

  return { contextA, contextB, pageA, pageB, userA, userB };
}

/**
 * Navigate to the conversations list and open the DM with the specified user.
 */
async function openDMConversation(
  page: Page,
  partnerName: string,
): Promise<void> {
  await page.getByText('Conversations').first().click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  const dmItem = page.getByText(new RegExp(partnerName)).first();
  await expect(dmItem).toBeVisible({ timeout: 10_000 });
  await dmItem.click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

/**
 * Send a text message in the currently open conversation.
 */
async function sendMessage(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder('Type a message...');
  await expect(input.first()).toBeVisible({ timeout: 5_000 });
  await input.first().fill(text);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

/**
 * Establish a DM conversation and have both users exchange messages
 * so the chat contains both incoming and outgoing messages on each side.
 */
async function setupConversationWithMessages(
  browser: Browser,
  suffix: string,
): Promise<DMSetupResult> {
  const result = await establishDMConversation(browser, suffix);
  const { pageA, pageB } = result;

  // Alice opens the DM and sends a message
  await openDMConversation(pageA, `Bob${suffix}`);
  await sendMessage(pageA, 'Hello from Alice!');

  // Wait for relay to deliver Alice's message to Bob
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // Bob opens the DM and sends a reply
  await openDMConversation(pageB, `Alice${suffix}`);
  await sendMessage(pageB, 'Hey Alice, this is Bob!');

  // Wait for relay to deliver Bob's message to Alice
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // Send one more message from Alice for richer content
  await sendMessage(pageA, 'Great to see you here!');
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  return result;
}

// ─── T4.4.1: Bubble Mode ────────────────────────────────────────────────────

test.describe('4.4 Message Display Modes — Bubble Mode', () => {
  test.setTimeout(180_000);

  test('T4.4.1 -- Bubble mode: colored bubbles with own messages right-aligned, others left-aligned', async ({
    browser,
  }) => {
    const suffix = 'T441';
    const { contextA, contextB, pageA } =
      await setupConversationWithMessages(browser, suffix);

    // By default, display mode is 'bubble'. Verify messages are visible.
    // Alice's outgoing messages and Bob's incoming message should all render.
    await expect(
      pageA.getByText('Hello from Alice!').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      pageA.getByText('Hey Alice, this is Bob!').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      pageA.getByText('Great to see you here!').first(),
    ).toBeVisible({ timeout: 5_000 });

    // In bubble mode, MsgGroup is used. The outgoing messages should be
    // right-aligned (flex-end) and incoming messages should be left-aligned
    // (flex-start). We verify structural alignment via the MsgGroup wrapper.
    // MsgGroup sets `alignItems: isOut ? 'flex-end' : 'flex-start'` on its
    // outer View. We check that at least one message group is aligned to
    // flex-end (outgoing) and one to flex-start (incoming).
    const outgoingAligned = await pageA.evaluate(() => {
      // Find the text node containing "Hello from Alice!" and walk up
      // to find a parent with alignItems flex-end (outgoing bubble group).
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hello from Alice!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-end') return true;
        el = el.parentElement;
      }
      return false;
    });

    const incomingAligned = await pageA.evaluate(() => {
      // Find the text node containing "Hey Alice, this is Bob!" and walk up
      // to find a parent with alignItems flex-start (incoming bubble group).
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hey Alice, this is Bob!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-start') return true;
        el = el.parentElement;
      }
      return false;
    });

    expect(outgoingAligned).toBeTruthy();
    expect(incomingAligned).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.4.2: Inline Mode ────────────────────────────────────────────────────

test.describe('4.4 Message Display Modes — Inline Mode', () => {
  test.setTimeout(180_000);

  test('T4.4.2 -- Inline mode: Slack/Discord style, all left-aligned, sender name + timestamp headers', async ({
    browser,
  }) => {
    const suffix = 'T442';
    const { contextA, contextB, pageA } =
      await setupConversationWithMessages(browser, suffix);

    // Switch to inline mode via Settings
    await navigateToSettings(pageA);
    await navigateToSettingsSection(pageA, 'Messaging');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Click the Inline preview card to switch display mode
    await pageA.getByText('Inline').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Close settings by pressing Escape or clicking outside
    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Navigate back to the DM conversation
    await openDMConversation(pageA, `Bob${suffix}`);

    // All messages should still be visible
    await expect(
      pageA.getByText('Hello from Alice!').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      pageA.getByText('Hey Alice, this is Bob!').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      pageA.getByText('Great to see you here!').first(),
    ).toBeVisible({ timeout: 5_000 });

    // In inline mode, InlineMsgGroup is used. All messages are left-aligned
    // (no flex-end alignment for outgoing). The InlineMsgGroup renders with
    // flexDirection: 'row' and the avatar on the left.
    // Verify that the sender name headers are visible (inline mode shows
    // sender name + timestamp on the first line of each group).
    await expect(
      pageA.getByText(new RegExp(`Alice${suffix}`)).first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText(new RegExp(`Bob${suffix}`)).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify no outgoing messages are right-aligned (flex-end) in inline mode.
    // In inline mode, all messages should be left-aligned.
    const anyFlexEnd = await pageA.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hello from Alice!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      // Walk up to the message group container (look for row layout)
      while (el) {
        const style = window.getComputedStyle(el);
        // InlineMsgGroup uses flexDirection: row with gap: 10
        if (style.flexDirection === 'row' && style.gap === '10px') {
          // This is the InlineMsgGroup container — check it is flex-start
          return style.alignItems === 'flex-end';
        }
        el = el.parentElement;
      }
      return false;
    });

    // In inline mode, outgoing messages should NOT be right-aligned
    expect(anyFlexEnd).toBeFalsy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.4.3: Settings Toggle ─────────────────────────────────────────────────

test.describe('4.4 Message Display Modes — Settings Toggle', () => {
  test.setTimeout(180_000);

  test('T4.4.3 -- Settings > Messaging > Display Style: switch between Bubble and Inline', async ({
    browser,
  }) => {
    const suffix = 'T443';
    const { contextA, contextB, pageA } =
      await setupConversationWithMessages(browser, suffix);

    // Open Settings > Messaging
    await navigateToSettings(pageA);
    await navigateToSettingsSection(pageA, 'Messaging');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify the "Display Style" heading is visible
    await expect(
      pageA.getByText('Display Style').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify both preview cards are visible: "Bubbles" and "Inline"
    await expect(
      pageA.getByText('Bubbles').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Inline').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Default mode is Bubble. The description text should indicate bubble mode.
    await expect(
      pageA
        .getByText(/Messages appear in colored bubbles/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Switch to Inline mode by clicking the Inline preview card
    await pageA.getByText('Inline').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The description should now reflect inline mode
    await expect(
      pageA
        .getByText(/All messages are left-aligned with sender name/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Switch back to Bubble mode
    await pageA.getByText('Bubbles').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The description should reflect bubble mode again
    await expect(
      pageA
        .getByText(/Messages appear in colored bubbles/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Close settings
    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.4.4: Mode Change Applies Immediately ────────────────────────────────

test.describe('4.4 Message Display Modes — Immediate Apply', () => {
  test.setTimeout(180_000);

  test('T4.4.4 -- Mode change applies immediately to all conversations', async ({
    browser,
  }) => {
    const suffix = 'T444';
    const { contextA, contextB, pageA } =
      await setupConversationWithMessages(browser, suffix);

    // Open the DM conversation to verify initial bubble layout
    await openDMConversation(pageA, `Bob${suffix}`);

    // Verify messages are visible in default (bubble) mode
    await expect(
      pageA.getByText('Hello from Alice!').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Check that outgoing message is right-aligned (bubble mode)
    const initialOutgoingAligned = await pageA.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hello from Alice!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-end') return true;
        el = el.parentElement;
      }
      return false;
    });
    expect(initialOutgoingAligned).toBeTruthy();

    // Now switch to inline mode via Settings
    await navigateToSettings(pageA);
    await navigateToSettingsSection(pageA, 'Messaging');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await pageA.getByText('Inline').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Close settings
    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Messages should still be visible (mode applies immediately)
    await expect(
      pageA.getByText('Hello from Alice!').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      pageA.getByText('Hey Alice, this is Bob!').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Verify layout has changed: outgoing message should no longer be
    // right-aligned. In inline mode, all messages use InlineMsgGroup
    // which is left-aligned with flexDirection: row.
    const afterSwitchOutgoingAligned = await pageA.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hello from Alice!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-end') return true;
        el = el.parentElement;
      }
      return false;
    });

    // After switching to inline, outgoing messages should NOT be flex-end aligned
    expect(afterSwitchOutgoingAligned).toBeFalsy();

    // Switch back to bubble mode and verify it flips back
    await navigateToSettings(pageA);
    await navigateToSettingsSection(pageA, 'Messaging');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await pageA.getByText('Bubbles').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify outgoing messages are right-aligned again in bubble mode
    const restoredOutgoingAligned = await pageA.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (n) => n.textContent?.includes('Hello from Alice!') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
      );
      let node = walker.nextNode();
      if (!node) return false;
      let el = node.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.alignItems === 'flex-end') return true;
        el = el.parentElement;
      }
      return false;
    });
    expect(restoredOutgoingAligned).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });
});

// ─── T4.4.5: Live Preview in Settings ────────────────────────────────────────

test.describe('4.4 Message Display Modes — Live Preview', () => {
  test.setTimeout(180_000);

  test('T4.4.5 -- Live preview shown in settings for each mode', async ({
    browser,
  }) => {
    const suffix = 'T445';
    const { contextA, contextB, pageA } =
      await setupConversationWithMessages(browser, suffix);

    // Open Settings > Messaging
    await navigateToSettings(pageA);
    await navigateToSettingsSection(pageA, 'Messaging');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // The preview cards show sample messages. Verify the sample message
    // text from the preview is visible. The SAMPLE_MESSAGES constant
    // renders "Hey, how's it going?", "Pretty good!", and "Great to hear".
    // These appear inside the MessageDisplayPreview cards.
    await expect(
      pageA.getByText("Hey, how's it going?").first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Pretty good!').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify both preview cards are present and show their labels
    await expect(
      pageA.getByText('Bubbles').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      pageA.getByText('Inline').first(),
    ).toBeVisible({ timeout: 5_000 });

    // When Bubble is selected (default), its card should have visual
    // selection indicator. Click Inline and verify the description changes,
    // confirming the preview updates live.
    await pageA.getByText('Inline').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After clicking Inline, the description text should update immediately
    await expect(
      pageA
        .getByText(/All messages are left-aligned/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // The sample messages should still be visible in both preview cards
    await expect(
      pageA.getByText("Hey, how's it going?").first(),
    ).toBeVisible({ timeout: 5_000 });

    // Switch back to Bubbles
    await pageA.getByText('Bubbles').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Description should revert to bubble mode
    await expect(
      pageA
        .getByText(/Messages appear in colored bubbles/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Close settings
    await pageA.keyboard.press('Escape');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await contextA.close();
    await contextB.close();
  });
});
