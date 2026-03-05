/**
 * Navigation helpers for Detox E2E tests.
 *
 * On iOS phones, several views in the layout are clipped by their parent
 * bounds (e.g. the NavigationRail's settings button at the bottom of the
 * screen, or sidebar elements). Detox's `.tap()` uses a 100% visibility
 * threshold, so we use `performAccessibilityAction('activate')` for
 * elements that are clipped but still interactive.
 */
import { element, by, waitFor } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { waitForUISettle } from './app';

/**
 * Activate an element via its accessibility action, bypassing Detox's
 * pixel-based visibility check. Used for elements clipped by parent bounds.
 */
async function activateElement(testID: string) {
  await element(by.id(testID)).performAccessibilityAction('activate');
}

/**
 * Navigate to the Friends page via the sidebar friends button.
 */
export async function navigateToFriends() {
  await activateElement(TEST_IDS.SIDEBAR.FRIENDS_BUTTON);
  await waitFor(element(by.id(TEST_IDS.FRIENDS.PAGE)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Navigate to Settings by tapping the settings rail item.
 * The settings button is at the bottom of the nav rail and may be
 * clipped by parent bounds, so we use performAccessibilityAction.
 */
export async function navigateToSettings() {
  await activateElement(TEST_IDS.NAV.SETTINGS);
  await waitFor(element(by.id(TEST_IDS.SETTINGS.DIALOG)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Navigate to Files by tapping the files rail item.
 */
export async function navigateToFiles() {
  await activateElement(TEST_IDS.NAV.FILES);
  await waitForUISettle();
}

/**
 * Navigate to Home by tapping the home rail item.
 */
export async function navigateHome() {
  await activateElement(TEST_IDS.NAV.HOME);
  await waitForUISettle();
}

/**
 * Open a specific conversation by tapping it in the sidebar.
 * @param name - Display name or partial text to match in the conversation list.
 */
export async function openConversation(name: string) {
  await waitFor(element(by.text(name)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
  await element(by.text(name)).tap();
  await waitFor(element(by.id(TEST_IDS.CHAT.HEADER)))
    .toExist()
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
  // Settings nav items are clipped on mobile — use performAccessibilityAction
  // instead of .tap() which requires 100% visibility.
  await activateElement(navTestId);
  await waitFor(element(by.id(sectionTestId)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Close settings dialog.
 * The close button may be clipped on mobile, so use performAccessibilityAction.
 */
export async function closeSettings() {
  await activateElement(TEST_IDS.SETTINGS.CLOSE_BUTTON);
  await waitForUISettle();
}

/**
 * Tap a settings nav item by its testID.
 * Settings nav items are clipped on mobile, so use performAccessibilityAction.
 */
export async function tapSettingsNavItem(testID: string) {
  await activateElement(testID);
  await waitForUISettle();
}

/**
 * Navigate to the Plugin Marketplace.
 */
export async function navigateToMarketplace() {
  await element(by.id(TEST_IDS.SIDEBAR.MARKETPLACE_BUTTON)).tap();
  await waitFor(element(by.id(TEST_IDS.PLUGINS.MARKETPLACE)))
    .toExist()
    .withTimeout(TIMEOUTS.NAVIGATION);
}

/**
 * Tap the back button in the chat header (mobile layout).
 */
export async function goBackFromChat() {
  await element(by.id(TEST_IDS.CHAT.HEADER_BACK)).tap();
  await waitForUISettle();
}
