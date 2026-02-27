/**
 * 1.6 Logout E2E Tests
 *
 * Tests the logout flow from Settings > Account > Danger Zone,
 * including confirm and cancel paths.
 *
 * Test IDs: T1.6.1–T1.6.3
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
} from '../helpers';

test.describe('1.6 Logout', () => {
  test.setTimeout(120_000);

  test('T1.6.1 — Settings > Account > Danger Zone > Log Out button', async ({
    page,
  }) => {
    await createIdentity(page, 'LogoutUser');

    await navigateToSettings(page);
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Navigate to Account section
    await navigateToSettingsSection(page, 'Account');
    await page.waitForTimeout(1_000);

    // Navigate to Danger Zone subsection
    await navigateToSettingsSubsection(page, 'Danger Zone');
    await page.waitForTimeout(1_000);

    // Log Out button should be visible
    await expect(page.getByText('Danger Zone').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole('button', { name: 'Log Out' }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T1.6.2 — Confirm logout redirects to auth screen', async ({ page }) => {
    await createIdentity(page, 'ConfirmLogoutUser');

    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Account');
    await page.waitForTimeout(1_000);
    await navigateToSettingsSubsection(page, 'Danger Zone');
    await page.waitForTimeout(1_000);

    // Click Log Out
    await page.getByRole('button', { name: 'Log Out' }).click();
    await page.waitForTimeout(1_000);

    // Confirmation dialog should appear
    await expect(page.getByText('Log Out?').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText("You'll be signed out of this account").first(),
    ).toBeVisible();

    // Confirm logout
    // There are two "Log Out" buttons — one in the dialog
    const logoutBtns = page.getByRole('button', { name: 'Log Out' });
    await logoutBtns.last().click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should redirect to auth screen
    await expect(
      page.getByRole('button', { name: /Create New/ }),
    ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  });

  test('T1.6.3 — Cancel logout stays in settings', async ({ page }) => {
    await createIdentity(page, 'CancelLogoutUser');

    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Account');
    await page.waitForTimeout(1_000);
    await navigateToSettingsSubsection(page, 'Danger Zone');
    await page.waitForTimeout(1_000);

    // Click Log Out
    await page.getByRole('button', { name: 'Log Out' }).click();
    await page.waitForTimeout(1_000);

    // Confirmation dialog
    await expect(page.getByText('Log Out?').first()).toBeVisible({ timeout: 5_000 });

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(1_000);

    // Should still be in settings — Danger Zone should still be visible
    await expect(page.getByText('Danger Zone').first()).toBeVisible({ timeout: 5_000 });
  });
});
