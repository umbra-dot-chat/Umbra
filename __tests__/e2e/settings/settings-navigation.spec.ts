/**
 * 11.1 Settings Navigation E2E Tests
 *
 * Tests the Settings dialog: opening via gear icon, sidebar sections,
 * section navigation, and closing behavior.
 *
 * Test IDs: T11.1.1–T11.1.4
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.1 Settings — Navigation', () => {
  test.setTimeout(90_000);

  test('T11.1.1 — Gear icon in nav rail opens settings overlay', async ({ page }) => {
    await createIdentity(page, 'SettingsNavUser');
    await navigateToSettings(page);

    // Settings dialog should be open — look for a section name
    await expect(page.getByText('Account').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.1.2 — Left sidebar shows all 13 sections', async ({ page }) => {
    await createIdentity(page, 'SettingsSectionsUser');
    await navigateToSettings(page);

    const sections = [
      'Account',
      'Profile',
      'Appearance',
      'Messaging',
      'Notifications',
      'Sounds',
      'Privacy',
      'Audio & Video',
      'Network',
      'Data',
      'Plugins',
      'Shortcuts',
      'About',
    ];

    for (const section of sections) {
      await expect(page.getByText(section, { exact: true }).first()).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('T11.1.3 — Click section loads content on right', async ({ page }) => {
    await createIdentity(page, 'SettingsClickUser');
    await navigateToSettings(page);

    // Click "Profile" section
    await navigateToSettingsSection(page, 'Profile');

    // Should see Profile section content
    await expect(
      page.getByText('Manage your public profile information').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click "About" section
    await navigateToSettingsSection(page, 'About');

    // Should see About section content
    await expect(page.getByText('About').first()).toBeVisible({ timeout: 5_000 });
  });

  test('T11.1.4 — Settings overlay can be closed', async ({ page }) => {
    await createIdentity(page, 'SettingsCloseUser');
    await navigateToSettings(page);

    // Verify settings is open
    await expect(page.getByText('Account').first()).toBeVisible({ timeout: 5_000 });

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Settings content should no longer be in view — main app should show
    await expect(
      page.getByText('Welcome to Umbra').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
