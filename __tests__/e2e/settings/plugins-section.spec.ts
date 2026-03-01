/**
 * 11.12 Settings — Plugins Section E2E Tests
 *
 * Tests plugin settings: marketplace button, empty state,
 * and plugin card display.
 *
 * Test IDs: T11.12.1–T11.12.8
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
} from '../helpers';

test.describe('11.12 Settings — Plugins', () => {
  test.setTimeout(90_000);

  test('T11.12.1 — Marketplace button visible', async ({ page }) => {
    await createIdentity(page, 'PluginMktUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Plugins');

    // Should see "Marketplace" button
    await expect(
      page.getByText('Marketplace', { exact: true }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.12.2 — Empty state when no plugins installed', async ({ page }) => {
    await createIdentity(page, 'PluginEmptyUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Plugins');

    // Fresh account should have no plugins — should see empty state
    await expect(
      page.getByText('No plugins installed').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see CTA text
    await expect(
      page.getByText(/Browse the marketplace/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
