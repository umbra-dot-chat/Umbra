/**
 * 1.1 Account Creation — Completion (Step 5)
 *
 * Tests the completion screen: success message, account summary,
 * Remember Me checkbox, and Get Started navigation.
 *
 * Test IDs: T1.1.32–T1.1.35
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT, createIdentity } from '../../helpers';

test.describe('1.1 Account Creation — Completion', () => {
  test.setTimeout(120_000);

  /** Navigate to the completion screen (skip PIN + username). */
  async function goToCompletion(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('CompleteUser');
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
    await page.getByText('Skip for now').first().click();
    await expect(page.getByText('Account Created!').first()).toBeVisible({ timeout: 15_000 });
  }

  test('T1.1.32 — Success message displayed', async ({ page }) => {
    const { did } = await createIdentity(page, 'SuccessUser');
    expect(did).toBeTruthy();
  });

  test('T1.1.33 — Account summary shows display name and DID', async ({ page }) => {
    await goToCompletion(page);

    await expect(page.getByText('Name:').first()).toBeVisible();
    await expect(page.getByText('CompleteUser').first()).toBeVisible();
    await expect(page.getByText('DID:').first()).toBeVisible();
    await expect(page.locator('text=/did:key:/')).toBeVisible();
  });

  test('T1.1.34 — Remember Me checkbox visible', async ({ page }) => {
    await goToCompletion(page);

    await expect(page.getByText('Remember me on this device').first()).toBeVisible();
    await expect(
      page.getByText('Stay logged in between sessions').first(),
    ).toBeVisible();
  });

  test('T1.1.35 — Get Started navigates to main app', async ({ page }) => {
    const { did } = await createIdentity(page, 'GetStartedUser');

    await expect(page.getByText('Welcome to Umbra').first()).toBeVisible();
    expect(did).toMatch(/^did:key:/);
  });
});
