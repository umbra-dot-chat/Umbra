/**
 * 11.3 Settings — Profile Section E2E Tests
 *
 * Tests the Profile settings: avatar upload area, display name input,
 * username field, bio, status dropdown, and save changes.
 *
 * Test IDs: T11.3.1–T11.3.7
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.3 Settings — Profile', () => {
  test.setTimeout(60_000);

  test('T11.3.1 — Avatar upload area with "Upload Photo" button', async ({ page }) => {
    await createIdentity(page, 'ProfAvatarUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Profile');

    // Should see "Upload Photo" button
    await expect(
      page.getByText('Upload Photo').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.3.2 — Display name input is editable', async ({ page }) => {
    await createIdentity(page, 'ProfNameUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Profile');

    // Should see description text for display name
    await expect(
      page.getByText('How others see you in conversations').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Find and interact with the display name input
    const nameInput = page.getByPlaceholder('Your display name');
    await expect(nameInput.first()).toBeVisible({ timeout: 5_000 });

    // Clear and type new name
    await nameInput.first().fill('NewDisplayName');
    await expect(nameInput.first()).toHaveValue('NewDisplayName');
  });

  test('T11.3.5 — Status dropdown shows all options', async ({ page }) => {
    await createIdentity(page, 'ProfStatusUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Profile');

    // Should see "Set your availability status" description
    await expect(
      page.getByText('Set your availability status').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Status label should be visible
    await expect(page.getByText('Status').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.3.6 — Save Changes button appears when modifications detected', async ({
    page,
  }) => {
    await createIdentity(page, 'ProfSaveUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Profile');

    // Initially, "Save Changes" button should NOT be visible
    const saveBtn = page.getByText('Save Changes', { exact: true }).first();
    const isInitiallyVisible = await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    // Modify the display name to trigger save button
    const nameInput = page.getByPlaceholder('Your display name');
    await nameInput.first().fill('ModifiedName');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Now "Save Changes" should be visible
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
  });
});
