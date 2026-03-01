/**
 * Visual demo of the file sharing flow.
 * Captures screenshots at each step and saves them.
 */
import { chromium } from '@playwright/test';
import {
  setupFriendPair,
  navigateToDM,
} from './groups/group-helpers';
import { UI_SETTLE_TIMEOUT } from './helpers';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'test-results', 'demo-screenshots');

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Step 1: Set up two users and make them friends
    console.log('📸 Step 1: Creating two users (Alice & Bob) and establishing friendship...');
    const setup = await setupFriendPair(browser, 'Demo');

    // Screenshot: Friends page showing friendship established
    await setup.alice.screenshot({ path: path.join(SCREENSHOT_DIR, '01-friends-established.png') });
    console.log('   ✅ Saved: 01-friends-established.png');

    // Step 2: Navigate Alice to DM with Bob
    console.log('📸 Step 2: Alice opens DM conversation with Bob...');
    await navigateToDM(setup.alice, 'BobDemo');
    await setup.alice.waitForTimeout(UI_SETTLE_TIMEOUT);
    await setup.alice.screenshot({ path: path.join(SCREENSHOT_DIR, '02-dm-open-with-input.png') });
    console.log('   ✅ Saved: 02-dm-open-with-input.png');

    // Step 3: Send a text message first
    console.log('📸 Step 3: Sending a text message first...');
    await setup.alice.evaluate(() => {
      const textarea = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
      if (!textarea) throw new Error('no textarea');
      const fiberKey = Object.keys(textarea).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      if (!fiberKey) throw new Error('no fiber');
      let fiber = (textarea as any)[fiberKey];
      for (let i = 0; i < 15; i++) {
        if (!fiber) break;
        const props = fiber.memoizedProps || fiber.pendingProps || {};
        if (typeof props.onChangeText === 'function') {
          props.onChangeText('Hey Bob! About to send you a file 📎');
          return;
        }
        fiber = fiber.return;
      }
      throw new Error('onChangeText not found');
    });
    await setup.alice.waitForTimeout(500);

    // Find and click send button
    const sendBtn = setup.alice.locator('[aria-label="Send message"]').first();
    await sendBtn.click().catch(async () => {
      // Fallback: try submitting via onSubmitEditing
      await setup.alice.evaluate(() => {
        const textarea = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
        if (!textarea) return;
        const fiberKey = Object.keys(textarea).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (!fiberKey) return;
        let fiber = (textarea as any)[fiberKey];
        for (let i = 0; i < 15; i++) {
          if (!fiber) break;
          const props = fiber.memoizedProps || fiber.pendingProps || {};
          if (typeof props.onSubmitEditing === 'function') {
            props.onSubmitEditing({ nativeEvent: { text: '' } });
            return;
          }
          fiber = fiber.return;
        }
      });
    });
    await setup.alice.waitForTimeout(2000);
    await setup.alice.screenshot({ path: path.join(SCREENSHOT_DIR, '03-text-message-sent.png') });
    console.log('   ✅ Saved: 03-text-message-sent.png');

    // Step 4: Click the attachment button
    console.log('📸 Step 4: Clicking the attachment button (paperclip icon)...');
    const fileChooserPromise = setup.alice.waitForEvent('filechooser', { timeout: 10_000 });

    const attachBtn = setup.alice.locator('[aria-label="Attach file"], [aria-label="Attach"]').first();
    const btnVisible = await attachBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (btnVisible) {
      await attachBtn.click();
    } else {
      await setup.alice.evaluate(() => {
        const paths = document.querySelectorAll('path');
        for (const p of paths) {
          const d = p.getAttribute('d') || '';
          if (d.includes('M21.44') || d.includes('m21.44')) {
            let el: Element | null = p;
            while (el && el.getAttribute?.('role') !== 'button') {
              el = el.parentElement;
            }
            if (el) {
              (el as HTMLElement).click();
              return;
            }
            (p.closest('svg')?.parentElement as HTMLElement)?.click();
            return;
          }
        }
        throw new Error('Attachment button not found');
      });
    }

    // Step 5: Set a test file via the file chooser
    console.log('📸 Step 5: Selecting a file to send (project-notes.txt)...');
    const fileChooser = await fileChooserPromise;
    const fileContent = `Project Notes - February 28, 2026
==============================
Meeting agenda:
1. Review file sharing feature
2. Test attachment flow
3. Verify E2E tests pass

Status: All 546 Jest tests passing ✅
        All 6 DM E2E tests passing ✅
        All 4 Group E2E tests passing ✅
`;
    const buffer = Buffer.from(fileContent, 'utf-8');
    await fileChooser.setFiles({
      name: 'project-notes.txt',
      mimeType: 'text/plain',
      buffer,
    });
    await setup.alice.waitForTimeout(3000);

    // Screenshot: File message card in chat
    await setup.alice.screenshot({ path: path.join(SCREENSHOT_DIR, '04-file-sent-card-visible.png') });
    console.log('   ✅ Saved: 04-file-sent-card-visible.png');

    // Step 6: Check Bob receives the file (if relay cooperates)
    console.log('📸 Step 6: Checking Bob receives the file...');
    await navigateToDM(setup.bob, 'AliceDemo');
    await setup.bob.waitForTimeout(8000); // Wait for relay

    await setup.bob.screenshot({ path: path.join(SCREENSHOT_DIR, '05-bob-receives-file.png') });
    console.log('   ✅ Saved: 05-bob-receives-file.png');

    console.log('\n🎉 Demo complete! All screenshots saved to test-results/demo-screenshots/');

    await setup.ctx1.close();
    await setup.ctx2.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
