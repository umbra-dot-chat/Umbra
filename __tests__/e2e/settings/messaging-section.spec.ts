/**
 * 11.5 Settings — Messaging Section E2E Tests
 *
 * Tests messaging settings: display mode selector (Bubble vs Inline),
 * live preview cards.
 *
 * Test IDs: T11.5.1–T11.5.5
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

test.describe('11.5 Settings — Messaging', () => {
  test.setTimeout(60_000);

  test('T11.5.1 — Display Style sub-section visible', async ({ page }) => {
    await createIdentity(page, 'MsgStyleUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Messaging');

    // Should see the section description
    await expect(
      page.getByText('Choose how messages are displayed').first(),
    ).toBeVisible({ timeout: 5_000 });

    // Should see "Display Style" label
    await expect(
      page.getByText('Display Style').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.5.2 — Bubble mode option visible', async ({ page }) => {
    await createIdentity(page, 'MsgBubbleUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Messaging');

    // Should see Bubble mode description/label
    await expect(
      page.getByText(/Bubble/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.5.3 — Inline mode option visible', async ({ page }) => {
    await createIdentity(page, 'MsgInlineUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Messaging');

    // Should see Inline mode description/label
    await expect(
      page.getByText(/Inline/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
