/**
 * 11.9 Settings — Audio & Video Section E2E Tests
 *
 * Tests audio/video settings: calling options, video quality dropdown,
 * audio quality dropdown, and device selection.
 *
 * Test IDs: T11.9.1–T11.9.29
 */

import { test, expect } from '@playwright/test';
import {
  createIdentity,
  navigateToSettings,
  navigateToSettingsSection,
  navigateToSettingsSubsection,
} from '../helpers';

test.describe('11.9 Settings — Audio & Video', () => {
  test.setTimeout(90_000);

  test('T11.9.1 — Audio & Video section loads', async ({ page }) => {
    await createIdentity(page, 'AVDescUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Audio & Video');

    // Should see section description
    await expect(
      page.getByText('Configure your camera, microphone, and call quality settings').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.9.5 — Video quality dropdown options', async ({ page }) => {
    await createIdentity(page, 'AVVideoUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Audio & Video');

    // Navigate to Video sub-section
    await navigateToSettingsSubsection(page, 'Video');

    // Should see Video Quality related content
    // Look for quality labels or dropdown
    const hasVideoQuality = await page
      .getByText(/Video Quality|720p|1080p/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasVideoQuality).toBeTruthy();
  });

  test('T11.9.12 — Audio quality dropdown options', async ({ page }) => {
    await createIdentity(page, 'AVAudioUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Audio & Video');

    // Navigate to Audio sub-section
    await navigateToSettingsSubsection(page, 'Audio');

    // Should see Audio Quality related content
    const hasAudioQuality = await page
      .getByText(/Audio Quality|Voice.*VoIP|Opus/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasAudioQuality).toBeTruthy();
  });

  test('T11.9.26 — Noise Suppression toggle visible', async ({ page }) => {
    await createIdentity(page, 'AVNoiseUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Audio & Video');

    // Navigate to Devices or Audio sub-section
    await navigateToSettingsSubsection(page, 'Devices');

    // Should see noise suppression toggle
    await expect(
      page.getByText('Noise Suppression').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T11.9.27 — Echo Cancellation toggle visible', async ({ page }) => {
    await createIdentity(page, 'AVEchoUser');
    await navigateToSettings(page);
    await navigateToSettingsSection(page, 'Audio & Video');

    await navigateToSettingsSubsection(page, 'Devices');

    // Should see echo cancellation toggle
    await expect(
      page.getByText('Echo Cancellation').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
