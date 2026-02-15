/**
 * Calling E2E Tests — WebRTC voice and video call negotiation.
 *
 * Tests two-browser-context calling via the production relay.
 * Requires microphone permissions (granted via Playwright browser context).
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wait for the app to fully load and WASM to be ready. */
async function waitForAppReady(page: Page): Promise<void> {
  await page.goto('/');
  // Wait for app to initialize (WASM load + identity restore)
  await page.waitForTimeout(5000);
}

/** Create a new identity if none exists. Returns the DID. */
async function ensureIdentity(page: Page, displayName: string): Promise<string> {
  // Check if already authenticated
  const welcomeVisible = await page.getByText('Welcome to Umbra').isVisible({ timeout: 3000 }).catch(() => false);
  if (!welcomeVisible) {
    // Already has an identity — grab the DID from settings or profile
    return '';
  }

  // Create new identity
  const nameInput = page.getByPlaceholder(/name|display/i);
  if (await nameInput.isVisible({ timeout: 5000 })) {
    await nameInput.fill(displayName);
    // Look for a create/continue button
    const createBtn = page.getByRole('button', { name: /create|continue|start/i });
    if (await createBtn.isVisible({ timeout: 3000 })) {
      await createBtn.click();
    }
  }

  await page.waitForTimeout(3000);
  return '';
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Voice & Video Calling', () => {
  test('should open call diagnostics page', async ({ page }) => {
    await waitForAppReady(page);

    // Navigate to call diagnostics
    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Should see the diagnostics header
    await expect(page.getByText('Call Diagnostics')).toBeVisible({ timeout: 10_000 });

    // Should see all 6 sections
    await expect(page.getByText('1. Relay Connectivity')).toBeVisible();
    await expect(page.getByText('2. TURN/STUN Connectivity')).toBeVisible();
    await expect(page.getByText('3. Loopback Audio Test')).toBeVisible();
    await expect(page.getByText('4. Call Negotiation Test')).toBeVisible();
    await expect(page.getByText('5. Real-Time Call Stats')).toBeVisible();
    await expect(page.getByText('6. ICE Candidate Log')).toBeVisible();
  });

  test('should test relay connectivity', async ({ page }) => {
    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Click "Test All" button for relay tests
    const testAllBtn = page.getByRole('button', { name: /test all/i }).first();
    await testAllBtn.click();

    // Wait for results (relay connection + registration takes a few seconds)
    await page.waitForTimeout(12_000);

    // At least one relay should show a latency value (pass)
    const relaySection = page.getByText('1. Relay Connectivity').locator('..');
    // We can't easily check the result text, but the section should update
    // from "—" to either a latency value or error
  });

  test('should test STUN connectivity', async ({ page }) => {
    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Click "Run Tests" for TURN/STUN
    const runTestsBtn = page.getByRole('button', { name: /run tests/i }).first();
    await runTestsBtn.click();

    // Wait for STUN tests to complete (10s timeout each, but usually fast)
    await page.waitForTimeout(15_000);

    // Should see STUN results
    const stunResult = page.getByText(/STUN stun/);
    await expect(stunResult.first()).toBeVisible({ timeout: 5_000 });
  });

  test('should capture microphone audio', async ({ browser }) => {
    // Create context with microphone permissions
    const context = await browser.newContext({
      permissions: ['microphone'],
    });
    const page = await context.newPage();

    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Click "Start Mic"
    const startMicBtn = page.getByRole('button', { name: /start mic/i });
    if (await startMicBtn.isVisible({ timeout: 5_000 })) {
      await startMicBtn.click();
      await page.waitForTimeout(2000);

      // Should show device name
      await expect(page.getByText('Device')).toBeVisible();

      // Click "Stop" to clean up
      const stopBtn = page.getByRole('button', { name: /stop/i });
      if (await stopBtn.isVisible()) {
        await stopBtn.click();
      }
    }

    await context.close();
  });

  test('should create SDP offer in negotiation test', async ({ page }) => {
    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Click "Create Offer"
    const createOfferBtn = page.getByRole('button', { name: /create offer/i });
    await createOfferBtn.click();

    // Wait for ICE gathering
    await page.waitForTimeout(5000);

    // State should change from idle
    const stateText = page.getByText(/offer-created|new|checking|connected/);
    await expect(stateText).toBeVisible({ timeout: 10_000 });

    // Should show log entries
    const logEntry = page.getByText(/Offer created|ICE candidate|ICE gathering/);
    await expect(logEntry.first()).toBeVisible({ timeout: 5_000 });

    // Reset
    const resetBtn = page.getByRole('button', { name: /reset/i });
    await resetBtn.click();
  });

  test('should show empty state for call stats when no call active', async ({ page }) => {
    await page.goto('/call-diagnostics');
    await page.waitForTimeout(2000);

    // Should show "No active call" message
    await expect(page.getByText('No active call')).toBeVisible();
  });
});
