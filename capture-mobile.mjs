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

// Find UmbraService via React fiber tree
const FIND_SERVICE = `
  (() => {
    const rootEl = document.getElementById('root');
    const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    const q = [rootEl[fiberKey]]; let it = 0; let svc = null;
    while (q.length > 0 && it < 5000) { const c = q.shift(); it++; const p = c?.memoizedProps || {}; if (p.value?.service?.getIdentity) { svc = p.value.service; break; } if (c?.child) q.push(c.child); if (c?.sibling) q.push(c.sibling); }
    return svc;
  })()
`;

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
      let communityId = null;
      try {
        const comm = await svc.createCommunity('Umbra Dev', 'Official development community');
        communityId = comm.communityId;
      } catch(e) {}
      const myDid = (await svc.getIdentity()).did;
      return { convId: gr.conversationId, groupId: gr.groupId, members, myDid, communityId };
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

// Navigate to a conversation by calling setActiveId via React fiber
async function navigateToConversation(page, convId) {
  return await page.evaluate((convId) => {
    const rootEl = document.getElementById('root');
    const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
    const q = [rootEl[fiberKey]]; let it = 0;
    while (q.length > 0 && it < 10000) {
      const c = q.shift(); it++;
      const p = c?.memoizedProps || {};
      // Look for ActiveConversationContext value with setActiveId
      if (p.value?.setActiveId && typeof p.value.setActiveId === 'function') {
        p.value.setActiveId(convId);
        return 'setActiveId called with ' + convId;
      }
      if (c?.child) q.push(c.child);
      if (c?.sibling) q.push(c.sibling);
    }
    return 'setActiveId not found after ' + it + ' iterations';
  }, convId);
}

async function cleanUI(page) {
  await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    // Hide banner
    for (const div of document.querySelectorAll('div')) {
      if (div.textContent?.includes('Update Now') && div.textContent?.includes('Release Notes') && div.childElementCount < 15) {
        const rect = div.getBoundingClientRect();
        if (rect.height < 60 && rect.top < 30) { div.style.display = 'none'; break; }
      }
    }
    // Hide decrypt errors
    for (const el of all) {
      if (el.textContent === '[Unable to decrypt message]' && el.childElementCount === 0) {
        let p = el;
        for (let i = 0; i < 15; i++) { p = p.parentElement; if (!p) break; const s = p.parentElement?.children; if (s && s.length > 3) { p.style.display = 'none'; break; } }
      }
    }
    // Hide "New" divider
    for (const el of all) {
      if (el.textContent?.trim() === 'New' && el.childElementCount < 3) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100) el.style.display = 'none';
      }
    }
    // Fix header "Group" -> "Engineering Team"
    for (const el of all) {
      if (el.childElementCount === 0 && el.textContent === 'Group') {
        el.textContent = 'Engineering Team';
      }
    }
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ===== MOBILE SCREENSHOT =====
  console.log('=== Mobile Screenshot ===');
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.addInitScript(() => { localStorage.setItem('theme', 'dark'); localStorage.setItem('umbra-theme', 'dark'); });
  await mobilePage.emulateMedia({ colorScheme: 'dark' });
  await mobilePage.goto(UMBRA_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.waitForTimeout(3000);

  const mText = await mobilePage.textContent('body');
  if (mText.includes('Create Account')) {
    console.log('Creating account...');
    await createAccount(mobilePage);
    console.log('Account created');
  }

  const setup = await setupData(mobilePage);
  console.log('Data setup done:', setup.convId);
  await mobilePage.waitForTimeout(500);

  // Dispatch messages first
  await dispatchMessages(mobilePage, setup);
  await mobilePage.waitForTimeout(500);

  // Navigate to the conversation using setActiveId
  const navResult = await navigateToConversation(mobilePage, setup.convId);
  console.log('Navigation:', navResult);
  await mobilePage.waitForTimeout(2000);

  // Re-dispatch messages after navigation (in case state was reset)
  await dispatchMessages(mobilePage, setup);
  await mobilePage.waitForTimeout(500);

  // Check if we can see the chat now
  const pageState = await mobilePage.evaluate(() => {
    const body = document.body.textContent;
    return {
      hasMessages: body.includes('v2.0 builds') || body.includes('Linux packages'),
      hasTypeMessage: body.includes('Type a message') || body.includes('Message'),
      hasSidebar: body.includes('CONVERSATIONS'),
    };
  });
  console.log('Page state:', pageState);

  // If still on sidebar, try clicking the conversation entry directly with mouse
  if (!pageState.hasMessages) {
    console.log('Still on sidebar, trying mouse click...');
    // Find the conversation entry coordinates
    const coords = await mobilePage.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        const text = el.textContent?.trim();
        if ((text?.includes('Engineering Team') || text?.includes('Group')) && el.childElementCount < 8) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 40 && rect.height < 120 && rect.top > 80) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.textContent.substring(0, 40) };
          }
        }
      }
      // Fallback: click the first conversation entry in the list
      for (const el of document.querySelectorAll('[role="button"], button')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 50 && rect.height < 120 && rect.top > 100 && rect.top < 300) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.textContent.substring(0, 40) };
        }
      }
      return null;
    });
    console.log('Click target:', coords);
    if (coords) {
      await mobilePage.mouse.click(coords.x, coords.y);
      await mobilePage.waitForTimeout(2000);
      await dispatchMessages(mobilePage, setup);
      await mobilePage.waitForTimeout(500);
    }
  }

  await cleanUI(mobilePage);

  // Scroll chat to bottom
  await mobilePage.evaluate(() => {
    for (const div of document.querySelectorAll('div')) {
      if (div.scrollHeight > div.clientHeight + 20 && div.clientHeight > 200) {
        div.scrollTop = div.scrollHeight; break;
      }
    }
  });
  await mobilePage.waitForTimeout(300);

  await mobilePage.screenshot({ path: `${OUTPUT_DIR}/mobile-group-chat.png`, type: 'png' });
  console.log('Mobile screenshot saved');
  await mobileCtx.close();

  // ===== COMMUNITY SCREENSHOT =====
  console.log('=== Community Screenshot ===');
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const dPage = await desktopCtx.newPage();
  await dPage.addInitScript(() => { localStorage.setItem('theme', 'dark'); localStorage.setItem('umbra-theme', 'dark'); });
  await dPage.emulateMedia({ colorScheme: 'dark' });
  await dPage.goto(UMBRA_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await dPage.waitForTimeout(3000);

  const dText = await dPage.textContent('body');
  if (dText.includes('Create Account')) {
    await createAccount(dPage);
  }

  const dSetup = await setupData(dPage);
  await dPage.waitForTimeout(500);

  // Navigate to community via URL hash/path
  if (dSetup.communityId) {
    console.log('Navigating to community:', dSetup.communityId);
    // Try direct URL navigation
    await dPage.goto(`${UMBRA_URL}/community/${dSetup.communityId}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await dPage.waitForTimeout(2000);

    // Check if we're on the community page
    const commState = await dPage.evaluate(() => document.body.textContent.substring(0, 200));
    console.log('Community page check:', commState.substring(0, 100));

    // If that didn't work, try hash-based routing
    if (!commState.includes('Umbra Dev') && !commState.includes('general') && !commState.includes('welcome')) {
      console.log('Trying hash-based routing...');
      await dPage.goto(`${UMBRA_URL}/#/community/${dSetup.communityId}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await dPage.waitForTimeout(2000);
    }
  }

  // Seed community messages via dispatchMessageEvent on the community channels
  if (dSetup.communityId) {
    await dPage.evaluate((communityId) => {
      const rootEl = document.getElementById('root');
      const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$'));
      const q = [rootEl[fiberKey]]; let it = 0; let svc = null;
      while (q.length > 0 && it < 5000) { const c = q.shift(); it++; const p = c?.memoizedProps || {}; if (p.value?.service?.getIdentity) { svc = p.value.service; break; } if (c?.child) q.push(c.child); if (c?.sibling) q.push(c.sibling); }
      if (!svc) return;
      // Try to dispatch community messages
      const now = Date.now();
      const msgs = [
        'Welcome to the Umbra Dev community!',
        'Feel free to ask questions in #general',
        'New release v2.0 coming soon',
        'Check out the dev-chat channel for technical discussions',
      ];
      for (let i = 0; i < msgs.length; i++) {
        try {
          svc.dispatchMessageEvent({
            type: 'communityMessageReceived',
            message: { id: 'comm-' + i + '-' + now, communityId, channelId: 'general', senderDid: 'did:key:z6MkSystem', content: { type: 'text', text: msgs[i] }, timestamp: now - ((msgs.length - i) * 60000) },
          });
        } catch(e) {}
      }
    }, dSetup.communityId);
    await dPage.waitForTimeout(500);
  }

  // Inject mock community messages into the DOM for the screenshot
  await dPage.evaluate(() => {
    // Find the "No messages yet" text and its container
    const all = document.querySelectorAll('*');
    let chatContainer = null;
    for (const el of all) {
      if (el.textContent?.trim() === 'No messages yet' && el.childElementCount === 0) {
        // Walk up to find the scrollable chat container
        let p = el.parentElement;
        for (let i = 0; i < 10; i++) {
          if (p && p.clientHeight > 300) { chatContainer = p; break; }
          p = p?.parentElement;
        }
        if (chatContainer) { el.style.display = 'none'; break; }
      }
    }
    if (!chatContainer) return;

    const messages = [
      { name: 'Alice', color: '#22C55E', text: 'Welcome everyone to the Umbra Dev community!', time: '10:15 AM' },
      { name: 'Bob', color: '#3B82F6', text: 'Thanks for setting this up. The E2E encryption on communities is impressive', time: '10:18 AM' },
      { name: 'Alice', color: '#22C55E', text: 'Right? Full end-to-end encryption even for community channels', time: '10:20 AM' },
      { name: 'Charlie', color: '#F59E0B', text: 'Just tested file sharing in here too — works great', time: '10:25 AM' },
      { name: 'User', color: '#8B5CF6', text: 'Awesome. Let us use #dev-chat for technical discussions and keep this channel for general updates', time: '10:30 AM' },
      { name: 'Bob', color: '#3B82F6', text: 'Sounds good. Anyone tried the voice channels yet?', time: '10:32 AM' },
      { name: 'Charlie', color: '#F59E0B', text: 'Not yet but I saw them in the sidebar. Looking forward to it!', time: '10:35 AM' },
    ];

    // Create a messages container
    const msgsDiv = document.createElement('div');
    msgsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding: 16px 20px; width: 100%;';

    for (const msg of messages) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 12px; align-items: flex-start;';

      const avatar = document.createElement('div');
      avatar.style.cssText = `width: 36px; height: 36px; border-radius: 50%; background: ${msg.color}33; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: ${msg.color}; flex-shrink: 0;`;
      avatar.textContent = msg.name[0];

      const content = document.createElement('div');
      content.style.cssText = 'flex: 1;';

      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px;';

      const nameEl = document.createElement('span');
      nameEl.style.cssText = `font-size: 14px; font-weight: 600; color: ${msg.color};`;
      nameEl.textContent = msg.name;

      const timeEl = document.createElement('span');
      timeEl.style.cssText = 'font-size: 11px; color: #6B7280;';
      timeEl.textContent = msg.time;

      header.appendChild(nameEl);
      header.appendChild(timeEl);

      const textEl = document.createElement('div');
      textEl.style.cssText = 'font-size: 14px; color: #E5E7EB; line-height: 1.4;';
      textEl.textContent = msg.text;

      content.appendChild(header);
      content.appendChild(textEl);

      row.appendChild(avatar);
      row.appendChild(content);
      msgsDiv.appendChild(row);
    }

    // Insert at the top of the chat container
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.justifyContent = 'flex-end';
    chatContainer.insertBefore(msgsDiv, chatContainer.firstChild);
  });
  await dPage.waitForTimeout(500);

  await cleanUI(dPage);
  await dPage.screenshot({ path: `${OUTPUT_DIR}/desktop-community.png`, type: 'png' });
  console.log('Community screenshot saved');

  await browser.close();
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
