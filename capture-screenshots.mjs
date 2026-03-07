import { chromium } from 'playwright';

const UMBRA_URL = 'http://127.0.0.1:8083';
const OUTPUT_DIR = '/Users/infamousvague/Development/UmbraMarketing/site/public/screenshots';

async function createAccount(page) {
  await page.click('button[aria-label="Create new account"]');
  await page.waitForTimeout(1000);
  await page.fill('input', 'User');
  await page.waitForTimeout(300);
  await page.click('button[aria-label="Continue to next step"]');
  await page.waitForTimeout(2000);
  await page.click('button[aria-label="Continue after seed phrase"]');
  await page.waitForTimeout(1000);
  await page.click('[aria-label="Confirm backup checkbox"]');
  await page.waitForTimeout(300);
  await page.click('button[aria-label="Continue after backup confirmation"]');
  await page.waitForTimeout(1000);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('*'))
        if (el.textContent.trim() === 'Skip for now' && el.offsetParent !== null) { el.click(); break; }
    });
    await page.waitForTimeout(1000);
  }
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button'))
      if (btn.textContent.includes('Get Started')) { btn.click(); break; }
  });
  await page.waitForTimeout(3000);
}

async function setupData(page) {
  return await page.evaluate(`
    (async () => {
      const rootEl = document.getElementById('root');
      const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
      const q = [rootEl[fiberKey]]; let it = 0; let svc = null;
      while (q.length > 0 && it < 5000) { const c = q.shift(); it++; const p = c?.memoizedProps || {}; if (p.value?.service?.getIdentity) { svc = p.value.service; break; } if (c?.child) q.push(c.child); if (c?.sibling) q.push(c.sibling); }
      if (!svc) throw new Error('no service');
      function hexKey(seed) { let h = ''; for (let i = 0; i < 64; i++) h += ((seed + i * 7) % 16).toString(16); return h; }
      const ts = Date.now();
      const gr = await svc.createGroup('Engineering Team', 'v2.0 release planning');
      await svc.updateGroup(gr.groupId, 'Engineering Team', 'v2.0 release planning');
      const members = [
        { did: 'did:key:z6MkAlice' + ts, name: 'Alice', seed: 1 },
        { did: 'did:key:z6MkBob' + ts, name: 'Bob', seed: 2 },
        { did: 'did:key:z6MkCharlie' + ts, name: 'Charlie', seed: 3 },
      ];
      for (const m of members) {
        await svc.addGroupMember(gr.groupId, m.did, m.name);
        await svc.processAcceptedFriendResponse({ fromDid: m.did, fromDisplayName: m.name, fromSigningKey: hexKey(m.seed), fromEncryptionKey: hexKey(m.seed + 10) });
      }
      // Create community
      const comm = await svc.createCommunity('Umbra Dev', 'Official development community');
      const myDid = (await svc.getIdentity()).did;
      return { convId: gr.conversationId, groupId: gr.groupId, members, myDid, communityId: comm.communityId, spaceId: comm.spaceId };
    })()
  `);
}

async function dispatchMessages(page, { convId, myDid, members }) {
  await page.evaluate(({ convId, myDid, members }) => {
    const rootEl = document.getElementById('root');
    const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    const q = [rootEl[fiberKey]]; let it = 0; let svc = null;
    while (q.length > 0 && it < 5000) { const c = q.shift(); it++; const p = c?.memoizedProps || {}; if (p.value?.service?.getIdentity) { svc = p.value.service; break; } if (c?.child) q.push(c.child); if (c?.sibling) q.push(c.sibling); }
    const allMsgs = [
      { did: myDid, text: 'Hey team! The v2.0 builds are looking great' },
      { did: members[0].did, text: 'Just finished testing the Linux packages. All passing!' },
      { did: members[1].did, text: 'Nice! I tested macOS ARM64 — smooth as butter' },
      { did: myDid, text: 'Should we cut the release this week?' },
      { did: members[2].did, text: 'I think we are ready. CLI is solid too' },
      { did: members[0].did, text: 'Agreed. Final review tomorrow and ship it' },
      { did: myDid, text: 'Perfect. I will prep the release notes tonight' },
      { did: members[1].did, text: 'I can handle the Windows build signing' },
      { did: members[2].did, text: 'And I will update the download page!' },
    ];
    const now = Date.now();
    for (let i = 0; i < allMsgs.length; i++) {
      svc.dispatchMessageEvent({
        type: 'messageReceived',
        message: { id: 'seed-' + i + '-' + now, conversationId: convId, senderDid: allMsgs[i].did, content: { type: 'text', text: allMsgs[i].text }, timestamp: now - ((allMsgs.length - i) * 90000), read: true, delivered: true, status: 'delivered' },
      });
    }
  }, { convId, myDid, members });
}

async function cleanUI(page) {
  await page.evaluate(() => {
    // Hide update banner
    for (const div of document.querySelectorAll('div')) {
      if (div.textContent?.includes('Update Now') && div.textContent?.includes('Release Notes') && div.childElementCount < 15) {
        const rect = div.getBoundingClientRect();
        if (rect.height < 60 && rect.top < 30) { div.style.display = 'none'; break; }
      }
    }
    // Hide "[Unable to decrypt message]" and their parent message containers
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.textContent === '[Unable to decrypt message]' && el.childElementCount === 0) {
        let p = el;
        for (let i = 0; i < 15; i++) {
          p = p.parentElement;
          if (!p) break;
          const siblings = p.parentElement?.children;
          if (siblings && siblings.length > 3) { p.style.display = 'none'; break; }
        }
      }
    }
    // Hide "New" divider
    for (const el of all) {
      if (el.textContent?.trim() === 'New' && el.childElementCount < 3) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 200) el.style.display = 'none';
      }
    }
    // Fix "Group" header text to "Engineering Team"
    for (const el of all) {
      if (el.childElementCount === 0 && el.textContent === 'Group') {
        const rect = el.getBoundingClientRect();
        if (rect.top < 60 && rect.left > 300) {
          el.textContent = 'Engineering Team';
        }
      }
    }
    // Fix sidebar "Group" text
    for (const el of all) {
      if (el.childElementCount === 0 && el.textContent === 'Group') {
        const rect = el.getBoundingClientRect();
        if (rect.left < 350 && rect.top > 150 && rect.top < 300) {
          el.textContent = 'Engineering Team';
        }
      }
    }
  });
}

async function scrollChatBottom(page) {
  await page.evaluate(() => {
    for (const div of document.querySelectorAll('div')) {
      if (div.scrollHeight > div.clientHeight + 20 && div.clientHeight > 200 && div.clientHeight < 800) {
        div.scrollTop = div.scrollHeight; break;
      }
    }
  });
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('umbra-theme', 'dark');
  });
  await page.goto(UMBRA_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.emulateMedia({ colorScheme: 'dark' });

  const text = await page.textContent('body');
  if (text.includes('Create Account')) {
    console.log('Creating account...');
    await createAccount(page);
    console.log('Account created');
  }

  console.log('Setting up data...');
  const setup = await setupData(page);
  console.log('Setup done');
  await page.waitForTimeout(500);

  // Dispatch messages
  await dispatchMessages(page, setup);
  await page.waitForTimeout(500);
  await cleanUI(page);
  await scrollChatBottom(page);
  await page.waitForTimeout(300);

  // === DESKTOP ===
  console.log('Desktop screenshot...');
  await page.screenshot({ path: `${OUTPUT_DIR}/desktop-group-chat.png`, type: 'png' });

  // === MOBILE ===
  console.log('Mobile screenshot...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  // Click Engineering Team in sidebar
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.textContent?.includes('Engineering Team') && el.childElementCount < 8) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 80 && rect.height > 30 && rect.height < 100 && rect.top > 100 && rect.left < 400) {
          el.click(); return;
        }
      }
    }
  });
  await page.waitForTimeout(1000);
  await dispatchMessages(page, setup);
  await page.waitForTimeout(500);
  await cleanUI(page);
  await scrollChatBottom(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT_DIR}/mobile-group-chat.png`, type: 'png' });

  // === COMMUNITY ===
  console.log('Community screenshot...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1000);
  // Click the second sidebar icon (communities/folder icon)
  // Using coordinates since it's an image element
  await page.mouse.click(32, 84);
  await page.waitForTimeout(1500);
  await cleanUI(page);
  await page.screenshot({ path: `${OUTPUT_DIR}/desktop-community.png`, type: 'png' });

  await browser.close();
  console.log('All screenshots captured!');
}

captureScreenshots().catch(e => { console.error('Error:', e); process.exit(1); });
