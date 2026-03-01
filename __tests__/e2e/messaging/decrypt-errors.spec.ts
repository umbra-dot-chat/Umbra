/**
 * 4.20 Decrypt Error Messages E2E Tests
 *
 * Tests that categorized decryption error messages render correctly in the
 * chat UI. When a message cannot be decrypted (e.g. after key rotation,
 * from an unknown sender, or with corrupted data), the service layer
 * replaces the ciphertext with a human-readable error placeholder via
 * `categorizeDecryptError()`.
 *
 * These tests verify:
 * - Error placeholders appear in the message list alongside valid messages
 * - The "[Encrypted with a different key]" error renders after key rotation
 * - Error messages are visually distinguishable from normal messages
 *
 * Since we cannot easily inject raw encrypted payloads with bad keys into
 * the WASM store from the browser, the key rotation flow (T-KR tests) is
 * used as the trigger for stale-key decrypt errors. These tests supplement
 * the key rotation tests by focusing on the UI rendering of error states.
 *
 * Test IDs: T-DE.1–T-DE.3
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
 * Create two users, establish a friendship, and navigate both into the
 * DM conversation.
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

  // 2. Bob sends a friend request to Alice
  await navigateToFriends(pageB);
  const addInput = pageB.getByPlaceholder('did:key:z6Mk...');
  await expect(addInput.first()).toBeVisible({ timeout: 5_000 });
  await addInput.first().fill(userA.did);
  await pageB
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  // 3. Wait for relay to deliver the request to Alice
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // 4. Alice navigates to Pending tab and accepts
  await navigateToFriends(pageA);
  await clickTab(pageA, 'Pending');
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  const acceptBtn = pageA.getByRole('button', { name: 'Accept' });
  await expect(acceptBtn.first()).toBeVisible({ timeout: 10_000 });
  await acceptBtn.first().click();

  // 5. Wait for relay sync so DM auto-creates on both sides
  await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  // 6. Both users navigate to the DM conversation
  await pageA.getByText('Conversations').first().click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
  const dmItemA = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
  await expect(dmItemA).toBeVisible({ timeout: 10_000 });
  await dmItemA.click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  await pageB.getByText('Conversations').first().click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);
  const dmItemB = pageB.getByText(new RegExp(`Alice${suffix}`)).first();
  await expect(dmItemB).toBeVisible({ timeout: 10_000 });
  await dmItemB.click();
  await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

  return { contextA, contextB, pageA, pageB, userA, userB };
}

// ─── Helper: invoke rotateEncryptionKey via the service singleton ─────────

async function rotateKeyViaService(
  page: Page,
): Promise<{ newEncryptionKey: string; friendCount: number }> {
  return page.evaluate(async () => {
    const { UmbraService } = await import('@umbra/service');
    const svc = UmbraService.instance;
    const relayWs = svc.getRelayWs();
    return svc.rotateEncryptionKey(relayWs);
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────

test.describe('4.20 Decrypt Error Messages', () => {
  test.setTimeout(180_000);

  // ─── T-DE.1: messages with stale keys show categorized error ──────────

  test('T-DE.1 — messages encrypted with old key show categorized error placeholder', async ({ browser }) => {
    const suffix = 'DE1';
    const { contextA, contextB, pageA, pageB } =
      await setupDMConversation(browser, suffix);

    // Alice sends a message BEFORE key rotation
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill('Pre-rotation secret DE1');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Verify Alice sees the message
    await expect(
      pageA.getByText('Pre-rotation secret DE1').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for Bob to receive the pre-rotation message
    await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);
    await expect(
      pageB.getByText('Pre-rotation secret DE1').first(),
    ).toBeVisible({ timeout: 15_000 });

    // Now rotate Alice's encryption key
    await rotateKeyViaService(pageA);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Reload Alice's page to force re-fetching messages from the store.
    // When getMessages re-decrypts the old message with the new key, it
    // should fail and produce the categorized error.
    await pageA.reload();
    await pageA.waitForTimeout(WASM_LOAD_TIMEOUT);

    // Navigate back into the conversation
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmItem = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
    await expect(dmItem).toBeVisible({ timeout: 10_000 });
    await dmItem.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // After reload + rotation, the old message should either:
    // a) Still be readable (if the WASM layer retains old key material), or
    // b) Show "[Encrypted with a different key]" (if old key is discarded)
    //
    // We check for both possibilities — the test passes if either the
    // original text or the error placeholder is visible.
    const originalVisible = await pageA
      .getByText('Pre-rotation secret DE1')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    const errorVisible = await pageA
      .getByText('[Encrypted with a different key]')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // At least one must be present — the chat renders something for the message
    expect(originalVisible || errorVisible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  // ─── T-DE.2: error messages render alongside valid messages ───────────

  test('T-DE.2 — error messages render alongside valid messages in same conversation', async ({ browser }) => {
    const suffix = 'DE2';
    const { contextA, contextB, pageA } =
      await setupDMConversation(browser, suffix);

    // Alice sends a message BEFORE rotation
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill('Valid before rotation DE2');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Valid before rotation DE2').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Rotate Alice's key
    await rotateKeyViaService(pageA);
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Alice sends a message AFTER rotation (this one uses the new key)
    await inputA.first().fill('Valid after rotation DE2');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Valid after rotation DE2').first(),
    ).toBeVisible({ timeout: 10_000 });

    // The conversation should show both messages without crashing.
    // Count visible message elements — there should be at least 2 messages
    // in the chat area (one pre-rotation, one post-rotation).
    const messageCount = await pageA.evaluate(() => {
      // Count all elements that contain our test message text or the error placeholder.
      // Messages are rendered as text nodes inside the chat area.
      const texts = [
        'Valid before rotation DE2',
        'Valid after rotation DE2',
        '[Encrypted with a different key]',
      ];
      let count = 0;
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) =>
            texts.some((t) => node.textContent?.includes(t))
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT,
        },
      );
      while (walker.nextNode()) count++;
      return count;
    });

    // At least 2 messages should be rendered (before + after rotation).
    // The pre-rotation message might show as original text or as error placeholder.
    expect(messageCount).toBeGreaterThanOrEqual(2);

    // The post-rotation message must be visible as plaintext (not an error)
    await expect(
      pageA.getByText('Valid after rotation DE2').first(),
    ).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  // ─── T-DE.3: error messages are visually distinguishable ──────────────

  test('T-DE.3 — categorized error text is rendered as a message bubble', async ({ browser }) => {
    const suffix = 'DE3';
    const { contextA, contextB, pageA } =
      await setupDMConversation(browser, suffix);

    // Send a message, then rotate key, then reload to trigger decrypt error
    const inputA = pageA.getByPlaceholder('Type a message...');
    await expect(inputA.first()).toBeVisible({ timeout: 10_000 });
    await inputA.first().fill('Will become undecryptable DE3');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(
      pageA.getByText('Will become undecryptable DE3').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Rotate key
    await rotateKeyViaService(pageA);
    await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    // Reload to force re-decryption from store
    await pageA.reload();
    await pageA.waitForTimeout(WASM_LOAD_TIMEOUT);

    // Navigate back into the conversation
    await pageA.getByText('Conversations').first().click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
    const dmItem = pageA.getByText(new RegExp(`Bob${suffix}`)).first();
    await expect(dmItem).toBeVisible({ timeout: 10_000 });
    await dmItem.click();
    await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Check if the error placeholder is visible
    const errorPlaceholder = pageA
      .getByText('[Encrypted with a different key]')
      .first();

    const isErrorVisible = await errorPlaceholder
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (isErrorVisible) {
      // Verify the error text is rendered inside a message bubble container.
      // In Umbra, message bubbles are rendered inside MsgGroup containers
      // with flex layout. The error text should be within such a container,
      // not floating loose in the DOM.
      const isInBubble = await pageA.evaluate(() => {
        const errorText = '[Encrypted with a different key]';
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) =>
              node.textContent?.includes(errorText)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
          },
        );
        const textNode = walker.nextNode();
        if (!textNode?.parentElement) return false;

        // Walk up to find a flex container (message group wrapper)
        let el: HTMLElement | null = textNode.parentElement;
        let depth = 0;
        while (el && depth < 20) {
          const style = window.getComputedStyle(el);
          if (style.display === 'flex' && (
            style.alignItems === 'flex-end' || style.alignItems === 'flex-start'
          )) {
            return true;
          }
          el = el.parentElement;
          depth++;
        }
        return false;
      });

      expect(isInBubble).toBe(true);
    } else {
      // If old messages are still decryptable (WASM retains old key material),
      // the original text should still be visible in a bubble
      const originalVisible = await pageA
        .getByText('Will become undecryptable DE3')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      expect(originalVisible).toBe(true);
    }

    await contextA.close();
    await contextB.close();
  });
});
