/**
 * 11.11 Settings — Data Management Section E2E Tests
 *
 * Tests data management: storage info display, clear messages button,
 * clear all data button, and confirmation dialogs.
 *
 * Test IDs: T11.11.1–T11.11.11
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.11 Settings — Data Management', () => {
  test.setTimeout(60_000);

  test('T11.11.1 — Data section loads with description', async ({ page }) => {
    await createIdentity(page, 'DataDescUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Data');

    // Should see section description
    await expect(
      page.getByText(/Manage your locally stored data/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.11.2 — Local storage info card with DID', async ({ page }) => {
    await createIdentity(page, 'DataStorageUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Data');

    // Should see Local Storage heading
    await expect(
      page.getByText('Local Storage').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see description about IndexedDB
    await expect(
      page.getByText(/IndexedDB/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.11.5–T11.11.6 — Danger Zone has Clear Messages button', async ({ page }) => {
    await createIdentity(page, 'DataClearMsgUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Data');

    // Navigate to Danger Zone within Data section
    // (some settings sections have their own Danger Zone)
    const dangerZone = page.getByText('Danger Zone').first();
    if (await dangerZone.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dangerZone.click();
      await page.waitForTimeout(500);
    }

    // Should see Clear Messages button
    await expect(
      page.getByText('Clear Messages').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see description
    await expect(
      page.getByText(/Delete all messages, reactions, pins/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.11.8 — Clear All Data button visible', async ({ page }) => {
    await createIdentity(page, 'DataClearAllUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Data');

    const dangerZone = page.getByText('Danger Zone').first();
    if (await dangerZone.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dangerZone.click();
      await page.waitForTimeout(500);
    }

    // Should see Clear All Data button
    await expect(
      page.getByText('Clear All Data').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see description
    await expect(
      page.getByText(/Delete everything: messages, friends, groups/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.11.6b — Clear Messages shows confirmation dialog', async ({ page }) => {
    await createIdentity(page, 'DataConfirmUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Data');

    const dangerZone = page.getByText('Danger Zone').first();
    if (await dangerZone.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dangerZone.click();
      await page.waitForTimeout(500);
    }

    // Click the Clear Messages button (the clickable button, not the heading text).
    // The button has warning styling and is inside a Button component.
    // Use role=button to distinguish from the heading text.
    const clearBtn = page.getByRole('button', { name: /Clear Messages/i }).first();
    if (await clearBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await clearBtn.click();
    } else {
      // Fallback: click the second "Clear Messages" text (button text, not heading)
      const clearTexts = page.getByText('Clear Messages');
      const count = await clearTexts.count();
      if (count > 1) {
        await clearTexts.nth(1).click();
      } else {
        await clearTexts.first().click();
      }
    }
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Should show confirmation dialog with "Clear Messages?" title
    await expect(
      page.getByText('Clear Messages?').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
