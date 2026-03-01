/**
 * 11.17 Settings — Identity Card PDF E2E Tests
 *
 * Tests the identity card PDF generation feature: the button in
 * Settings > Account, the dialog preview, recovery phrase toggle,
 * and PDF download.
 *
 * Test IDs: T-ICP.1–T-ICP.3
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  UI_SETTLE_TIMEOUT,
  createIdentity,
} from '../helpers';

test.describe('Identity Card PDF', () => {

  test('T-ICP.1: Settings Account section shows Identity Card button', async ({ page }) => {
    await createIdentity(page, 'CardUser');

    // Open settings
    await page.click('[data-testid="settings-button"], button:has-text("Settings")');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Navigate to Account section
    await page.click('text=Account');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Look for the Identity Card button
    const cardButton = page.locator('text=Identity Card');
    await expect(cardButton).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });
  });

  test('T-ICP.2: Clicking Identity Card opens dialog with preview', async ({ page }) => {
    await createIdentity(page, 'PreviewUser');

    // Open settings
    await page.click('[data-testid="settings-button"], button:has-text("Settings")');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Navigate to Account section
    await page.click('text=Account');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Click the Identity Card button
    await page.click('text=Identity Card');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Dialog should be visible with title
    const dialogTitle = page.locator('text=Identity Card').first();
    await expect(dialogTitle).toBeVisible();

    // Should have Download PDF button
    const downloadBtn = page.locator('text=Download PDF');
    await expect(downloadBtn).toBeVisible();

    // Should have recovery phrase toggle
    const phraseToggle = page.locator('text=Include Recovery Phrase');
    await expect(phraseToggle).toBeVisible();
  });

  test('T-ICP.3: Recovery phrase toggle shows warning when enabled', async ({ page }) => {
    await createIdentity(page, 'ToggleUser');

    // Open settings > Account > Identity Card dialog
    await page.click('[data-testid="settings-button"], button:has-text("Settings")');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
    await page.click('text=Account');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);
    await page.click('text=Identity Card');
    await page.waitForTimeout(UI_SETTLE_TIMEOUT);

    // Toggle should initially be off — safe text visible
    await expect(page.locator('text=No sensitive data is included')).toBeVisible();

    // Enable the recovery phrase toggle
    const toggle = page.locator('[role="switch"]').last();
    await toggle.click();
    await page.waitForTimeout(500);

    // Warning text should appear
    await expect(page.locator('text=Anyone with this card can access your account')).toBeVisible();
  });
});
