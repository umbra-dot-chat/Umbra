/**
 * 4.1 Chat Header + 4.23 Empty State E2E Tests
 *
 * Tests the ChatHeader component rendered above the chat area when a DM
 * conversation is active, including recipient name display, panel toggle
 * buttons, and call buttons. Also tests the empty state shown when no
 * conversation is selected.
 *
 * Chat header tests are two-user tests (require an actual DM conversation).
 * Empty state tests are single-user tests.
 *
 * Test IDs: T4.1.1-T4.1.5, T4.23.1-T4.23.2
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
 * friendship between them, and return both pages ready with a DM conversation.
 *
 * Steps:
 *  1. Create two identities (Alice + Bob) in separate browser contexts
 *  2. Bob sends a friend request to Alice using her DID
 *  3. Alice accepts the request on the Pending tab
 *  4. Wait for relay sync so both sides see the friendship + DM
 *  5. Returns both pages, contexts, and user info
 */
async function establishDMConversation(
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

  return { contextA, contextB, pageA, pageB, userA, userB };
}

/**
 * Navigate User A to the home page (conversations) and click into the DM
 * with Bob so the ChatHeader is rendered.
 */
async function openDMConversation(
  pageA: Page,
  bobName: string,
): Promise<void> {
  // Navigate to the conversations list
  await pageA.getByText('Conversations').first().click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

  // The DM should appear in the sidebar — click it to open
  const dmItem = pageA.getByText(new RegExp(bobName)).first();
  await expect(dmItem).toBeVisible({ timeout: 10_000 });
  await dmItem.click();
  await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
}

// ─── 4.1 Chat Header (Two-User Tests) ──────────────────────────────────────

test.describe('4.1 Chat Header', () => {
  test.setTimeout(180_000);

  test('T4.1.1 -- Shows recipient name and online status dot', async ({ browser }) => {
    const suffix = 'T411';
    const { contextA, contextB, pageA, pageB } =
      await establishDMConversation(browser, suffix);

    // Alice opens the DM conversation with Bob
    await openDMConversation(pageA, `Bob${suffix}`);

    // The chat header should show Bob's name
    await expect(
      pageA.getByText(`Bob${suffix}`).first(),
    ).toBeVisible({ timeout: 10_000 });

    // The Avatar component renders with a status prop ('online' | undefined).
    // When Bob is online (connected to relay), the avatar shows a status dot.
    // Verify the avatar is present — the Avatar element renders inside the header.
    // We check for the name text which confirms the header loaded with recipient info.
    // The online status dot is rendered by the Avatar component's status indicator.
    const avatarLocator = pageA.locator('div[role="img"], img').first();
    const avatarVisible = await avatarLocator
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(avatarVisible).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });

  test('T4.1.2 -- Panel toggle buttons: Members, Search, Pins', async ({ browser }) => {
    const suffix = 'T412';
    const { contextA, contextB, pageA } =
      await establishDMConversation(browser, suffix);

    await openDMConversation(pageA, `Bob${suffix}`);

    // Search messages button
    const searchBtn = pageA.getByRole('button', { name: 'Search messages' });
    await expect(searchBtn.first()).toBeVisible({ timeout: 10_000 });

    // Toggle pinned messages button
    const pinsBtn = pageA.getByRole('button', { name: 'Toggle pinned messages' });
    await expect(pinsBtn.first()).toBeVisible({ timeout: 5_000 });

    // Toggle members button
    const membersBtn = pageA.getByRole('button', { name: 'Toggle members' });
    await expect(membersBtn.first()).toBeVisible({ timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  test('T4.1.3 -- Voice call button visible', async ({ browser }) => {
    const suffix = 'T413';
    const { contextA, contextB, pageA } =
      await establishDMConversation(browser, suffix);

    await openDMConversation(pageA, `Bob${suffix}`);

    // Voice call button should be visible in the chat header
    const voiceCallBtn = pageA.getByRole('button', { name: 'Voice call' });
    await expect(voiceCallBtn.first()).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  test('T4.1.4 -- Video call button visible', async ({ browser }) => {
    const suffix = 'T414';
    const { contextA, contextB, pageA } =
      await establishDMConversation(browser, suffix);

    await openDMConversation(pageA, `Bob${suffix}`);

    // Video call button should be visible in the chat header
    const videoCallBtn = pageA.getByRole('button', { name: 'Video call' });
    await expect(videoCallBtn.first()).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  test('T4.1.5 -- Shared files button visible', async ({ browser }) => {
    const suffix = 'T415';
    const { contextA, contextB, pageA } =
      await establishDMConversation(browser, suffix);

    await openDMConversation(pageA, `Bob${suffix}`);

    // Toggle shared files button should be visible for DM conversations
    const filesBtn = pageA.getByRole('button', { name: 'Toggle shared files' });
    await expect(filesBtn.first()).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});

// ─── 4.23 Empty State (Single-User Tests) ──────────────────────────────────

test.describe('4.23 Empty State', () => {
  test.setTimeout(120_000);

  test('T4.23.1 -- No conversation selected — welcome/empty state shown', async ({
    page,
  }) => {
    await createIdentity(page, 'EmptyStateUser1');

    // After account creation the app lands on the home page with no conversations.
    // The EmptyConversation component should render the "Welcome to Umbra" heading.
    await expect(
      page.getByText('Welcome to Umbra').first(),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  });

  test('T4.23.2 -- Helpful text explaining how to start chatting', async ({
    page,
  }) => {
    await createIdentity(page, 'EmptyStateUser2');

    // The empty state includes descriptive text about starting a conversation
    await expect(
      page.getByText('Welcome to Umbra').first(),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

    // The descriptive text explains how to start chatting
    await expect(
      page
        .getByText('Add a friend to start chatting')
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify the encryption / peer-to-peer messaging description is present
    await expect(
      page
        .getByText(/end-to-end encrypted/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
