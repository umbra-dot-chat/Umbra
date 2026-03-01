/**
 * Shared helpers for Group Chat E2E tests.
 *
 * Provides reusable functions for establishing friendships,
 * creating groups, accepting invites, and navigating group UI.
 *
 * NOTE: React Native Web's Pressable does NOT render with role="button".
 * Use getByText/getByLabel/locator('[aria-label=...]') instead of getByRole('button').
 */

import { expect, type Page, type Browser, type BrowserContext, type Locator } from '@playwright/test';
export { expect };
import {
  createIdentity,
  navigateToFriends,
  clickTab,
  BASE_URL,
  RELAY_SETTLE_TIMEOUT,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TwoUserSetup {
  ctx1: BrowserContext;
  ctx2: BrowserContext;
  alice: Page;
  bob: Page;
  aliceDid: string;
  bobDid: string;
}

// ─── Friendship ─────────────────────────────────────────────────────────────

// ─── React Native Web Input Helper ──────────────────────────────────────────

/**
 * Set a value on a React Native Web controlled TextInput.
 *
 * Standard Playwright methods (fill, pressSequentially, keyboard.type) do NOT
 * trigger React Native Web's onChangeText. Instead, we walk the React fiber
 * tree to find and invoke onChangeText directly.
 */
async function setRNWebInputValue(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  await page.evaluate(
    ({ sel, val }: { sel: string; val: string }) => {
      const input = document.querySelector<HTMLInputElement>(sel);
      if (!input) throw new Error(`Input not found: ${sel}`);

      const fiberKey = Object.keys(input).find(
        (k) =>
          k.startsWith('__reactFiber$') ||
          k.startsWith('__reactInternalInstance$'),
      );
      if (!fiberKey) throw new Error('React fiber not found on input');

      let fiber = (input as any)[fiberKey];
      while (fiber) {
        const props = fiber.memoizedProps || {};
        if (props.onChangeText) {
          props.onChangeText(val);
          return;
        }
        fiber = fiber.return;
      }
      throw new Error('onChangeText not found in fiber tree');
    },
    { sel: selector, val: value },
  );
}

// ─── Friendship ─────────────────────────────────────────────────────────────

/**
 * Get the UmbraService instance from inside a page via evaluate().
 *
 * UmbraService is a static singleton. We access it by finding the class
 * through React's fiber tree from any rendered component.
 */
async function getServiceInfo(page: Page): Promise<{
  did: string;
  displayName: string;
  signingKey: string;
  encryptionKey: string;
}> {
  return page.evaluate(async () => {
    // Walk the React fiber tree from the root to find the UmbraContext provider
    // which holds a reference to the UmbraService instance
    const rootEl = document.getElementById('root') || document.getElementById('main');
    if (!rootEl) throw new Error('React root element not found');

    const fiberKey = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'),
    );
    if (!fiberKey) throw new Error('React fiber not found on root');

    let fiber = (rootEl as any)[fiberKey];
    let service: any = null;

    // BFS through the fiber tree to find the UmbraProvider's context value
    const queue = [fiber];
    let iterations = 0;
    while (queue.length > 0 && iterations < 2000) {
      const current = queue.shift();
      iterations++;

      const props = current?.memoizedProps || {};
      if (props.value?.service?.getIdentity) {
        service = props.value.service;
        break;
      }

      if (current?.child) queue.push(current.child);
      if (current?.sibling) queue.push(current.sibling);
    }

    if (!service) {
      throw new Error(`UmbraService not found in fiber tree after ${iterations} iterations`);
    }

    // getPublicIdentity() extracts signing_key and encryption_key from
    // the WASM profile JSON (hex-encoded 32-byte public keys).
    const pubId = await service.getPublicIdentity();

    if (!pubId.publicKeys?.signing || !pubId.publicKeys?.encryption) {
      throw new Error(
        `Missing public keys for ${pubId.did}. ` +
        `signing=${pubId.publicKeys?.signing?.length || 0} chars, ` +
        `encryption=${pubId.publicKeys?.encryption?.length || 0} chars`,
      );
    }

    return {
      did: pubId.did,
      displayName: pubId.displayName,
      signingKey: pubId.publicKeys.signing,
      encryptionKey: pubId.publicKeys.encryption,
    };
  });
}

/**
 * Create a bidirectional friendship directly via UmbraService.
 *
 * Calls processAcceptedFriendResponse() on both sides, which:
 * 1. Adds the friend to the local database
 * 2. Creates a DM conversation automatically
 *
 * This bypasses the relay entirely — no network needed.
 */
async function createFriendshipDirect(
  page: Page,
  friendInfo: { did: string; displayName: string; signingKey: string; encryptionKey: string },
): Promise<void> {
  await page.evaluate(async (friend) => {
    // Find the service via fiber tree (same approach as getServiceInfo)
    const rootEl = document.getElementById('root') || document.getElementById('main');
    if (!rootEl) throw new Error('React root not found');

    const fiberKey = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'),
    );
    if (!fiberKey) throw new Error('React fiber not found');

    let fiber = (rootEl as any)[fiberKey];
    let service: any = null;

    const queue = [fiber];
    let iterations = 0;
    while (queue.length > 0 && iterations < 2000) {
      const current = queue.shift();
      iterations++;
      const props = current?.memoizedProps || {};
      if (props.value?.service?.processAcceptedFriendResponse) {
        service = props.value.service;
        break;
      }
      if (current?.child) queue.push(current.child);
      if (current?.sibling) queue.push(current.sibling);
    }

    if (!service) throw new Error('UmbraService not found');

    await service.processAcceptedFriendResponse({
      fromDid: friend.did,
      fromDisplayName: friend.displayName,
      fromSigningKey: friend.signingKey,
      fromEncryptionKey: friend.encryptionKey,
    });
  }, friendInfo);
}

/**
 * Establish a friendship between Alice and Bob.
 *
 * Uses the WASM service directly (processAcceptedFriendResponse) to create
 * a bidirectional friendship without relay involvement. This is reliable
 * for E2E test setup where relay timing can be unpredictable.
 *
 * After completion, both users have each other as friends and DM
 * conversations are automatically created.
 */
export async function befriend(alice: Page, bob: Page, _bobDid: string): Promise<void> {
  // Get both users' public identity info (DID, display name, keys)
  const aliceInfo = await getServiceInfo(alice);
  const bobInfo = await getServiceInfo(bob);

  // Create friendship on both sides directly via service
  await createFriendshipDirect(alice, bobInfo);
  await createFriendshipDirect(bob, aliceInfo);

  // Wait for React state to update (useConversations subscribes to friend events)
  await alice.waitForTimeout(UI_SETTLE_TIMEOUT);
  await bob.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Verify friendship is visible on Alice's Friends page
  await navigateToFriends(alice);
  await clickTab(alice, 'All');
  await alice.waitForTimeout(UI_SETTLE_TIMEOUT);
}

// ─── DM Navigation ─────────────────────────────────────────────────────────

/**
 * Navigate a user into a DM conversation with a friend.
 *
 * After befriend() creates a direct friendship via processAcceptedFriendResponse(),
 * a DM conversation is automatically created and appears in the sidebar.
 * We simply click the friend's conversation entry in the sidebar.
 *
 * Fallback: If not found in sidebar, try Friends → All → expand Offline → Message button.
 */
export async function navigateToDM(
  page: Page,
  friendName: string,
): Promise<void> {
  // The DM conversation should already exist in the sidebar after befriend().
  // Look for the friend's name in the sidebar conversation list.
  const sidebarEntry = page.locator(`button:has-text("${friendName}")`).first();
  const inSidebar = await sidebarEntry.isVisible({ timeout: 5_000 }).catch(() => false);

  if (inSidebar) {
    await sidebarEntry.click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
  } else {
    // Fallback: navigate via Friends page
    await navigateToFriends(page);
    await clickTab(page, 'All');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Expand the "Offline" section if collapsed (friend may be offline)
    const offlineSection = page.getByText(/Offline\s*\(\d+\)/).first();
    if (await offlineSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await offlineSection.click();
      await page.waitForTimeout(1_000);
    }

    // Wait for the friend to appear
    await expect(page.getByText(friendName).first()).toBeVisible({ timeout: 15_000 });

    // Click the "Message" button on the friend's card
    const messageBtn = page.locator(`[aria-label="Message"]`).first();
    await expect(messageBtn).toBeVisible({ timeout: 5_000 });
    await messageBtn.click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
  }

  // Verify we're in the DM — message input should be visible
  await expect(
    page.getByPlaceholder('Type a message...'),
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * Create two browser contexts with identities and establish friendship.
 * Returns both pages, contexts, and DIDs.
 */
export async function setupFriendPair(
  browser: Browser,
  suffix: string,
): Promise<TwoUserSetup> {
  const ctx1 = await browser.newContext({ baseURL: BASE_URL });
  const ctx2 = await browser.newContext({ baseURL: BASE_URL });
  const alice = await ctx1.newPage();
  const bob = await ctx2.newPage();

  const aliceResult = await createIdentity(alice, `Alice${suffix}`);
  const bobResult = await createIdentity(bob, `Bob${suffix}`);

  // Wait for relay WebSocket connections to fully establish and register both DIDs.
  // Without this, the relay may not know Bob's DID when Alice sends the request.
  await alice.waitForTimeout(RELAY_SETTLE_TIMEOUT);
  await bob.waitForTimeout(RELAY_SETTLE_TIMEOUT);

  await befriend(alice, bob, bobResult.did);

  return {
    ctx1,
    ctx2,
    alice,
    bob,
    aliceDid: aliceResult.did,
    bobDid: bobResult.did,
  };
}

// ─── Group Creation ─────────────────────────────────────────────────────────

/**
 * Open the Create Group dialog from the sidebar "+" menu.
 */
export async function openCreateGroupDialog(page: Page): Promise<void> {
  // "New conversation" button has aria-label and role="button" (it's in the nav rail)
  await page.locator('[aria-label="New conversation"]').first().click();
  await page.waitForTimeout(500);
  await page.getByText('New Group').first().click();
  await page.waitForTimeout(1_000);
}

/**
 * Fill out and submit the Create Group dialog.
 * Assumes the dialog is already open and the user has friends.
 */
export async function createGroupAndInvite(
  page: Page,
  groupName: string,
  options?: { description?: string; selectAllFriends?: boolean },
): Promise<void> {
  const { description, selectAllFriends = true } = options ?? {};

  // Fill name
  await page.getByPlaceholder('Enter group name...').fill(groupName);

  // Fill description if provided
  if (description) {
    await page.getByPlaceholder("What's this group about?").fill(description);
  }

  // Select first friend (or all friends)
  if (selectAllFriends) {
    const checkboxes = page.locator('[role="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (await cb.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cb.click();
      }
    }
  } else {
    const cb = page.locator('[role="checkbox"]').first();
    if (await cb.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cb.click();
    }
  }

  // Submit — Button component from wisp renders with role="button"
  const createBtn = page.getByText('Create & Invite', { exact: true }).first();
  await createBtn.click();
  await page.waitForTimeout(RELAY_SETTLE_TIMEOUT);
}

/**
 * Full flow: open dialog, fill, submit — returns to sidebar after.
 */
export async function createGroup(
  page: Page,
  groupName: string,
  options?: { description?: string },
): Promise<void> {
  await openCreateGroupDialog(page);
  await createGroupAndInvite(page, groupName, options);
}

/**
 * Accept a group invite visible in Bob's sidebar.
 */
export async function acceptGroupInvite(page: Page, groupName: string): Promise<void> {
  // Wait for invite to appear
  await expect(page.getByText(groupName).first()).toBeVisible({ timeout: 20_000 });

  // Click Accept — use getByText since Pressable may lack role="button"
  await page.getByText('Accept', { exact: true }).first().click();
  await page.waitForTimeout(RELAY_SETTLE_TIMEOUT);
}

// ─── Relay Polling ───────────────────────────────────────────────────────

/**
 * Poll for relay-delivered content with reload retries.
 *
 * Instead of a single fixed wait, this retries up to `maxAttempts` times,
 * optionally reloading the page between attempts to pick up offline messages.
 * Returns true if the locator becomes visible, false if all attempts exhausted.
 */
export async function waitForRelayDelivery(
  page: Page,
  locatorFn: () => Locator,
  options?: { maxAttempts?: number; waitBetween?: number; reload?: boolean },
): Promise<boolean> {
  const { maxAttempts = 3, waitBetween = RELAY_SETTLE_TIMEOUT, reload = true } = options ?? {};
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.waitForTimeout(waitBetween);
    const isVisible = await locatorFn().isVisible({ timeout: 5_000 }).catch(() => false);
    if (isVisible) return true;
    if (attempt < maxAttempts && reload) {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(UI_SETTLE_TIMEOUT);
    }
  }
  return false;
}

// ─── Direct Group Invite Injection ──────────────────────────────────────

/**
 * Set up a WebSocket interceptor on a page to capture outgoing relay messages.
 *
 * This monkey-patches WebSocket.prototype.send to record all outgoing
 * messages, allowing us to extract invite envelopes that would normally
 * be delivered via the relay.
 */
export async function startCapturingWsMessages(page: Page): Promise<void> {
  await page.evaluate(() => {
    const captured: string[] = [];
    const origSend = WebSocket.prototype.send;
    (window as any).__origWsSend = origSend;
    (window as any).__capturedWs = captured;
    WebSocket.prototype.send = function (data: any) {
      if (typeof data === 'string') captured.push(data);
      return origSend.call(this, data);
    };
  });
}

/**
 * Stop capturing and extract the group_invite envelope payload.
 *
 * Returns the GroupInvitePayload object from the captured WebSocket messages,
 * or null if no group invite was found.
 */
export async function extractGroupInvitePayload(page: Page): Promise<any | null> {
  return page.evaluate(() => {
    // Restore original WebSocket.send
    if ((window as any).__origWsSend) {
      WebSocket.prototype.send = (window as any).__origWsSend;
    }
    const messages = ((window as any).__capturedWs as string[]) || [];
    for (const msg of messages) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'send' && parsed.payload) {
          const envelope = JSON.parse(parsed.payload);
          if (envelope.envelope === 'group_invite' && envelope.version === 1) {
            return envelope.payload; // GroupInvitePayload
          }
        }
      } catch { /* not a matching message */ }
    }
    return null;
  });
}

/**
 * Inject a group invite directly into a page's UmbraService.
 *
 * This bypasses the relay entirely — similar to how createFriendshipDirect
 * bypasses the relay for friendship setup. The invite is stored in the
 * local database and the UI event is dispatched immediately.
 */
export async function injectGroupInvite(
  page: Page,
  invitePayload: any,
): Promise<void> {
  await page.evaluate(async (payload: any) => {
    const rootEl = document.getElementById('root') || document.getElementById('main');
    if (!rootEl) throw new Error('React root not found');

    const fiberKey = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'),
    );
    if (!fiberKey) throw new Error('React fiber not found');

    let service: any = null;
    const queue = [(rootEl as any)[fiberKey]];
    let iterations = 0;
    while (queue.length > 0 && iterations < 2000) {
      const current = queue.shift();
      iterations++;
      const props = current?.memoizedProps || {};
      if (props.value?.service?.storeGroupInvite) {
        service = props.value.service;
        break;
      }
      if (current?.child) queue.push(current.child);
      if (current?.sibling) queue.push(current.sibling);
    }

    if (!service) throw new Error('UmbraService not found');

    // Store the invite in Bob's local database
    await service.storeGroupInvite(payload);

    // Dispatch the event so the UI updates (sidebar shows the invite)
    service.dispatchGroupEvent({
      type: 'inviteReceived',
      invite: {
        id: payload.inviteId,
        groupId: payload.groupId,
        groupName: payload.groupName,
        description: payload.description,
        inviterDid: payload.inviterDid,
        inviterName: payload.inviterName,
        encryptedGroupKey: payload.encryptedGroupKey,
        nonce: payload.nonce,
        membersJson: payload.membersJson,
        status: 'pending',
        createdAt: payload.timestamp,
      },
    });
  }, invitePayload);
}

/**
 * Extract ALL group_message envelope payloads from captured WebSocket messages.
 *
 * Returns an array of group message payloads (for fan-out, there may be
 * one per group member).
 */
export async function extractGroupMessagePayloads(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    // Restore original WebSocket.send
    if ((window as any).__origWsSend) {
      WebSocket.prototype.send = (window as any).__origWsSend;
    }
    const messages = ((window as any).__capturedWs as string[]) || [];
    const payloads: any[] = [];
    for (const msg of messages) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'send' && parsed.payload) {
          const envelope = JSON.parse(parsed.payload);
          if (envelope.envelope === 'group_message' && envelope.version === 1) {
            payloads.push({ toDid: parsed.to_did, ...envelope.payload });
          }
        }
      } catch { /* not a matching message */ }
    }
    return payloads;
  });
}

/**
 * Inject a group message directly into the receiver's service.
 *
 * Decrypts the message using the receiver's group key and stores it
 * in the local database, then dispatches the UI event.
 */
export async function injectGroupMessage(
  page: Page,
  messagePayload: any,
): Promise<boolean> {
  return page.evaluate(async (payload: any) => {
    const rootEl = document.getElementById('root') || document.getElementById('main');
    if (!rootEl) throw new Error('Root not found');
    const fiberKey = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'),
    );
    if (!fiberKey) throw new Error('Fiber not found');

    let service: any = null;
    const queue = [(rootEl as any)[fiberKey]];
    let i = 0;
    while (queue.length > 0 && i < 2000) {
      const current = queue.shift();
      i++;
      const props = current?.memoizedProps || {};
      if (props.value?.service?.decryptGroupMessage) {
        service = props.value.service;
        break;
      }
      if (current?.child) queue.push(current.child);
      if (current?.sibling) queue.push(current.sibling);
    }
    if (!service) throw new Error('Service not found');

    try {
      // Decrypt the group message
      const plaintext = await service.decryptGroupMessage(
        payload.groupId,
        payload.ciphertext,
        payload.nonce,
        payload.keyVersion,
      );

      // Store the message in the local database
      await service.storeIncomingMessage({
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        senderDid: payload.senderDid,
        contentEncrypted: payload.ciphertext,
        nonce: payload.nonce,
        timestamp: payload.timestamp,
      });

      // Dispatch the UI event so the chat view updates
      service.dispatchMessageEvent({
        type: 'messageReceived',
        message: {
          id: payload.messageId,
          conversationId: payload.conversationId,
          senderDid: payload.senderDid,
          content: { type: 'text', text: plaintext },
          timestamp: payload.timestamp,
          read: false,
          delivered: true,
          status: 'delivered',
        },
      });

      return true;
    } catch (err) {
      console.warn('[injectGroupMessage] Failed:', err);
      return false;
    }
  }, messagePayload);
}

/**
 * Create a group and get both users into it using direct injection.
 *
 * Unlike the relay-dependent approach, this:
 * 1. Captures the invite envelope from Alice's outgoing WebSocket messages
 * 2. Injects it directly into Bob's service (bypassing the relay)
 * 3. Bob accepts the invite via UI click
 *
 * This is reliable regardless of relay timing/delivery.
 */
export async function setupBothInGroupDirect(
  setup: TwoUserSetup,
  groupName: string,
): Promise<boolean> {
  // Step 1: Start capturing WebSocket messages on Alice's page
  await startCapturingWsMessages(setup.alice);

  // Step 2: Alice creates the group (sends invite via relay + we capture it)
  await createGroup(setup.alice, groupName);
  await setup.alice.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Step 3: Extract the group invite payload from captured messages
  const invitePayload = await extractGroupInvitePayload(setup.alice);
  if (!invitePayload) {
    console.warn('[setupBothInGroupDirect] No group_invite envelope captured');
    return false;
  }

  // Step 4: Inject the invite directly into Bob's service
  await injectGroupInvite(setup.bob, invitePayload);
  await setup.bob.waitForTimeout(UI_SETTLE_TIMEOUT);

  // Step 5: Bob accepts the invite via UI
  try {
    await setup.bob.getByText('Accept', { exact: true }).first().click({ timeout: 10_000 });
    await setup.bob.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Step 5b: Notify Alice that Bob accepted (direct injection).
    // In the normal flow, Bob sends an acceptance notification via relay,
    // which triggers Alice to addGroupMember. Since the relay is unreliable,
    // we inject this directly into Alice's service so she knows Bob is a member.
    // Without this, Alice won't include Bob when sending group messages.
    const bobInfo = await getServiceInfo(setup.bob);
    await setup.alice.evaluate(
      async ({ groupId, bobDid, bobName }: { groupId: string; bobDid: string; bobName: string }) => {
        const rootEl = document.getElementById('root') || document.getElementById('main');
        if (!rootEl) throw new Error('Root not found');
        const fiberKey = Object.keys(rootEl).find(
          (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'),
        );
        if (!fiberKey) throw new Error('Fiber not found');
        const queue = [(rootEl as any)[fiberKey]];
        let service: any = null;
        let i = 0;
        while (queue.length > 0 && i < 2000) {
          const current = queue.shift();
          i++;
          const props = current?.memoizedProps || {};
          if (props.value?.service?.addGroupMember) {
            service = props.value.service;
            break;
          }
          if (current?.child) queue.push(current.child);
          if (current?.sibling) queue.push(current.sibling);
        }
        if (!service) throw new Error('Service not found');
        await service.addGroupMember(groupId, bobDid, bobName);
      },
      { groupId: invitePayload.groupId, bobDid: bobInfo.did, bobName: bobInfo.displayName },
    );

    // Step 6: Navigate Bob into the group chat
    // After acceptance, the group conversation is created in the DB.
    // The sidebar may not update immediately — try finding the group name first,
    // then reload if needed to force the conversation list to refresh.
    let groupVisible = await setup.bob
      .getByText(groupName)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!groupVisible) {
      // Reload to force conversations to load from DB
      await setup.bob.reload({ waitUntil: 'networkidle' });
      await setup.bob.waitForTimeout(UI_SETTLE_TIMEOUT);
      groupVisible = await setup.bob
        .getByText(groupName)
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
    }

    if (!groupVisible) {
      console.warn('[setupBothInGroupDirect] Group not visible in sidebar after acceptance');
      return false;
    }

    await setup.bob.getByText(groupName).first().click({ timeout: 5_000 });
    await setup.bob.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Step 7: Verify Bob is in the chat
    await expect(setup.bob.getByPlaceholder('Type a message...')).toBeVisible({ timeout: 10_000 });

    // Step 8: Wait for Bob's relay WebSocket to fully reconnect.
    // After page reload (if it happened) or acceptance, the WebSocket needs time
    // to re-establish and register Bob's DID with the relay. Without this,
    // subsequent group messages from Alice won't be delivered to Bob.
    await setup.bob.waitForTimeout(RELAY_SETTLE_TIMEOUT);

    return true;
  } catch (err) {
    console.warn('[setupBothInGroupDirect] Failed to accept invite or navigate:', err);
    return false;
  }
}

// ─── Group Navigation ───────────────────────────────────────────────────────

/**
 * Click a group conversation in the sidebar to open it.
 */
export async function openGroupChat(page: Page, groupName: string): Promise<void> {
  await page.getByText(groupName).first().click();
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}
