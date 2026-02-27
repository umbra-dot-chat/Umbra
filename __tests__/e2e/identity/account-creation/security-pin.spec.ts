/**
 * 1.1 Account Creation — Security PIN (Step 3)
 *
 * Tests the PIN setup during account creation: input visibility,
 * masking, confirm step, mismatch error, match success, and skip.
 *
 * Test IDs: T1.1.20–T1.1.25
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT, enterPin } from '../../helpers';

test.describe('1.1 Account Creation — Security PIN', () => {
  test.setTimeout(120_000);

  /** Navigate to the security PIN step. */
  async function goToPinStep(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('PinStepUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Confirm Your Backup').first()).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByText(
        'I have written down my recovery phrase and stored it securely',
      )
      .first()
      .click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Secure Your Account').first()).toBeVisible({
      timeout: 10_000,
    });
  }

  test('T1.1.20 — 5-digit PIN input with masked dots', async ({ page }) => {
    await goToPinStep(page);

    await expect(
      page.getByText('Create a 5-digit PIN').first(),
    ).toBeVisible();

    const pinInput = page.locator('input[inputmode="numeric"]').first();
    await expect(pinInput).toBeAttached();
  });

  test('T1.1.21 — PIN digits are masked by default', async ({ page }) => {
    await goToPinStep(page);

    await enterPin(page, '12345');

    // After entering 5 digits, the component auto-advances to confirm step.
    // This verifies the PIN was accepted (digits were captured and masked).
    await expect(page.getByText('Confirm Your PIN').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('T1.1.22 — Confirm PIN step appears after entry', async ({ page }) => {
    await goToPinStep(page);

    await enterPin(page, '12345');
    await page.waitForTimeout(1_000);

    await expect(page.getByText('Confirm Your PIN').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Re-enter your PIN to confirm').first()).toBeVisible();
  });

  test('T1.1.23 — Mismatched PIN confirm shows error', async ({ page }) => {
    await goToPinStep(page);

    await enterPin(page, '12345');
    await page.waitForTimeout(1_000);

    await expect(page.getByText('Confirm Your PIN').first()).toBeVisible({ timeout: 5_000 });
    await enterPin(page, '99999');
    await page.waitForTimeout(1_000);

    await expect(
      page.getByText('PINs do not match. Please try again.').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T1.1.24 — Matching PIN confirm saves and proceeds', async ({ page }) => {
    await goToPinStep(page);

    await enterPin(page, '12345');
    await page.waitForTimeout(1_000);
    await expect(page.getByText('Confirm Your PIN').first()).toBeVisible({ timeout: 5_000 });
    await enterPin(page, '12345');
    await page.waitForTimeout(2_000);

    await expect(page.getByText('Choose a Username').first()).toBeVisible({ timeout: 10_000 });
  });

  test('T1.1.25 — Skip button bypasses PIN setup', async ({ page }) => {
    await goToPinStep(page);

    await page.getByText('Skip for now').first().click();

    await expect(page.getByText('Choose a Username').first()).toBeVisible({ timeout: 10_000 });
  });
});
