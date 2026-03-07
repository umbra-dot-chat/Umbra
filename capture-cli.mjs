import { chromium } from 'playwright';

const OUTPUT_DIR = '/Users/infamousvague/Development/UmbraMarketing/site/public/screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 720, height: 540 }, colorScheme: 'dark' });
  const page = await context.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0D1117;
          font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #C9D1D9;
          -webkit-font-smoothing: antialiased;
        }
        .terminal {
          width: 720px;
          height: 540px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .titlebar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #161B22;
          border-bottom: 1px solid #21262D;
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot.red { background: #FF5F57; }
        .dot.yellow { background: #FEBC2E; }
        .dot.green { background: #28C840; }
        .title {
          flex: 1;
          text-align: center;
          font-size: 12px;
          color: #484F58;
          font-weight: 400;
        }
        .content {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          line-height: 1.7;
        }
        .header { color: #8B5CF6; }
        .prompt { color: #484F58; }
        .self-name { color: #22C55E; font-weight: 600; }
        .them-name { color: #58A6FF; font-weight: 600; }
        .them-name.alice { color: #22C55E; }
        .them-name.bob { color: #58A6FF; }
        .them-name.charlie { color: #F59E0B; }
        .msg { color: #C9D1D9; padding-left: 4px; }
        .msg-self { color: #E6EDF3; padding-left: 4px; }
        .time { color: #484F58; font-size: 11px; }
        .gap { height: 8px; }
        .input-box { color: #30363D; margin-top: auto; }
        .cursor { color: #58A6FF; animation: blink 1s infinite; }
        @keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
        .status-bar {
          display: flex;
          gap: 16px;
          padding: 8px 20px;
          background: #161B22;
          border-top: 1px solid #21262D;
          font-size: 11px;
          color: #484F58;
        }
        .status-item { display: flex; align-items: center; gap: 4px; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #28C840; }
        .status-lock { color: #22C55E; }
        .divider { border: none; border-top: 1px solid #21262D; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="terminal">
        <div class="titlebar">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
          <span class="title">umbra &mdash; Engineering Team</span>
        </div>
        <div class="content">
          <div class="header" style="background:#161B22; padding:8px 12px; border-radius:6px; border:1px solid #30363D; margin-bottom:4px;">
            <span style="color:#8B5CF6; font-weight:600;">Umbra CLI v2.0.0</span><span style="color:#30363D"> &nbsp;│&nbsp; </span>Identity: <span style="color:#E6EDF3">shadow_fox</span><span style="color:#30363D"> &nbsp;│&nbsp; </span>Group: <span style="color:#E6EDF3">Engineering Team</span><span style="color:#30363D"> &nbsp;│&nbsp; </span>Peers: <span style="color:#28C840">4 online</span><span style="color:#30363D"> &nbsp;│&nbsp; </span><span class="status-lock">E2E ✓</span>
          </div>
          <div class="gap"></div>
          <div><span class="them-name alice">Alice</span> <span class="time">12:29 AM</span></div>
          <div class="msg">  Just finished testing the Linux packages. All passing!</div>
          <div class="gap"></div>
          <div><span class="them-name bob">Bob</span> <span class="time">12:30 AM</span></div>
          <div class="msg">  Nice! I tested macOS ARM64 — smooth as butter</div>
          <div class="gap"></div>
          <div><span class="self-name">You</span> <span class="time">12:31 AM</span></div>
          <div class="msg-self">  Should we cut the release this week?</div>
          <div class="gap"></div>
          <div><span class="them-name charlie">Charlie</span> <span class="time">12:32 AM</span></div>
          <div class="msg">  I think we are ready. CLI is solid too</div>
          <div class="gap"></div>
          <div><span class="them-name alice">Alice</span> <span class="time">12:33 AM</span></div>
          <div class="msg">  Agreed. Final review tomorrow and ship it</div>
          <div class="gap"></div>
          <div><span class="self-name">You</span> <span class="time">12:35 AM</span></div>
          <div class="msg-self">  Perfect. I will prep the release notes tonight</div>
          <div class="gap"></div>
          <hr class="divider">
          <div style="background:#161B22; padding:8px 12px; border-radius:6px; border:1px solid #30363D; margin-top:8px; display:flex; align-items:center; gap:8px;">
            <span style="color:#484F58">›</span>
            <span class="cursor">▋</span>
          </div>
        </div>
        <div class="status-bar">
          <div class="status-item"><div class="status-dot"></div> Connected</div>
          <div class="status-item">🔒 End-to-end encrypted</div>
          <div class="status-item">4 members online</div>
          <div class="status-item" style="margin-left:auto">↑ Send · /help · Ctrl+C Exit</div>
        </div>
      </div>
    </body>
    </html>
  `);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUTPUT_DIR}/cli-group-chat.png`, type: 'png' });
  console.log('CLI screenshot saved');

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
