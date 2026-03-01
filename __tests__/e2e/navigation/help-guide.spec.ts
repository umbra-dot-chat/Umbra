/**
 * 15. Help System / Guide E2E Tests
 *
 * Tests the Help/Guide dialog: access, sections, development badges,
 * search functionality, and content display.
 *
 * Test IDs: T15.0.1–T15.0.10
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  UI_SETTLE_TIMEOUT,
} from '../helpers';

/** Open the Guide dialog via the sidebar "Guide" button (accessibilityLabel="User Guide"). */
async function openGuide(page: import('@playwright/test').Page): Promise<void> {
  // The Guide button has accessibilityLabel="User Guide" and text "Guide"
  const guideByLabel = page.locator('[aria-label="User Guide"]').first();
  if (await guideByLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await guideByLabel.click();
  } else {
    // Fallback: click button containing "Guide" text
    await page.getByText('Guide', { exact: true }).first().click();
  }
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);
}

test.describe('15. Help System / Guide', () => {
  test.setTimeout(90_000);

  test('T15.0.1 — Guide dialog accessible from sidebar', async ({ page }) => {
    await createIdentity(page, 'HelpGuideUser');
    await openGuide(page);

    // Should see guide-related content — either "Umbra User Guide" or section titles
    await expect(
      page.getByText(/Umbra User Guide|Getting Started|End-to-end encrypted/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T15.0.2 — Guide shows multiple sections', async ({ page }) => {
    await createIdentity(page, 'HelpSectionsUser');
    await openGuide(page);

    // Should see section titles in the guide sidebar or content
    await expect(
      page.getByText('Getting Started').first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText('Friends').first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      page.getByText('Messaging').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T15.0.3 — Guide chapters have content and descriptions', async ({
    page,
  }) => {
    await createIdentity(page, 'HelpBadgesUser');
    await openGuide(page);

    // The GuideDialog renders chapters with content.
    // Click "Getting Started" to ensure its content loads
    const gettingStarted = page.getByText('Getting Started').first();
    if (await gettingStarted.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await gettingStarted.click();
      await page.waitForTimeout(1_000);
    }

    // Should see some guide content (sections have HOW TO USE steps or descriptions)
    const hasContent = await page
      .getByText(/how to|identity|encryption|decentralized/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('T15.0.6 — Version label visible', async ({ page }) => {
    await createIdentity(page, 'HelpVersionUser');
    await openGuide(page);

    // Should show version somewhere in the guide
    await expect(
      page.getByText(/Umbra v|v0\.|v1\./i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
