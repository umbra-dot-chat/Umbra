/**
 * 11.7 Settings — Sounds Section E2E Tests
 *
 * Tests sound settings: master toggle, sound theme dropdown,
 * master volume slider, per-category controls.
 *
 * Test IDs: T11.7.1–T11.7.12
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.7 Settings — Sounds', () => {
  test.setTimeout(90_000);

  test('T11.7.1 — Enable Sounds master toggle visible', async ({ page }) => {
    await createIdentity(page, 'SndToggleUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Sounds');

    // Should see section description
    await expect(
      page.getByText('Choose a sound theme and control which sounds play').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see Enable Sounds label
    await expect(
      page.getByText('Enable Sounds').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.7.2 — Sound Theme dropdown visible when sounds enabled', async ({
    page,
  }) => {
    await createIdentity(page, 'SndThemeUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Sounds');

    // Should see Sound Theme label
    await expect(
      page.getByText('Sound Theme').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see "Choose the style of sounds" description
    await expect(
      page.getByText('Choose the style of sounds').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.7.3 — Master Volume slider visible', async ({ page }) => {
    await createIdentity(page, 'SndVolUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Sounds');

    // Should see Master Volume label
    await expect(
      page.getByText('Master Volume').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.7.4–T11.7.9 — Sound categories displayed', async ({ page }) => {
    await createIdentity(page, 'SndCatUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Sounds');

    // Should see "Sound Categories" heading
    await expect(
      page.getByText('Sound Categories').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Category labels should be visible (plural form from CATEGORY_LABELS)
    const categories = ['Messages', 'Calls', 'Navigation', 'Social', 'System'];
    for (const cat of categories) {
      await expect(page.getByText(cat, { exact: true }).first()).toBeVisible({
        timeout: 5_000,
      });
    }

    // Category descriptions should be visible
    const descriptions = [
      'Sending, receiving, and deleting messages',
      'Joining, leaving, muting, and ringing',
      'Tab switches, dialog open/close',
      'Friend requests, accepts, notifications',
      'Toggles, errors, success confirmations',
    ];
    for (const desc of descriptions) {
      await expect(page.getByText(desc).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
