/**
 * 11.14 Settings — About Section E2E Tests
 *
 * Tests the About page: version display, update check button,
 * links section, and all platforms dialog.
 *
 * Test IDs: T11.14.1–T11.14.7
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.14 Settings — About', () => {
  test.setTimeout(90_000);

  test('T11.14.1 — App version displayed', async ({ page }) => {
    await createIdentity(page, 'AboutVerUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'About');

    // Should see "App Version" label
    await expect(
      page.getByText('App Version').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.14.4 — "Check for Updates" button visible', async ({ page }) => {
    await createIdentity(page, 'AboutUpdateUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'About');

    // Should see "Check for Updates" button
    await expect(
      page.getByText('Check for Updates').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.14.5 — "All Downloads" button visible', async ({ page }) => {
    await createIdentity(page, 'AboutDlUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'About');

    // Should see "All Downloads" button
    await expect(
      page.getByText('All Downloads').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.14.6 — Links section with GitHub and Web App', async ({ page }) => {
    await createIdentity(page, 'AboutLinksUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'About');

    // Should see Links heading
    await expect(
      page.getByText('Links').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see GitHub Repository link
    await expect(
      page.getByText('GitHub Repository').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see Web App link
    await expect(
      page.getByText('Web App').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.14.7 — About section shows Umbra description', async ({ page }) => {
    await createIdentity(page, 'AboutDescUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'About');

    // Should see the app description
    await expect(
      page.getByText(/private, peer-to-peer messaging/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
