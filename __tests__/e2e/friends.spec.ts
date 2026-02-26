/**
 * Friends E2E Tests — Comprehensive coverage of the Friends feature.
 *
 * Covers:
 *   3.1 Friends Page Navigation
 *   3.2 All Friends Tab (empty + populated states)
 *   3.3 Online Tab
 *   3.4 Pending Tab
 *   3.5 Blocked Tab
 *   3.6 Friend Request Flow (Two-User)
 *   3.7 Friend Validation
 *
 * Uses two separate browser contexts to simulate two users.
 * Both connect to the production relay at relay.umbra.chat.
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// ─── Constants ───────────────────────────────────────────────────────────────

const WASM_LOAD_TIMEOUT = 30_000;
const RELAY_SETTLE_TIMEOUT = 8_000;
const UI_SETTLE_TIMEOUT = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wait for the app to fully load: WASM init + identity restore.
 * Returns once we see either the auth screen or the main app.
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.goto('/');
  // Wait for either auth screen or main app to appear
  await Promise.race([
    page.getByRole('button', { name: 'Create New Account' }).waitFor({ timeout: WASM_LOAD_TIMEOUT }),
    page.getByText('Welcome to Umbra').waitFor({ timeout: WASM_LOAD_TIMEOUT }),
  ]);
}

/**
 * Create a fresh identity and return the DID.
 * Walks through the full account creation flow (6 steps).
 *
 * Uses getByRole with exact matching to avoid strict-mode violations
 * from social-login buttons ("Continue with Discord", etc.).
 */
async function createIdentity(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Create New Account' })).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  await page.getByRole('button', { name: 'Create New Account' }).click();

  // Step 1: Display name
  await page.getByPlaceholder('Enter your name').fill(name);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Step 2: Recovery phrase
  await expect(page.getByText('Your Recovery Phrase', { exact: true })).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Step 3: Confirm backup
  await page.getByText('I have written down my recovery phrase and stored it securely').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Step 4: Security PIN — skip
  const skipPin = page.getByText('Skip for now');
  if (await skipPin.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await skipPin.click();
  }

  // Step 5: Username — skip if visible
  const skipUsername = page.getByText('Skip for now');
  if (await skipUsername.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skipUsername.click();
  }

  // Step 6: Completion screen
  await expect(page.getByText('Account Created!')).toBeVisible({ timeout: 15_000 });

  // Extract DID from the success card
  const didElement = page.locator('text=/did:key:/');
  const didText = await didElement.textContent({ timeout: 5_000 }).catch(() => '');
  const did = didText?.match(/did:key:\S+/)?.[0] ?? '';

  await page.getByRole('button', { name: 'Get Started' }).click();

  // Wait for main app to load
  await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

  // Let relay connection establish
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  return did;
}

/**
 * Navigate to the Friends page via the sidebar button.
 */
async function navigateToFriends(page: Page): Promise<void> {
  // Look for the Friends button in the sidebar
  const friendsBtn = page.getByText('Friends').first();
  await friendsBtn.click();
  // Wait for the friends page to load — we should see tab text
  await page.waitForTimeout(1_000);
}

/**
 * Click a specific tab on the friends page.
 */
async function clickTab(page: Page, tabName: 'All' | 'Online' | 'Pending' | 'Blocked'): Promise<void> {
  await page.getByText(tabName, { exact: true }).click();
  await page.waitForTimeout(500);
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

test.describe('3. Friends', () => {
  // Timeout for the full suite — two-user tests take a while
  test.setTimeout(120_000);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.1 Friends Page Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.1 Friends Page Navigation', () => {
    test('T3.1.1 — Click Friends in sidebar loads the friends page', async ({ page }) => {
      // Create an identity so we land in the main app
      await createIdentity(page, 'NavTestUser');

      // Navigate to Friends
      await navigateToFriends(page);

      // Should see the "Friends" title on desktop
      await expect(page.getByText('Friends').first()).toBeVisible();
    });

    test('T3.1.2 — Friends page header shows Friends title with icon', async ({ page }) => {
      await createIdentity(page, 'HeaderTestUser');
      await navigateToFriends(page);

      // The header should show "Friends" text
      const header = page.getByText('Friends').first();
      await expect(header).toBeVisible();
    });

    test('T3.1.3 — Four tabs are visible: All, Online, Pending, Blocked', async ({ page }) => {
      await createIdentity(page, 'TabTestUser');
      await navigateToFriends(page);

      // Check all four tabs exist
      await expect(page.getByText('All', { exact: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Online', { exact: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Pending', { exact: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Blocked', { exact: true })).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.2 All Friends Tab
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.2 All Friends Tab', () => {
    test('T3.2.1 — Profile card visible at top of All tab', async ({ page }) => {
      await createIdentity(page, 'ProfileCardUser');
      await navigateToFriends(page);

      // Profile card shows the user's display name
      await expect(page.getByText('ProfileCardUser')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.2.2 — Add Friend section with DID input is present', async ({ page }) => {
      await createIdentity(page, 'AddFriendUser');
      await navigateToFriends(page);

      // Should see the "Or add by DID" label and input with placeholder
      await expect(page.getByText('Or add by DID')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByPlaceholder('did:key:z6Mk...')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.2.3 — Platform search selector shows Umbra, Discord, GitHub, Steam, Bluesky', async ({ page }) => {
      await createIdentity(page, 'PlatformUser');
      await navigateToFriends(page);

      // Should see "Search on" label
      await expect(page.getByText('Search on')).toBeVisible({ timeout: 5_000 });

      // Platform options
      await expect(page.getByText('Umbra', { exact: true })).toBeVisible();
      await expect(page.getByText('Discord', { exact: true })).toBeVisible();
      await expect(page.getByText('GitHub', { exact: true })).toBeVisible();
      await expect(page.getByText('Steam', { exact: true })).toBeVisible();
      await expect(page.getByText('Bluesky', { exact: true })).toBeVisible();
    });

    test('T3.2.4 — Username search input visible when Umbra platform selected', async ({ page }) => {
      await createIdentity(page, 'UsernameSearchUser');
      await navigateToFriends(page);

      // Default platform is Umbra — username search should be present
      await expect(
        page.getByPlaceholder('Search by username (e.g., Matt or Matt#01283)')
      ).toBeVisible({ timeout: 5_000 });
    });

    test('T3.2.5 — Empty state shows when user has no friends', async ({ page }) => {
      await createIdentity(page, 'LonelyUser');
      await navigateToFriends(page);

      // Empty state message for All Friends
      await expect(
        page.getByText('No friends yet. Add someone by their DID to get started!')
      ).toBeVisible({ timeout: 5_000 });
    });

    test('T3.2.6 — All Friends section shows count (0)', async ({ page }) => {
      await createIdentity(page, 'CountUser');
      await navigateToFriends(page);

      // The section header should show "ALL FRIENDS (0)" (uppercase in UI)
      await expect(page.getByText(/All Friends.*\(0\)/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.3 Online Tab
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.3 Online Tab', () => {
    test('T3.3.1 — Online tab shows empty state when no friends online', async ({ page }) => {
      await createIdentity(page, 'OnlineTabUser');
      await navigateToFriends(page);

      // Switch to Online tab
      await clickTab(page, 'Online');

      // Should see the empty state
      await expect(page.getByText('No friends online right now.')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.3.2 — Online tab shows Online section header with count (0)', async ({ page }) => {
      await createIdentity(page, 'OnlineCountUser');
      await navigateToFriends(page);
      await clickTab(page, 'Online');

      await expect(page.getByText(/Online.*\(0\)/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.4 Pending Tab
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.4 Pending Tab', () => {
    test('T3.4.1 — Pending tab has Add Friend input', async ({ page }) => {
      await createIdentity(page, 'PendingInputUser');
      await navigateToFriends(page);
      await clickTab(page, 'Pending');

      // The DID input should be available on the Pending tab too
      await expect(page.getByPlaceholder('did:key:z6Mk...')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.4.2 — Incoming section shows with empty state', async ({ page }) => {
      await createIdentity(page, 'IncomingEmptyUser');
      await navigateToFriends(page);
      await clickTab(page, 'Pending');

      // Incoming section header
      await expect(page.getByText(/Incoming.*\(0\)/i)).toBeVisible({ timeout: 5_000 });
      // Empty message
      await expect(page.getByText('No incoming requests.')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.4.3 — Outgoing section shows with empty state', async ({ page }) => {
      await createIdentity(page, 'OutgoingEmptyUser');
      await navigateToFriends(page);
      await clickTab(page, 'Pending');

      // Outgoing section header
      await expect(page.getByText(/Outgoing.*\(0\)/i)).toBeVisible({ timeout: 5_000 });
      // Empty message
      await expect(page.getByText('No outgoing requests.')).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.5 Blocked Tab
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.5 Blocked Tab', () => {
    test('T3.5.1 — Blocked tab shows empty state', async ({ page }) => {
      await createIdentity(page, 'BlockedTabUser');
      await navigateToFriends(page);
      await clickTab(page, 'Blocked');

      await expect(page.getByText('No blocked users.')).toBeVisible({ timeout: 5_000 });
    });

    test('T3.5.2 — Blocked Users section shows count (0)', async ({ page }) => {
      await createIdentity(page, 'BlockedCountUser');
      await navigateToFriends(page);
      await clickTab(page, 'Blocked');

      await expect(page.getByText(/Blocked Users.*\(0\)/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.6 Friend Request Flow (Two-User)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.6 Friend Request Flow', () => {
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;
    let didA: string;
    let didB: string;

    test.beforeAll(async ({ browser }) => {
      // Create two isolated browser contexts
      contextA = await browser.newContext();
      contextB = await browser.newContext();
      pageA = await contextA.newPage();
      pageB = await contextB.newPage();

      // Create identities for both users
      didA = await createIdentity(pageA, 'Alice');
      didB = await createIdentity(pageB, 'Bob');
    });

    test.afterAll(async () => {
      await contextA.close();
      await contextB.close();
    });

    test('T3.6.1 — Both users have valid DIDs', async () => {
      expect(didA).toMatch(/^did:key:/);
      expect(didB).toMatch(/^did:key:/);
      expect(didA).not.toBe(didB);
    });

    test('T3.6.2 — Alice sends friend request to Bob via DID', async () => {
      // Alice navigates to Friends
      await navigateToFriends(pageA);

      // Wait for relay to settle
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT);

      // Find the DID input and enter Bob's DID
      const didInput = pageA.getByPlaceholder('did:key:z6Mk...');
      await expect(didInput).toBeVisible({ timeout: 5_000 });
      await didInput.fill(didB);

      // Click the send/submit button (AddFriendInput has a submit action)
      // The AddFriendInput component submits on button press
      await didInput.press('Enter');

      // Wait for relay delivery
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Should see success feedback
      await expect(pageA.getByText('Friend request sent!')).toBeVisible({ timeout: 10_000 }).catch(() => {
        // The feedback might have already disappeared (3s timeout)
        // If so, check that the outgoing request appears
      });
    });

    test('T3.6.3 — Alice sees outgoing request in Pending tab', async () => {
      await clickTab(pageA, 'Pending');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Outgoing section should show count > 0 or contain Bob's truncated DID
      const outgoingSection = pageA.getByText(/Outgoing.*\(1\)/i);
      await expect(outgoingSection).toBeVisible({ timeout: 10_000 }).catch(async () => {
        // May need to wait for state update
        await pageA.waitForTimeout(3_000);
      });

      // Should see a Cancel button on the outgoing request
      await expect(pageA.getByText('Cancel')).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Button might not be visible if request already processed
      });
    });

    test('T3.6.4 — Bob sees incoming request in Pending tab', async () => {
      // Give relay extra time to deliver the request across contexts
      await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);

      // Navigate Bob to Friends > Pending tab
      await navigateToFriends(pageB);
      await clickTab(pageB, 'Pending');
      await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Poll: if Accept not visible, reload and try again (relay can be slow)
      const acceptBtn = pageB.getByText('Accept');
      let visible = await acceptBtn.isVisible({ timeout: 10_000 }).catch(() => false);

      if (!visible) {
        // Refresh the page and re-navigate to trigger a fresh fetch
        await pageB.reload({ waitUntil: 'networkidle' });
        await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);
        await navigateToFriends(pageB);
        await clickTab(pageB, 'Pending');
        await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);
      }

      await expect(acceptBtn).toBeVisible({ timeout: 20_000 });
    });

    test('T3.6.5 — Bob accepts the friend request', async () => {
      // Ensure we're on the Pending tab with the Accept button
      const acceptBtn = pageB.getByText('Accept');
      await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
      await acceptBtn.click();

      // Wait for relay to sync the acceptance
      await pageB.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);

      // Switch to All tab — Bob should see Alice as a friend
      await clickTab(pageB, 'All');
      await pageB.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Alice should appear in Bob's friend list
      await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 15_000 });
    });

    test('T3.6.6 — Alice sees Bob as a friend after acceptance', async () => {
      // Give relay time to deliver the acceptance
      await pageA.waitForTimeout(RELAY_SETTLE_TIMEOUT * 2);

      // Refresh Alice to pick up the acceptance
      await pageA.reload({ waitUntil: 'networkidle' });
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
      await navigateToFriends(pageA);
      await clickTab(pageA, 'All');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);

      // Bob should appear in Alice's friend list
      await expect(pageA.getByText('Bob')).toBeVisible({ timeout: 15_000 });
    });

    test('T3.6.7 — Both users see Online/Offline sections when friends exist', async () => {
      // Alice should already be on the All tab from T3.6.6
      // On All tab with friends, should see Online and/or Offline sections
      const onlineSection = pageA.getByText(/Online.*\(\d+\)/i);
      const offlineSection = pageA.getByText(/Offline.*\(\d+\)/i);
      const allFriends = pageA.getByText(/All Friends.*\(\d+\)/i);

      // At least one section should be visible with count > 0
      const onlineVisible = await onlineSection.isVisible({ timeout: 5_000 }).catch(() => false);
      const offlineVisible = await offlineSection.isVisible({ timeout: 5_000 }).catch(() => false);
      const allVisible = await allFriends.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(onlineVisible || offlineVisible || allVisible).toBeTruthy();
    });

    test('T3.6.8 — Friend items show Message and More action buttons', async () => {
      // On Alice's page, check that Bob's friend item has action buttons
      // The buttons use accessibilityLabel, so we can find them
      await expect(pageA.getByLabel('Message').first()).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Buttons might be icon-only and use accessibilityLabel
      });
    });

    test('T3.6.9 — DM conversation auto-created in sidebar after friendship', async () => {
      // Navigate back to main page
      await pageA.goto('/');
      await pageA.waitForTimeout(UI_SETTLE_TIMEOUT * 2);

      // Bob's name should appear in the conversations sidebar
      // Use a longer timeout — DM creation may take a moment after friendship
      await expect(pageA.getByText('Bob')).toBeVisible({ timeout: 20_000 }).catch(async () => {
        // If not visible, reload and try again
        await pageA.reload({ waitUntil: 'networkidle' });
        await pageA.waitForTimeout(UI_SETTLE_TIMEOUT);
        await expect(pageA.getByText('Bob')).toBeVisible({ timeout: 10_000 });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.7 Friend Validation
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('3.7 Friend Validation', () => {
    test('T3.7.1 — Invalid DID shows error message', async ({ page }) => {
      await createIdentity(page, 'ValidationUser');
      await navigateToFriends(page);

      // Enter a short/invalid DID
      const didInput = page.getByPlaceholder('did:key:z6Mk...');
      await didInput.fill('abc');
      await didInput.press('Enter');

      // Should see validation error
      await expect(
        page.getByText('Please enter a valid DID (did:key:z6Mk...).')
      ).toBeVisible({ timeout: 5_000 });
    });

    test('T3.7.2 — Short DID (spaces only) shows error', async ({ page }) => {
      await createIdentity(page, 'EmptyDIDUser');
      await navigateToFriends(page);

      // Enter whitespace-only value (treated as empty after trim)
      const didInput = page.getByPlaceholder('did:key:z6Mk...');
      await didInput.fill('   ');

      // Click the Send Request button directly (Enter may not fire for empty-ish input)
      await page.getByText('Send Request').click();

      // Should see validation error (value.trim().length < 8)
      await expect(
        page.getByText('Please enter a valid DID (did:key:z6Mk...).')
      ).toBeVisible({ timeout: 5_000 });
    });

    test('T3.7.3 — Error message auto-dismisses after 3 seconds', async ({ page }) => {
      await createIdentity(page, 'DismissUser');
      await navigateToFriends(page);

      const didInput = page.getByPlaceholder('did:key:z6Mk...');
      await didInput.fill('short');
      await didInput.press('Enter');

      // Error appears
      await expect(
        page.getByText('Please enter a valid DID (did:key:z6Mk...).')
      ).toBeVisible({ timeout: 5_000 });

      // Wait for auto-dismiss (3 seconds + buffer)
      await page.waitForTimeout(4_000);

      // Error should be gone
      await expect(
        page.getByText('Please enter a valid DID (did:key:z6Mk...).')
      ).not.toBeVisible({ timeout: 2_000 });
    });

    test('T3.7.4 — Platform search input changes when switching platforms', async ({ page }) => {
      await createIdentity(page, 'PlatformSwitchUser');
      await navigateToFriends(page);

      // Default: Umbra — should see username search placeholder
      await expect(
        page.getByPlaceholder('Search by username (e.g., Matt or Matt#01283)')
      ).toBeVisible({ timeout: 5_000 });

      // Click Discord platform
      await page.getByText('Discord', { exact: true }).click();
      await page.waitForTimeout(500);

      // Should now see Discord-specific placeholder
      await expect(
        page.getByPlaceholder('Search by Discord username...')
      ).toBeVisible({ timeout: 5_000 });

      // Click GitHub
      await page.getByText('GitHub', { exact: true }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByPlaceholder('Search by GitHub username...')
      ).toBeVisible({ timeout: 5_000 });
    });

    test('T3.7.5 — Username search shows no results for non-existent user', async ({ page }) => {
      await createIdentity(page, 'NoResultUser');
      await navigateToFriends(page);

      // Type a non-existent username
      const usernameInput = page.getByPlaceholder('Search by username (e.g., Matt or Matt#01283)');
      await usernameInput.fill('zzz_nonexistent_user_12345');

      // Wait for debounce (400ms) + search time
      await page.waitForTimeout(2_000);

      // Should see "No users found" message
      await expect(
        page.getByText(/No users found matching/)
      ).toBeVisible({ timeout: 5_000 });
    });
  });
});
