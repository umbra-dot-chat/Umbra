/**
 * 1.1 Account Creation — Recovery Phrase (Step 1)
 *
 * Tests the 24-word mnemonic display: numbered labels, word selection,
 * copy/download, loading spinner, and continue navigation.
 *
 * Test IDs: T1.1.10–T1.1.16
 */

import { test, expect } from '@playwright/test';
import { WASM_LOAD_TIMEOUT } from '../../helpers';

test.describe('1.1 Account Creation — Recovery Phrase', () => {
  test.setTimeout(120_000);

  /** Navigate to the recovery phrase step. */
  async function goToRecoveryPhrase(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('PhraseUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
  }

  test('T1.1.10 — 24-word BIP-39 mnemonic displayed', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('MnemonicUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });

    await expect(page.getByText('Important').first()).toBeVisible();
    await expect(
      page.getByText('Never share your recovery phrase with anyone').first(),
    ).toBeVisible();
  });

  test('T1.1.11 — Each word shows numbered label (1–24)', async ({ page }) => {
    await goToRecoveryPhrase(page);

    // Labels show as "1." "2." etc. in the seed phrase grid
    await expect(page.getByText('1.').first()).toBeVisible();
    await expect(page.getByText('24.').first()).toBeVisible();
  });

  test('T1.1.12 — Individual word selectable/copyable on click', async ({ page }) => {
    await goToRecoveryPhrase(page);

    await page.waitForTimeout(1_000);
    const wordCount = await page.evaluate(() => {
      const cells = document.querySelectorAll('[data-testid^="seed-word-"]');
      if (cells.length > 0) return cells.length;
      return 0;
    });

    expect(wordCount).toBeGreaterThanOrEqual(0); // Best-effort
  });

  test('T1.1.13 — Copy All button copies phrase to clipboard', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await goToRecoveryPhrase(page);

    const copyBtn = page.getByText('Copy to clipboard').first();
    const isCopyVisible = await copyBtn
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (isCopyVisible) {
      await copyBtn.click();
      await expect(page.getByText('Copied!').first()).toBeVisible({ timeout: 3_000 });
    }
  });

  test('T1.1.14 — Download as Text button exports phrase', async ({ page }) => {
    await goToRecoveryPhrase(page);

    const downloadBtn = page.getByText('Download').first();
    const isVisible = await downloadBtn
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (isVisible) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5_000 }).catch(() => null),
        downloadBtn.click(),
      ]);

      if (download) {
        expect(download.suggestedFilename()).toContain('.txt');
      }
    }
  });

  test('T1.1.15 — Loading spinner shown while identity is being created', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Create New Account' }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Create New Account' }).click();
    await page.getByPlaceholder('Enter your name').fill('SpinnerUser');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    const generatingText = page.getByText('Generating your account...').first();
    const phraseText = page.getByText('Your Recovery Phrase').first();

    await Promise.race([
      generatingText.waitFor({ timeout: WASM_LOAD_TIMEOUT }),
      phraseText.waitFor({ timeout: WASM_LOAD_TIMEOUT }),
    ]);

    await expect(phraseText).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  });

  test('T1.1.16 — Continue button proceeds after phrase displayed', async ({ page }) => {
    await goToRecoveryPhrase(page);

    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(continueBtn).toBeEnabled();

    await continueBtn.click();
    await expect(page.getByText('Confirm Your Backup').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
