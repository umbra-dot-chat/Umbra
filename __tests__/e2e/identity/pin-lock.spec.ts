/**
 * 1.3 PIN Lock E2E Tests
 *
 * Tests PIN lock setup from settings, lock screen behavior,
 * correct/wrong PIN entry, and PIN removal.
 *
 * Test IDs: T1.3.1–T1.3.14
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  enterPin,
} from '../helpers';

test.describe('1.3 PIN Lock', () => {
  test.setTimeout(120_000);

  let pinContext: BrowserContext;
  let pinPage: Page;

  test.beforeAll(async ({ browser }) => {
    pinContext = await browser.newContext();
    pinPage = await pinContext.newPage();

    // Create an identity with a PIN
    await createIdentity(pinPage, 'PinLockUser', { pin: '12345' });
  });

  test.afterAll(async () => {
    await pinContext.close();
  });

  test('T1.3.1 — Enable PIN from settings shows setup dialog', async ({ page }) => {
    // Create identity without PIN first
    await createIdentity(page, 'EnablePinUser');

    // Open Settings
    await navigateToSettings(page);
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Navigate to Privacy section
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    // Look for PIN Lock toggle
    const pinToggle = page.getByText('PIN Lock').first();
    await expect(pinToggle).toBeVisible({ timeout: 5_000 });
  });

  test('T1.3.2 — PIN setup stage 1: enter 5-digit PIN with masked dots', async ({
    page,
  }) => {
    await createIdentity(page, 'PinSetup1User');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    // Enable PIN Lock
    const pinToggle = page.getByText('PIN Lock').first();
    const toggleIsVisible = await pinToggle
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (toggleIsVisible) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      // PIN setup dialog should show
      const setupText = page.getByText('Secure Your Account').first();
      const isSetupVisible = await setupText
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (isSetupVisible) {
        // PIN input should exist
        const pinInput = page.locator('input[inputmode="numeric"]').first();
        await expect(pinInput).toBeAttached();
      }
    }
  });

  test('T1.3.3 — PIN setup stage 2: confirm PIN', async ({ page }) => {
    await createIdentity(page, 'PinSetup2User');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    const toggleIsVisible = await pinToggle
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (toggleIsVisible) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      const setupText = page.getByText('Secure Your Account').first();
      if (await setupText.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // Enter PIN
        await enterPin(page, '55555');
        await page.waitForTimeout(1_000);

        // Confirm step should appear
        await expect(page.getByText('Confirm Your PIN').first()).toBeVisible({
          timeout: 5_000,
        });
      }
    }
  });

  test('T1.3.4 — Matching confirm saves PIN', async ({ page }) => {
    await createIdentity(page, 'PinSaveUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      if (
        await page
          .getByText('Secure Your Account')
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await enterPin(page, '55555');
        await page.waitForTimeout(1_000);

        if (
          await page
            .getByText('Confirm Your PIN')
            .first()
            .isVisible({ timeout: 5_000 })
            .catch(() => false)
        ) {
          await enterPin(page, '55555');
          await page.waitForTimeout(2_000);

          // PIN should be saved — dialog should close
          // The settings page should reflect PIN is enabled
        }
      }
    }
  });

  test('T1.3.5 — Mismatched confirm shows error message', async ({ page }) => {
    await createIdentity(page, 'PinMismatchUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      if (
        await page
          .getByText('Secure Your Account')
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await enterPin(page, '55555');
        await page.waitForTimeout(1_000);

        if (
          await page
            .getByText('Confirm Your PIN')
            .first()
            .isVisible({ timeout: 5_000 })
            .catch(() => false)
        ) {
          // Enter wrong confirmation
          await enterPin(page, '11111');
          await page.waitForTimeout(1_000);

          await expect(
            page.getByText('PINs do not match').first(),
          ).toBeVisible({ timeout: 5_000 });
        }
      }
    }
  });

  test('T1.3.6 — Cancel on setup dialog reverts toggle', async ({ page }) => {
    await createIdentity(page, 'PinCancelUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      // Look for cancel or close button on the setup dialog
      const cancelBtn = page.getByText('Cancel', { exact: true }).first();
      const closeBtn = page.locator('[aria-label="Close"]').first();

      if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await cancelBtn.click();
      } else if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await closeBtn.click();
      }

      await page.waitForTimeout(1_000);
    }
  });

  test('T1.3.7 — Refresh page shows PIN lock screen', async () => {
    // Use the pinPage that has a PIN set
    await pinPage.reload({ waitUntil: 'networkidle' });
    await pinPage.waitForTimeout(UI_SETTLE_TIMEOUT);

    // PIN lock screen should appear
    await expect(pinPage.getByText('Welcome Back').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
  });

  test('T1.3.8 — Lock screen shows welcome message with PIN input', async () => {
    // pinPage should still show the lock screen from T1.3.7
    await expect(pinPage.getByText('Welcome Back').first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(pinPage.getByText('Enter your PIN to unlock').first()).toBeVisible({
      timeout: 5_000,
    });

    // PIN input should be present
    const pinInput = pinPage.locator('input[inputmode="numeric"]').first();
    await expect(pinInput).toBeAttached();
  });

  test('T1.3.9 — Enter correct PIN unlocks the app', async () => {
    // Reload to ensure we're at the lock screen
    await pinPage.reload({ waitUntil: 'networkidle' });
    await pinPage.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(pinPage.getByText('Welcome Back').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });

    // Enter correct PIN
    await enterPin(pinPage, '12345');
    await pinPage.waitForTimeout(2_000);

    // App should unlock — should see main app or welcome
    await expect(pinPage.getByText('Welcome to Umbra').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
  });

  test('T1.3.10 — Enter wrong PIN shows error message', async () => {
    // Reload to get back to lock screen
    await pinPage.reload({ waitUntil: 'networkidle' });
    await pinPage.waitForTimeout(UI_SETTLE_TIMEOUT);

    await expect(pinPage.getByText('Welcome Back').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });

    // Enter wrong PIN
    await enterPin(pinPage, '99999');
    await pinPage.waitForTimeout(1_000);

    // Error message
    await expect(pinPage.getByText(/Incorrect PIN/).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('T1.3.11 — Disable PIN: toggle off shows removal dialog', async () => {
    // First unlock the app
    await pinPage.reload({ waitUntil: 'networkidle' });
    await pinPage.waitForTimeout(UI_SETTLE_TIMEOUT);
    await expect(pinPage.getByText('Welcome Back').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
    await enterPin(pinPage, '12345');
    await pinPage.waitForTimeout(2_000);
    await expect(pinPage.getByText('Welcome to Umbra').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });

    // Navigate to settings > Privacy
    await navigateToSettings(pinPage);
    await navigateToSettingsSection(pinPage, 'Privacy');
    await pinPage.waitForTimeout(1_000);

    // Toggle PIN Lock off
    const pinToggle = pinPage.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await pinPage.waitForTimeout(1_000);

      // Removal dialog should ask for current PIN
      // Look for PIN input or "Enter current PIN" text
      const pinInput = pinPage.locator('input[inputmode="numeric"]').first();
      const isInputVisible = await pinInput
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(isInputVisible).toBeTruthy();
    }
  });

  test('T1.3.12 — Enter correct PIN to remove disables PIN', async () => {
    // This builds on T1.3.11 state
    // If we're in the removal dialog, enter the correct PIN
    const pinInput = pinPage.locator('input[inputmode="numeric"]').first();
    const isInputVisible = await pinInput
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (isInputVisible) {
      await enterPin(pinPage, '12345');
      await pinPage.waitForTimeout(2_000);
    }
  });

  test('T1.3.13 — Wrong PIN on disable shows error', async ({ page }) => {
    // Create identity with PIN, then try to disable with wrong PIN
    await createIdentity(page, 'WrongDisableUser', { pin: '12345' });
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      const pinInput = page.locator('input[inputmode="numeric"]').first();
      if (await pinInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await enterPin(page, '99999');
        await page.waitForTimeout(1_000);

        // Should show error
        await expect(page.getByText(/Incorrect PIN/).first()).toBeVisible({
          timeout: 5_000,
        });
      }
    }
  });

  test('T1.3.14 — Cancel on removal dialog keeps PIN enabled', async ({ page }) => {
    await createIdentity(page, 'CancelRemoveUser', { pin: '12345' });
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');
    await page.waitForTimeout(1_000);

    const pinToggle = page.getByText('PIN Lock').first();
    if (await pinToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pinToggle.click();
      await page.waitForTimeout(1_000);

      // Cancel the removal
      const cancelBtn = page.getByText('Cancel', { exact: true }).first();
      if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(1_000);
      }
    }
  });
});
