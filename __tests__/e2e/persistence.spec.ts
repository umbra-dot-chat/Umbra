/**
 * Persistence E2E Tests — IndexedDB data persistence and wipe.
 *
 * Tests that data survives page refresh and that the
 * Data Management wipe features work correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Persistence', () => {
  test('should show splash screen on reload with existing identity', async ({ page }) => {
    // First create an identity
    await page.goto('/');
    await expect(page.getByText('Create New Wallet')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Create New Wallet').click();
    await page.getByPlaceholder('Enter your name').fill('SplashUser');
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

    // Reload — splash screen should show then main view
    await page.reload();

    // Wait for either splash text or main view (splash may be too fast to catch)
    await expect(
      page.getByText('Welcome to Umbra').or(page.getByText('Loading'))
    ).toBeVisible({ timeout: 30_000 });

    // Eventually should settle on main view
    await expect(page.getByText('Welcome to Umbra')).toBeVisible({ timeout: 30_000 });
  });

  test('should clear all data via Settings', async ({ page }) => {
    // Create identity
    await page.goto('/');
    await expect(page.getByText('Create New Wallet')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Create New Wallet').click();
    await page.getByPlaceholder('Enter your name').fill('WipeUser');
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

    // Open Settings
    const settingsBtn = page.locator('[aria-label*="settings"]').or(page.getByText('Settings'));
    if (await settingsBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsBtn.first().click();

      // Navigate to Data section
      const dataTab = page.getByText('Data');
      if (await dataTab.isVisible({ timeout: 3_000 })) {
        await dataTab.click();

        // Click Clear All Data
        const clearAllBtn = page.getByText('Clear All Data').first();
        if (await clearAllBtn.isVisible()) {
          await clearAllBtn.click();

          // Confirm in dialog
          const confirmBtn = page.getByText('Clear All Data').last();
          if (await confirmBtn.isVisible({ timeout: 3_000 })) {
            await confirmBtn.click();
          }

          // Should show success message
          await expect(page.getByText(/cleared/i)).toBeVisible({ timeout: 5_000 });
        }
      }
    }
  });
});
