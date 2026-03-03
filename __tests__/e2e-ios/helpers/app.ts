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
 */
export async function waitForRelayConnection() {
  await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.RELAY_SETTLE));
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
