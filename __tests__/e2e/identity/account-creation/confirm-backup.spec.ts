/**
 * 1.1 Account Creation — Confirm Backup (Step 2)
 *
 * Tests the backup confirmation: checkbox visibility, continue button
 * disabled/enabled state, and warning message about losing access.
 *
 * Test IDs: T1.1.17–T1.1.19
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT } from '../../helpers';

test.describe('1.1 Account Creation — Confirm Backup', () => {
  test.setTimeout(120_000);

  /** Navigate to the confirm backup step. */
  async function goToConfirmBackup(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('BackupUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Confirm Your Backup').first()).toBeVisible({
      timeout: 10_000,
    });
  }

  test('T1.1.17 — Confirm backup checkbox visible', async ({ page }) => {
    await goToConfirmBackup(page);

    await expect(
      page.getByText(
        'I have written down my recovery phrase and stored it securely',
      ).first(),
    ).toBeVisible();
  });

  test('T1.1.18 — Continue disabled until checkbox checked', async ({ page }) => {
    await goToConfirmBackup(page);

    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(continueBtn).toBeDisabled();

    await page
      .getByText(
        'I have written down my recovery phrase and stored it securely',
      )
      .first()
      .click();

    await expect(continueBtn).toBeEnabled();
  });

  test('T1.1.19 — Warning message about losing access', async ({ page }) => {
    await goToConfirmBackup(page);

    await expect(page.getByText('Why this matters').first()).toBeVisible();
    await expect(
      page.getByText('Your recovery phrase is the master key to your account').first(),
    ).toBeVisible();

    await expect(
      page.getByText('losing this phrase means losing access to my account forever').first(),
    ).toBeVisible();
  });
});
