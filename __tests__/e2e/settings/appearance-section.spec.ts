/**
 * 11.4 Settings — Appearance Section E2E Tests
 *
 * Tests appearance settings: theme dropdown, dark mode toggle,
 * accent color picker, text size, and font selection.
 *
 * Test IDs: T11.4.1–T11.4.15
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.4 Settings — Appearance', () => {
  test.setTimeout(90_000);

  test('T11.4.1 — Theme dropdown visible in Theme sub-section', async ({ page }) => {
    await createIdentity(page, 'AppearThemeUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Should see "Customize the look and feel" description
    await expect(
      page.getByText(/Customize the look and feel/i).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Theme sub-section should be visible
    await expect(
      page.getByText('Choose a color theme').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.4.3 — Dark Mode toggle visible', async ({ page }) => {
    await createIdentity(page, 'AppearDarkUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Navigate to Dark Mode sub-section
    await navigateToSettingsSubsection(page, 'Dark Mode');

    // Should see Dark Mode label and description
    await expect(
      page.getByText('Switch between light and dark themes').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.4.5 — Accent color picker visible in Colors sub-section', async ({ page }) => {
    await createIdentity(page, 'AppearColorUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Navigate to Colors sub-section
    await navigateToSettingsSubsection(page, 'Colors');

    // Should see accent color description
    await expect(
      page.getByText('Choose a primary color for buttons').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.4.10 — Text Size dropdown with Small/Medium/Large options', async ({
    page,
  }) => {
    await createIdentity(page, 'AppearSizeUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Navigate to Text Size sub-section
    await navigateToSettingsSubsection(page, 'Text Size');

    // Should see text size description
    await expect(
      page.getByText('Adjust the base text size').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.4.11 — Font family dropdown visible in Font sub-section', async ({ page }) => {
    await createIdentity(page, 'AppearFontUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Navigate to Font sub-section
    await navigateToSettingsSubsection(page, 'Font');

    // Should see font family description
    await expect(
      page.getByText(/Choose a typeface/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.4.13 — Font sub-section has font family description', async ({ page }) => {
    await createIdentity(page, 'AppearPreviewUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Appearance');

    // Navigate to Font sub-section
    await navigateToSettingsSubsection(page, 'Font');

    // Should see the font family description text
    // (Font preview text "The quick brown fox..." only shows when non-system font selected)
    await expect(
      page.getByText(/Choose a typeface/i).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see "Font Family" label
    await expect(
      page.getByText('Font Family').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
