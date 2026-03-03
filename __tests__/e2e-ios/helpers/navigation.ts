/**
 * Navigation helpers for Detox E2E tests.
 */
import { element, by, waitFor } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForUISettle } from './app';

/**
 * Navigate to the Friends page via the sidebar friends button.
 */
export async function navigateToFriends() {
  await element(by.id(TEST_IDS.SIDEBAR.FRIENDS_BUTTON)).tap();
  await waitFor(element(by.id(TEST_IDS.FRIENDS.PAGE)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Navigate to Settings by tapping the settings rail item.
 */
export async function navigateToSettings() {
  await element(by.id(TEST_IDS.NAV.SETTINGS)).tap();
  await waitFor(element(by.id(TEST_IDS.SETTINGS.DIALOG)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Navigate to Files by tapping the files rail item.
 */
export async function navigateToFiles() {
  await element(by.id(TEST_IDS.NAV.FILES)).tap();
  await waitForUISettle();
}

/**
 * Navigate to Home by tapping the home rail item.
 */
export async function navigateHome() {
  await element(by.id(TEST_IDS.NAV.HOME)).tap();
  await waitForUISettle();
}

/**
 * Open a specific conversation by tapping it in the sidebar.
 * @param name - Display name or partial text to match in the conversation list.
 */
export async function openConversation(name: string) {
  await waitFor(element(by.text(name)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.text(name)).tap();
  await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Navigate to a specific settings section.
 */
export async function navigateToSettingsSection(
  navTestId: string,
  sectionTestId: string,
) {
  await navigateToSettings();
  await element(by.id(navTestId)).tap();
  await waitFor(element(by.id(sectionTestId)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Close settings dialog.
 */
export async function closeSettings() {
  await element(by.id(TEST_IDS.SETTINGS.CLOSE_BUTTON)).tap();
  await waitForUISettle();
}

/**
 * Navigate to the Plugin Marketplace.
 */
export async function navigateToMarketplace() {
  await element(by.id(TEST_IDS.SIDEBAR.MARKETPLACE_BUTTON)).tap();
  await waitFor(element(by.id(TEST_IDS.PLUGINS.MARKETPLACE)))
    .toBeVisible()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Tap the back button in the chat header (mobile layout).
 */
export async function goBackFromChat() {
  await element(by.id(TEST_IDS.CHAT.HEADER_BACK)).tap();
  await waitForUISettle();
}
