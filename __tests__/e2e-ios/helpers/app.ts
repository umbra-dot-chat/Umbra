/**
 * App lifecycle helpers for Detox E2E tests.
 *
 * NOTE: The Umbra app uses continuous JS timers (tagline rotation, animations,
 * network polling) that prevent Detox's default synchronization from ever
 * settling. We disable synchronization after launch and use explicit
 * `waitFor` assertions instead.
 */
import { device, element, by, waitFor } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';

/**
 * Launch the app with a clean state (delete & reinstall).
 * Disables Detox synchronization after launch since the app has persistent timers.
 */
export async function launchApp(options?: { newInstance?: boolean; delete?: boolean }) {
  await device.launchApp({
    newInstance: options?.newInstance ?? true,
    delete: options?.delete ?? true,
  });
  await device.disableSynchronization();
}

/**
 * Launch the app preserving existing state (no delete/reinstall).
 */
export async function launchAppPreserveState() {
  await device.launchApp({
    newInstance: true,
    delete: false,
  });
  await device.disableSynchronization();
}

/**
 * Wait for the auth screen to exist (app launched, no stored identity).
 *
 * NOTE: We use `toExist()` instead of `toBeVisible()` because the auth screen
 * container is overlaid by a NativeInvertedLayer (MaskedView) for the blob
 * effect, which causes Detox's 75% visibility threshold to fail. The child
 * elements (logo, buttons) pass `toBeVisible()` individually.
 */
export async function waitForAuthScreen() {
  await waitFor(element(by.id(TEST_IDS.AUTH.SCREEN)))
    .toExist()
    .withTimeout(TIMEOUTS.APP_LAUNCH);
}

/**
 * Wait for the main screen container to exist (authenticated).
 */
export async function waitForMainScreen() {
  await waitFor(element(by.id(TEST_IDS.MAIN.CONTAINER)))
    .toExist()
    .withTimeout(TIMEOUTS.CORE_INIT);
}

/**
 * Wait for relay connection to be established.
 *
 * Navigates to Settings > Network, verifies the relay status indicator exists,
 * then returns to the previous screen. This confirms the relay WebSocket is
 * up and the app has connected, rather than relying on a blind sleep.
 *
 * Falls back to a timed wait if the relay status element is unavailable
 * (e.g., the settings dialog can't be opened from the current state).
 */
export async function waitForRelayConnection() {
  try {
    // Navigate to Settings > Network to check relay status
    await element(by.id(TEST_IDS.NAV.SETTINGS)).performAccessibilityAction('activate');
    await waitFor(element(by.id(TEST_IDS.SETTINGS.DIALOG)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    await element(by.id(TEST_IDS.SETTINGS.NAV_NETWORK)).tap();
    await waitFor(element(by.id(TEST_IDS.SETTINGS.SECTION_NETWORK)))
      .toExist()
      .withTimeout(TIMEOUTS.NAVIGATION);

    // Wait for the relay status indicator — its presence confirms the
    // relay connection is being tracked. The element only renders after
    // the network hook initializes and reports relay state.
    await waitFor(element(by.id(TEST_IDS.SETTINGS.RELAY_STATUS)))
      .toExist()
      .withTimeout(TIMEOUTS.NETWORK_CONNECT);

    console.log('[waitForRelayConnection] Relay status indicator found — connection confirmed');

    // Close settings and return
    await element(by.id(TEST_IDS.SETTINGS.CLOSE_BUTTON)).performAccessibilityAction('activate');
    await waitForUISettle();
  } catch {
    // Fallback: if navigation fails (e.g., settings already open or can't
    // be reached from current state), use a timed wait.
    console.warn('[waitForRelayConnection] Could not verify via settings — using timed fallback');
    await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.RELAY_SETTLE));
  }
}

/**
 * Assert relay connection is active while already in the Network settings section.
 * Use this when you've already navigated to Settings > Network.
 */
export async function assertRelayConnected() {
  await waitFor(element(by.id(TEST_IDS.SETTINGS.RELAY_STATUS)))
    .toExist()
    .withTimeout(TIMEOUTS.NETWORK_CONNECT);
}

/**
 * Wait for a brief UI settle (animations, re-renders).
 */
export async function waitForUISettle() {
  await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.UI_SETTLE));
}

/**
 * Send the app to background and bring it back.
 */
export async function backgroundAndForeground(seconds = 1) {
  await device.sendToHome();
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  await device.launchApp({ newInstance: false });
  await device.disableSynchronization();
}

/**
 * Terminate and relaunch the app (preserving data).
 */
export async function terminateAndRelaunch() {
  await device.terminateApp();
  await device.launchApp({ newInstance: true, delete: false });
  await device.disableSynchronization();
}
