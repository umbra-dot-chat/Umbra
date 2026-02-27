/**
 * 3.7 Friend Validation E2E Tests
 *
 * Tests validation behavior for the AddFriendInput component:
 * invalid DID format, self-request, already-friended DID, and blocked DID.
 *
 * Test IDs: T3.7.1–T3.7.4
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  RELAY_SETTLE_TIMEOUT,
  createIdentity,
  navigateToFriends,
  clickTab,
} from '../helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fill the "Or add by DID" input and click Send Request.
 *
 * The AddFriendInput component renders:
 *  - a TextInput with placeholder "did:key:z6Mk..."
 *  - a Pressable button with accessibilityLabel "Send friend request"
 *
 * NOTE: React Native Web duplicates nodes — always use `.first()`.
 */
async function submitDid(page: import('@playwright/test').Page, did: string) {
  const input = page.getByPlaceholder('did:key:z6Mk...').first();
  await input.fill(did);
  // Allow the controlled input state to propagate
  await page.waitForTimeout(300);
  // Click the Send Request button
  await page
    .getByRole('button', { name: 'Send friend request' })
    .first()
    .click();
}

// ---------------------------------------------------------------------------
// T3.7.1 — Invalid DID
// ---------------------------------------------------------------------------

test.describe('3.7 Friend Validation', () => {
  test.setTimeout(120_000);

  test('T3.7.1 — Invalid DID shows "Please enter a valid DID"', async ({
    page,
  }) => {
    await createIdentity(page, 'InvalidDidUser');
    await navigateToFriends(page);

    // The "Or add by DID" section is on the All tab under the Umbra platform
    await expect(
      page.getByText('Or add by DID').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Enter a short / invalid DID (< 8 chars triggers client-side validation)
    await submitDid(page, 'abc');

    // Expect the client-side validation error
    await expect(
      page
        .getByText('Please enter a valid DID (did:key:z6Mk...).')
        .first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // T3.7.2 — Friend request to self
  // -------------------------------------------------------------------------

  test('T3.7.2 — Friend request to self shows error', async ({ page }) => {
    const { did } = await createIdentity(page, 'SelfRequestUser');
    await navigateToFriends(page);

    await expect(
      page.getByText('Or add by DID').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Submit the user's own DID
    await submitDid(page, did);

    // The WASM layer returns "Cannot send a friend request to yourself."
    // The friends page displays the error message from the catch block.
    await expect(
      page
        .getByText(/cannot send a friend request to yourself/i)
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // T3.7.3 — Request to already-friended DID
  // -------------------------------------------------------------------------

  test('T3.7.3 — Request to already-friended DID shows error', async ({
    browser,
  }) => {
    // We need two users to establish a friendship first.
    // User A creates identity, User B creates identity.
    // A sends request to B, B accepts, then A tries to send again.

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Create both identities
      const { did: didA } = await createIdentity(pageA, 'AlreadyFriendA');
      const { did: didB } = await createIdentity(pageB, 'AlreadyFriendB');

      // User A sends friend request to User B
      await navigateToFriends(pageA);
      await expect(
        pageA.getByText('Or add by DID').first(),
      ).toBeVisible({ timeout: 5_000 });
      await submitDid(pageA, didB);

      // Wait for the request to be sent and relayed
      await expect(
        pageA.getByText('Friend request sent!').first(),
      ).toBeVisible({ timeout: 15_000 });

      // User B navigates to Pending tab and accepts the incoming request
      await navigateToFriends(pageB);
      await clickTab(pageB, 'Pending');

      // Wait for the incoming request to appear
      await expect(
        pageB.getByText('Incoming').first(),
      ).toBeVisible({ timeout: 5_000 });

      // Wait for relay to deliver the request
      await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Look for the accept button and click it
      const acceptButton = pageB
        .getByRole('button', { name: /accept/i })
        .first();
      // The request may take a moment to arrive — poll for it
      await expect(acceptButton).toBeVisible({ timeout: 20_000 });
      await acceptButton.click();

      // Wait for friendship to be established
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Now User A tries to send another request to User B (already friends)
      await navigateToFriends(pageA);
      await expect(
        pageA.getByText('Or add by DID').first(),
      ).toBeVisible({ timeout: 5_000 });
      await submitDid(pageA, didB);

      // Expect an "Already friends" error or "request already pending" error
      await expect(
        pageA
          .getByText(/already friends|already pending/i)
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  // -------------------------------------------------------------------------
  // T3.7.4 — Request to blocked DID
  // -------------------------------------------------------------------------

  test('T3.7.4 — Request to blocked DID shows error', async ({
    browser,
  }) => {
    // We need two users: User A blocks User B, then tries to add User B.

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Create both identities
      const { did: _didA } = await createIdentity(pageA, 'BlockedDidA');
      const { did: didB } = await createIdentity(pageB, 'BlockedDidB');

      // User A navigates to friends page
      await navigateToFriends(pageA);

      // First send a request to establish knowledge of User B's DID,
      // then block them. Alternatively, we can block via a direct service
      // call if the UI supports it. The simplest path: send a request,
      // then use the block action from the UI or evaluate directly.

      // For now: use page.evaluate to call the block API directly via the
      // WASM service, since the block UI requires an existing friend/request.
      // This simulates the user having previously blocked someone.
      await pageA.evaluate(async (did) => {
        // Access the Umbra service from the global context (exposed by UmbraContext)
        const { getService } = (window as any).__UMBRA_TEST_HOOKS__ ?? {};
        if (getService) {
          const svc = getService();
          await svc.blockUser(did, 'Test block');
        } else {
          // Fallback: dispatch directly via wasm if test hooks unavailable
          const { UmbraWasm } = (window as any).__UMBRA_WASM__ ?? {};
          if (UmbraWasm) {
            await UmbraWasm.blockUser(did, 'Test block');
          }
        }
      }, didB);

      // Small settle time for the block to persist
      await pageA.waitForTimeout(1_000);

      // Now try to add the blocked DID
      await expect(
        pageA.getByText('Or add by DID').first(),
      ).toBeVisible({ timeout: 5_000 });
      await submitDid(pageA, didB);

      // Expect a "blocked" error message.
      // The WASM layer returns "This user is blocked." which surfaces as feedback.
      await expect(
        pageA.getByText(/blocked/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
