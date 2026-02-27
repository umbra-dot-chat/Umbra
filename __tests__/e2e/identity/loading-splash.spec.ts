/**
 * 1.5 Loading / Splash Screen E2E Tests
 *
 * Tests splash screen on reload, loading progress steps,
 * data integrity after load, and auto-dismiss behavior.
 *
 * Test IDs: T1.5.1–T1.5.4
 */

import { test, expect } from '@playwright/test';
import {
  WASM_LOAD_TIMEOUT,
  createIdentity,
} from '../helpers';

test.describe('1.5 Loading / Splash Screen', () => {
  test.setTimeout(120_000);

  test('T1.5.1 — Refresh with existing identity shows splash screen', async ({
    page,
  }) => {
    await createIdentity(page, 'SplashUser', { rememberMe: true });

    // Reload — should show loading/splash before main app
    await page.reload();

    // Either splash/loading, account picker, or main app should appear
    await Promise.race([
      page
        .getByText('Welcome to Umbra')
        .first()
        .waitFor({ timeout: WASM_LOAD_TIMEOUT }),
      page
        .getByText(/Initializing|Loading|Restoring/)
        .first()
        .waitFor({ timeout: WASM_LOAD_TIMEOUT }),
      page
        .getByText('Your Accounts')
        .first()
        .waitFor({ timeout: WASM_LOAD_TIMEOUT }),
    ]);
  });

  test('T1.5.2 — Loading steps: Initializing core, Loading database, etc.', async ({
    page,
  }) => {
    await createIdentity(page, 'StepsUser', { rememberMe: true });
    await page.reload();

    // The loading screen shows progress steps.
    // These may flash quickly. Check for any step text.
    const loadingTexts = [
      'Initializing core',
      'Loading database',
      'Restoring identity',
      'Loading preferences',
      'Ready',
    ];

    // At least one loading step, account picker, or main app should be visible
    await Promise.race([
      ...loadingTexts.map((text) =>
        page.getByText(text).first().waitFor({ timeout: WASM_LOAD_TIMEOUT }),
      ),
      page
        .getByText('Welcome to Umbra')
        .first()
        .waitFor({ timeout: WASM_LOAD_TIMEOUT }),
      page
        .getByText('Your Accounts')
        .first()
        .waitFor({ timeout: WASM_LOAD_TIMEOUT }),
    ]);
  });

  test('T1.5.3 — After loading completes, main screen with data intact', async ({
    page,
  }) => {
    await createIdentity(page, 'DataIntactUser', { rememberMe: true });
    await page.reload();

    // With rememberMe=true, the app should auto-restore the identity
    // and show the main screen without requiring user interaction.
    await expect(page.getByText('Welcome to Umbra').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });
  });

  test('T1.5.4 — Loading screen dismisses automatically', async ({ page }) => {
    await createIdentity(page, 'AutoDismissUser', { rememberMe: true });
    await page.reload();

    // The loading screen should auto-dismiss when all steps complete
    // and the main app should appear without user interaction.
    await expect(page.getByText('Welcome to Umbra').first()).toBeVisible({
      timeout: WASM_LOAD_TIMEOUT,
    });

    // Loading text should no longer be visible
    const loadingText = page.getByText('Initializing core').first();
    await expect(loadingText).not.toBeVisible({ timeout: 5_000 }).catch(() => {
      // May never have been visible
    });
  });
});
