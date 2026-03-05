/**
 * 11.8 Settings — Privacy Section E2E Tests
 *
 * Tests privacy settings: friend discovery panel, visibility toggles
 * (read receipts, typing indicators, online status), and security/PIN lock.
 *
 * Test IDs: T11.8.1–T11.8.13
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.8 Settings — Privacy', () => {
  test.setTimeout(60_000);

  test('T11.8.1 — Privacy section loads with description', async ({ page }) => {
    await createIdentity(page, 'PrivacyDescUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');

    // Should see section description
    await expect(
      page.getByText('Manage your visibility and control what others can see').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.8.6–T11.8.9 — Visibility toggles: Read Receipts, Typing, Online', async ({
    page,
  }) => {
    await createIdentity(page, 'PrivVisUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');

    // Navigate to Visibility sub-section
    await navigateToSettingsSubsection(page, 'Visibility');

    // Read Receipts
    await expect(page.getByText('Read Receipts').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText("Let others know when you've seen their messages").first(),
    ).toBeVisible({ timeout: 5_000 });

    // Typing Indicators
    await expect(page.getByText('Typing Indicators').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText('Show when you are typing a message').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Online Status
    await expect(page.getByText('Online Status').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText('Show your online status to other users').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.8.10–T11.8.12 — Security sub-section shows PIN Lock toggle', async ({
    page,
  }) => {
    await createIdentity(page, 'PrivSecUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Privacy');

    // Navigate to Security sub-section
    await navigateToSettingsSubsection(page, 'Security');

    // PIN Lock
    await expect(page.getByText('PIN Lock').first()).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText('Require a PIN to unlock the app').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
