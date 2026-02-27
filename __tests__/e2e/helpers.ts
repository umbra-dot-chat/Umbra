/**
 * Shared E2E test utilities for Umbra Playwright tests.
 *
 * Provides reusable helpers for identity creation, navigation,
 * and common interaction patterns across all spec files.
 *
 * NOTE: React Native Web renders duplicate text DOM nodes (desktop + mobile).
 * All `getByText()` calls must use `.first()` to avoid strict mode violations.
 */

import { expect, type Page } from '@playwright/test';

// ─── Timeouts ────────────────────────────────────────────────────────────────

/** Time for WASM core to initialize + app to fully render. */
export const WASM_LOAD_TIMEOUT = 30_000;

/** Time for relay to deliver messages between two browser contexts. */
export const RELAY_SETTLE_TIMEOUT = 8_000;

/** Time for UI state updates to settle after an action. */
export const UI_SETTLE_TIMEOUT = 3_000;

// ─── App Readiness ───────────────────────────────────────────────────────────

/**
 * Wait for the app to fully load (WASM init + identity restore).
 * Returns 'auth' if the auth screen appeared, 'main' if the main app loaded.
 */
export async function waitForAppReady(page: Page): Promise<'auth' | 'main'> {
  await page.goto('/');

  const result = await Promise.race([
    page
      .getByRole('button', { name: 'Create New Account' })
      .waitFor({ timeout: WASM_LOAD_TIMEOUT })
      .then(() => 'auth' as const),
    page
      .getByText('Welcome to Umbra')
      .first()
      .waitFor({ timeout: WASM_LOAD_TIMEOUT })
      .then(() => 'main' as const),
  ]);

  return result;
}

// ─── Identity Creation ───────────────────────────────────────────────────────

export interface CreateIdentityOptions {
  /** If true, skip the PIN step (default: true). */
  skipPin?: boolean;
  /** If true, skip the username step (default: true). */
  skipUsername?: boolean;
  /** If provided, set this PIN instead of skipping. */
  pin?: string;
  /** If provided, claim this username instead of skipping. */
  username?: string;
  /** If true, check the "Remember me" checkbox (default: false). */
  rememberMe?: boolean;
}

/**
 * Create a fresh identity through the full account creation flow.
 *
 * Walks through all 6 steps (Display Name → Recovery Phrase → Confirm Backup
 * → Security PIN → Username → Complete) and returns the DID and seed phrase.
 */
export async function createIdentity(
  page: Page,
  name: string,
  options: CreateIdentityOptions = {},
): Promise<{ did: string; seedPhrase: string }> {
  const {
    skipPin = true,
    skipUsername = true,
    pin,
    username,
    rememberMe = false,
  } = options;

  // Navigate to auth screen
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Create New Account' }),
  ).toBeVisible({ timeout: WASM_LOAD_TIMEOUT });

  // Click Create New Account
  await page.getByRole('button', { name: 'Create New Account' }).click();

  // ── Step 0: Display Name ──
  await expect(page.getByText('Choose Your Name').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.getByPlaceholder('Enter your name').fill(name);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // ── Step 1: Recovery Phrase ──
  await expect(page.getByText('Your Recovery Phrase').first()).toBeVisible({
    timeout: WASM_LOAD_TIMEOUT,
  });

  // Extract the seed phrase words from the grid
  // Each word cell has a numbered label and the word text
  let seedPhrase = '';
  try {
    // Wait a moment for the grid to fully render
    await page.waitForTimeout(1_000);
    seedPhrase = await page.evaluate(() => {
      // The SeedPhraseGrid renders words in cells — look for all word elements
      const cells = document.querySelectorAll('[data-testid^="seed-word-"]');
      if (cells.length > 0) {
        return Array.from(cells)
          .map((el) => el.textContent?.trim() ?? '')
          .join(' ');
      }
      // Fallback: try to extract from the grid structure
      return '';
    });
  } catch {
    // Seed phrase extraction is best-effort
  }

  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // ── Step 2: Confirm Backup ──
  await expect(
    page.getByText('Confirm Your Backup').first(),
  ).toBeVisible({ timeout: 10_000 });
  await page
    .getByText('I have written down my recovery phrase and stored it securely')
    .first()
    .click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // ── Step 3: Security PIN ──
  await expect(
    page.getByText('Secure Your Account').first(),
  ).toBeVisible({ timeout: 10_000 });

  if (pin) {
    // Enter the PIN via the enterPin helper (hidden input workaround)
    await enterPin(page, pin);
    // Confirm PIN
    await expect(
      page.getByText('Confirm Your PIN').first(),
    ).toBeVisible({ timeout: 5_000 });
    await enterPin(page, pin);
    await page.waitForTimeout(1_000);
  } else if (skipPin) {
    await page.getByText('Skip for now').first().click();
  }

  // ── Step 4: Username ──
  // This step may or may not appear depending on PIN flow
  const usernameHeading = page.getByText('Choose a Username').first();
  const isUsernameVisible = await usernameHeading
    .isVisible({ timeout: 5_000 })
    .catch(() => false);

  if (isUsernameVisible) {
    if (username) {
      await page.getByPlaceholder('e.g., Matt').fill(username);
      await page.getByRole('button', { name: 'Claim Username' }).click();
      // Wait for registration and continue
      await page.waitForTimeout(3_000);
      const continueAfterUsername = page.getByRole('button', {
        name: 'Continue',
        exact: true,
      });
      if (
        await continueAfterUsername
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await continueAfterUsername.click();
      }
    } else if (skipUsername) {
      await page.getByText('Skip for now').first().click();
    }
  }

  // ── Step 5: Complete ──
  await expect(
    page.getByText('Account Created!').first(),
  ).toBeVisible({ timeout: 15_000 });

  // Extract DID from the summary card
  const didElement = page.locator('text=/did:key:/').first();
  const didText = await didElement
    .textContent({ timeout: 5_000 })
    .catch(() => '');
  const did = didText?.match(/did:key:\S+/)?.[0] ?? '';

  // Remember me checkbox
  if (rememberMe) {
    const rememberCheckbox = page
      .getByText('Remember me on this device')
      .first();
    if (
      await rememberCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)
    ) {
      await rememberCheckbox.click();
    }
  }

  // Click Get Started
  await page.getByRole('button', { name: 'Get Started' }).click();

  // Wait for main app to load
  await expect(
    page.getByText('Welcome to Umbra').first(),
  ).toBeVisible({
    timeout: WASM_LOAD_TIMEOUT,
  });

  // Let relay connection establish
  await page.waitForTimeout(UI_SETTLE_TIMEOUT);

  return { did, seedPhrase };
}

// ─── Navigation Helpers ──────────────────────────────────────────────────────

/** Navigate to the Friends page via the sidebar button. */
export async function navigateToFriends(page: Page): Promise<void> {
  await page.getByText('Friends').first().click();
  await page.waitForTimeout(1_000);
}

/** Click a tab on the Friends page. */
export async function clickTab(
  page: Page,
  tabName: string,
): Promise<void> {
  await page.getByText(tabName, { exact: true }).first().click();
  await page.waitForTimeout(500);
}

/** Open the Settings dialog. */
export async function navigateToSettings(page: Page): Promise<void> {
  // The settings gear icon is in the nav rail at the bottom.
  // It has no accessibilityLabel. We find the SVG via its unique path,
  // then click the parent Pressable (div[role="button"]) using evaluate.
  await page.evaluate(() => {
    const path = document.querySelector('path[d^="M12.22 2h"]');
    if (!path) throw new Error('Settings gear icon not found');
    // Walk up the DOM to find the role="button" ancestor (Pressable)
    let el: Element | null = path;
    while (el && el.getAttribute?.('role') !== 'button') {
      el = el.parentElement;
    }
    if (el) {
      (el as HTMLElement).click();
    } else {
      // Fall back to clicking the SVG's parent
      (path.closest('svg')?.parentElement as HTMLElement)?.click();
    }
  });
  await page.waitForTimeout(1_000);
}

/**
 * Navigate to a specific section within the Settings dialog.
 * The settings dialog has a sidebar with section names.
 */
export async function navigateToSettingsSection(
  page: Page,
  sectionName: string,
): Promise<void> {
  await page.getByText(sectionName, { exact: true }).first().click();
  await page.waitForTimeout(500);
}

/**
 * Navigate to a sub-section within a settings section.
 * Some sections (like Account) have subcategories (Identity, Sharing, Danger Zone).
 */
export async function navigateToSettingsSubsection(
  page: Page,
  subsectionName: string,
): Promise<void> {
  await page.getByText(subsectionName, { exact: true }).first().click();
  await page.waitForTimeout(500);
}

// ─── PIN Helpers ─────────────────────────────────────────────────────────────

/**
 * Enter a PIN into the GrowablePinInput component.
 *
 * The component uses a hidden text input (opacity:0, height:0, width:0)
 * behind visible PIN cell boxes. We need to click the visible area first
 * to focus the hidden input, then type via keyboard.
 */
export async function enterPin(page: Page, pin: string): Promise<void> {
  // The hidden input resolves but is not interactable via fill().
  // Click the PIN cell area to focus the hidden input, then type.
  const pinInput = page.locator('input[inputmode="numeric"]').first();

  // Focus the hidden input directly via JavaScript
  await pinInput.evaluate((el) => (el as HTMLInputElement).focus());
  await page.waitForTimeout(200);

  // Type each digit — this triggers onChangeText in the React component
  await page.keyboard.type(pin, { delay: 50 });
  await page.waitForTimeout(500);
}
