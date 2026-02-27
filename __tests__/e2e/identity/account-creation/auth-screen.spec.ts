/**
 * 1.1 Account Creation — Auth Screen
 *
 * Tests the initial auth screen: background, Create/Import cards,
 * and privacy footer text.
 *
 * Test IDs: T1.1.1–T1.1.3
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT } from '../../helpers';

test.describe('1.1 Account Creation — Auth Screen', () => {
  test.setTimeout(120_000);

  test('T1.1.1 — Fresh load shows auth screen with animated blob background', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

    await expect(
      page.getByText('Your private keys never leave your device').first(),
    ).toBeVisible();
  });

  test('T1.1.2 — Create Account card is visible and clickable', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

    await expect(page.getByText('Create Account').first()).toBeVisible();

    await expect(
      page.getByText('Generate a new account to get started').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Create New Account' }).click();
    await expect(page.getByText('Choose Your Name').first()).toBeVisible({ timeout: 10_000 });
  });

  test('T1.1.3 — Import Account card is visible and clickable', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Import Existing Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

    await expect(page.getByText('Import Account').first()).toBeVisible();

    await expect(
      page.getByText('Already have an account?').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Import Existing Account' }).click();
    await expect(page.getByText('Enter Your Recovery Phrase').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
