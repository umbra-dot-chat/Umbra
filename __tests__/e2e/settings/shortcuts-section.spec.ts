/**
 * 11.13 Settings — Keyboard Shortcuts Section E2E Tests
 *
 * Tests the keyboard shortcuts display.
 *
 * Test IDs: T11.13.1–T11.13.4
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
} from '../helpers';

test.describe('11.13 Settings — Shortcuts', () => {
  test.setTimeout(60_000);

  test('T11.13.1 — Shortcuts section displays heading and description', async ({
    page,
  }) => {
    await createIdentity(page, 'ShortcutUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Shortcuts');

    // Should see title
    await expect(
      page.getByText('Keyboard Shortcuts').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see description
    await expect(
      page.getByText(/Shortcuts registered by plugins and the app/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
