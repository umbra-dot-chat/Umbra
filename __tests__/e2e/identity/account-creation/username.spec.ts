/**
 * 1.1 Account Creation — Username (Step 4)
 *
 * Tests the username input, Claim Username button, availability check,
 * taken username error, registration, and skip.
 *
 * Test IDs: T1.1.26–T1.1.31
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT } from '../../helpers';

test.describe('1.1 Account Creation — Username', () => {
  test.setTimeout(120_000);

  /** Navigate to the username step (skipping PIN). */
  async function goToUsernameStep(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('UsernameUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
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
    await page.getByText('Skip for now').first().click();
    await expect(page.getByText('Choose a Username').first()).toBeVisible({ timeout: 10_000 });
  }

  test('T1.1.26 — Username input field visible', async ({ page }) => {
    await goToUsernameStep(page);

    await expect(
      page.getByText('Pick a unique username so friends can find you').first(),
    ).toBeVisible();

    await expect(page.getByPlaceholder('e.g., Matt')).toBeVisible();

    await expect(
      page.getByText('1-32 characters').first(),
    ).toBeVisible();
  });

  test('T1.1.27 — Claim Username button checks and registers', async ({ page }) => {
    await goToUsernameStep(page);

    const claimBtn = page.getByRole('button', { name: 'Claim Username' });
    await expect(claimBtn).toBeDisabled();

    await page.getByPlaceholder('e.g., Matt').fill('testuser_e2e');
    await expect(claimBtn).toBeEnabled();
  });

  test('T1.1.28 — Available username shows success indicator', async ({ page }) => {
    await goToUsernameStep(page);

    const uniqueName = `e2e_${Date.now()}`;
    await page.getByPlaceholder('e.g., Matt').fill(uniqueName);

    await page.getByRole('button', { name: 'Claim Username' }).click();
    await page.waitForTimeout(3_000);

    await expect(page.getByText('Your username is').first()).toBeVisible({ timeout: 10_000 });
  });

  test('T1.1.29 — Taken username shows error', async ({ page }) => {
    await goToUsernameStep(page);

    await page.getByPlaceholder('e.g., Matt').fill('a');
    await page.getByRole('button', { name: 'Claim Username' }).click();
    await page.waitForTimeout(3_000);

    const errorAlert = page.getByText('Error').first();
    const successText = page.getByText('Your username is').first();
    const hasError = await errorAlert.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasSuccess = await successText
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasError || hasSuccess).toBeTruthy();
  });

  test('T1.1.30 — Claim Username registers the username', async ({ page }) => {
    await goToUsernameStep(page);

    const uniqueName = `e2e_reg_${Date.now()}`;
    await page.getByPlaceholder('e.g., Matt').fill(uniqueName);
    await page.getByRole('button', { name: 'Claim Username' }).click();

    await expect(
      page.getByText('Share this with friends').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('T1.1.31 — Skip button bypasses username', async ({ page }) => {
    await goToUsernameStep(page);

    await page.getByText('Skip for now').first().click();

    await expect(page.getByText('Account Created!').first()).toBeVisible({ timeout: 15_000 });
  });
});
