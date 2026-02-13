/**
 * Identity E2E Tests — Create identity, persistence across refresh.
 */

import { test, expect } from '@playwright/test';

test.describe('Identity', () => {
  test('should create a new identity and display DID', async ({ page }) => {
    await page.goto('/');

    // Should land on auth screen
    await expect(page.getByText('Create New Wallet')).toBeVisible({ timeout: 15_000 });

    // Enter display name
    await page.getByText('Create New Wallet').click();
    await page.getByPlaceholder('Enter your name').fill('TestUser');
    await page.getByText('Continue').click();

    // Recovery phrase should appear
    await expect(page.getByText('Your Recovery Phrase')).toBeVisible({ timeout: 30_000 });
    await page.getByText('Continue').click();

    // Confirm backup
    await page.getByText('I have written down my recovery phrase').click();
    await page.getByText('Continue').click();

    // Skip PIN setup
    await expect(page.getByText('Security PIN')).toBeVisible();
    const skipBtn = page.getByText('Skip');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }

    // Complete — should show success
    await expect(page.getByText('Wallet Created!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('TestUser')).toBeVisible();

    // Finish
    await page.getByText('Get Started').click();

    // Should be in the main app
    await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: 15_000 });
  });

  test('should persist identity across page refresh', async ({ page }) => {
    await page.goto('/');

    // Create an identity first
    await expect(page.getByText('Create New Wallet')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Create New Wallet').click();
    await page.getByPlaceholder('Enter your name').fill('PersistUser');
    await page.getByText('Continue').click();
    await expect(page.getByText('Your Recovery Phrase')).toBeVisible({ timeout: 30_000 });
    await page.getByText('Continue').click();
    await page.getByText('I have written down my recovery phrase').click();
    await page.getByText('Continue').click();
    const skipBtn = page.getByText('Skip');
    if (await skipBtn.isVisible()) await skipBtn.click();
    await expect(page.getByText('Wallet Created!')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Get Started').click();
    await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: 15_000 });

    // Reload the page
    await page.reload();

    // Should restore from IndexedDB (splash screen then main view)
    await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: 30_000 });
  });
});
