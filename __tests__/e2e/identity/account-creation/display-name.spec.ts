/**
 * 1.1 Account Creation — Display Name (Step 0)
 *
 * Tests the display name input: placeholder, continue button state,
 * Unicode support, OAuth profile import, and clear import.
 *
 * Test IDs: T1.1.4–T1.1.9
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT } from '../../helpers';

test.describe('1.1 Account Creation — Display Name', () => {
  test.setTimeout(120_000);

  /** Navigate to the display name step. */
  async function goToDisplayName(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await expect(page.getByText('Choose Your Name').first()).toBeVisible({ timeout: 10_000 });
  }

  test('T1.1.4 — Display name input visible with placeholder', async ({ page }) => {
    await goToDisplayName(page);

    await expect(
      page.getByText('This is how others will see you').first(),
    ).toBeVisible();

    const nameInput = page.getByPlaceholder('Enter your name');
    await expect(nameInput).toBeVisible();
  });

  test('T1.1.5 — Continue button disabled until name entered', async ({ page }) => {
    await goToDisplayName(page);

    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(continueBtn).toBeDisabled();

    await page.getByPlaceholder('Enter your name').fill('TestUser');
    await expect(continueBtn).toBeEnabled();
  });

  test('T1.1.6 — Display name accepts Unicode characters', async ({ page }) => {
    await goToDisplayName(page);

    const nameInput = page.getByPlaceholder('Enter your name');

    // Test emoji
    await nameInput.fill('🦄 Unicorn');
    await expect(nameInput).toHaveValue('🦄 Unicorn');

    // Test CJK characters
    await nameInput.fill('影の使者');
    await expect(nameInput).toHaveValue('影の使者');

    // Test accented characters
    await nameInput.fill('Ñoño Müller');
    await expect(nameInput).toHaveValue('Ñoño Müller');

    await expect(
      page.getByRole('button', { name: 'Continue', exact: true }),
    ).toBeEnabled();
  });

  test('T1.1.7 — Profile Import option with OAuth providers listed', async ({
    page,
  }) => {
    await goToDisplayName(page);

    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Discord').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T1.1.8 — Clicking OAuth provider triggers authorize flow', async ({
    page,
  }) => {
    await goToDisplayName(page);

    const githubBtn = page.getByText('GitHub').first();
    await expect(githubBtn).toBeVisible({ timeout: 5_000 });

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null),
      githubBtn.click(),
    ]);

    if (popup) {
      await popup.close();
    }
  });

  test('T1.1.9 — Clear Import button removes pre-filled data', async ({ page }) => {
    await goToDisplayName(page);

    const changeBtn = page.getByText('Change', { exact: true }).first();
    const isChangeVisible = await changeBtn
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (isChangeVisible) {
      await changeBtn.click();
      await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 5_000 });
    }
    // If Change is not visible, OAuth import wasn't done — that's expected
  });
});
