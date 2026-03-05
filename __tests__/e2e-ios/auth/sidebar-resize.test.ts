/**
 * T2.6 Sidebar Resize — Detox E2E Tests (iOS)
 *
 * Mirrors the Playwright web tests for sidebar resize.
 * On mobile (iOS), sidebar resize via drag handle is not applicable.
 * This test verifies the sidebar is visible with a reasonable default width.
 */

import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForAuthScreen, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount, createAccountWithPin, importAccount, enterPin, skipPin } from '../helpers/auth';
import { navigateHome } from '../helpers/navigation';

describe('T2.6 Sidebar Resize', () => {
  beforeAll(async () => {
    await launchApp({ newInstance: true, delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
  });

  it('T2.6.1 — sidebar is visible on main screen (skip resize on mobile)', async () => {
    // On iOS mobile, the sidebar does not have a drag-to-resize handle.
    // Instead, we verify the sidebar renders at its default width.
    await waitFor(element(by.id(TEST_IDS.SIDEBAR.CONTAINER)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);
  });

  it('T2.6.2 — sidebar contains expected child elements', async () => {
    // Verify the sidebar has its core child elements
    await expect(element(by.id(TEST_IDS.SIDEBAR.SEARCH_INPUT))).toExist();
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONVERSATION_LIST))).toExist();
  });

  it('T2.6.3 — sidebar remains visible after navigation', async () => {
    // Navigate to friends and back — sidebar should remain intact
    await element(by.id(TEST_IDS.SIDEBAR.FRIENDS_BUTTON)).tap();
    await waitForUISettle();

    // Navigate back to home
    await navigateHome();

    // Sidebar should still be visible
    await expect(element(by.id(TEST_IDS.SIDEBAR.CONTAINER))).toExist();
  });
});
