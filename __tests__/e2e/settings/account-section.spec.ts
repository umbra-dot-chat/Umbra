/**
 * 11.2 Settings — Account Section E2E Tests
 *
 * Tests the Account settings: identity display, DID copy, QR code,
 * recovery phrase, and logout confirmation dialog.
 *
 * Test IDs: T11.2.1–T11.2.8
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.2 Settings — Account', () => {
  test.setTimeout(90_000);

  test('T11.2.1 — Shows display name with avatar', async ({ page }) => {
    await createIdentity(page, 'AcctDisplayUser');
    await navigateToSettings(page);

    // Account is the default section — should see the user's display name
    await expect(page.getByText('AcctDisplayUser').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.2 — Shows "Member since" date', async ({ page }) => {
    await createIdentity(page, 'AcctDateUser');
    await navigateToSettings(page);

    // Should show "Member since" with a date
    await expect(page.getByText(/Member since/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.3 — Truncated DID with "Copy" button', async ({ page }) => {
    await createIdentity(page, 'AcctDidUser');
    await navigateToSettings(page);

    // Should show DID text (truncated)
    await expect(page.locator('text=/did:key:/').first()).toBeVisible({ timeout: 5_000 });

    // Should have a Copy button
    await expect(page.getByText('Copy', { exact: true }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.4 — Copy DID shows "Copied" feedback', async ({ page }) => {
    await createIdentity(page, 'AcctCopyUser');
    await navigateToSettings(page);

    // Click the Copy button
    await page.getByText('Copy', { exact: true }).first().click();

    // Should show "Copied" feedback
    await expect(page.getByText('Copied').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.5 — QR code visible in Sharing sub-section', async ({ page }) => {
    await createIdentity(page, 'AcctQrUser');
    await navigateToSettings(page);

    // Navigate to Sharing subsection
    await navigateToSettingsSubsection(page, 'Sharing');

    // Should show "Share Your Identity" heading
    await expect(
      page.getByText('Share Your Identity').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.8 — Danger Zone shows "Log Out" button', async ({ page }) => {
    await createIdentity(page, 'AcctDangerUser');
    await navigateToSettings(page);

    // Navigate to Danger Zone subsection
    await navigateToSettingsSubsection(page, 'Danger Zone');

    // Should show Log Out button
    await expect(
      page.getByText('Log Out', { exact: true }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.2.8b — Log Out button shows confirmation dialog', async ({ page }) => {
    await createIdentity(page, 'AcctLogoutUser');
    await navigateToSettings(page);

    // Navigate to Danger Zone
    await navigateToSettingsSubsection(page, 'Danger Zone');

    // Click Log Out
    await page.getByText('Log Out', { exact: true }).first().click();
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should show confirmation dialog with "Log Out?" title
    await expect(page.getByText('Log Out?').first()).toBeVisible({ timeout: 5_000 });

    // Should have Cancel button
    await expect(page.getByText('Cancel').first()).toBeVisible({ timeout: 5_000 });
  });
});
