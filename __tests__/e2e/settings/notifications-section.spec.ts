/**
 * 11.6 Settings — Notifications Section E2E Tests
 *
 * Tests notification settings: push notifications toggle,
 * message preview toggle.
 *
 * Test IDs: T11.6.1–T11.6.3
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
} from '../helpers';

test.describe('11.6 Settings — Notifications', () => {
  test.setTimeout(90_000);

  test('T11.6.1 — Push Notifications toggle visible', async ({ page }) => {
    await createIdentity(page, 'NotifPushUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Notifications');

    // Should see the section description
    await expect(
      page.getByText('Control how and when you receive alerts').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see Push Notifications label
    await expect(
      page.getByText('Push Notifications').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see Push Notifications description
    await expect(
      page.getByText('Receive push notifications for new messages').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.6.2 — Message Preview toggle visible', async ({ page }) => {
    await createIdentity(page, 'NotifPreviewUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Notifications');

    // Should see Message Preview label
    await expect(
      page.getByText('Message Preview').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see description
    await expect(
      page.getByText('Show message content in notification banners').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
