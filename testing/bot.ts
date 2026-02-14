#!/usr/bin/env npx tsx
/**
 * Umbra Test Bot — CLI entry point.
 *
 * Usage:
 *   npx tsx bot.ts                          # Single bot, auto-accept, no periodic messages
 *   npx tsx bot.ts --name Alice             # Named bot
 *   npx tsx bot.ts --add did:key:z6Mk...   # Send friend request on startup
 *   npx tsx bot.ts --interval 5000          # Send random message every 5s
 *   npx tsx bot.ts --echo                   # Echo received messages back
 *   npx tsx bot.ts --bots 3 --interval 8000 # Swarm: 3 bots that befriend each other
 *   npx tsx bot.ts --bots 3 --group "Test"  # Swarm + create a group with all bots
 */

import { TestBot } from './test-bot.js';

// ─────────────────────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--echo') {
      opts.echo = true;
    } else if (arg === '--no-auto-accept') {
      opts.noAutoAccept = true;
    } else if (arg === '--no-auto-call') {
      opts.noAutoCall = true;
    } else if (arg === '--debug') {
      opts.debug = true;
    } else if (arg.startsWith('--') && i + 1 < args.length) {
      opts[arg.slice(2)] = args[++i];
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
\x1b[1mUmbra Test Bot\x1b[0m — End-to-end testing companion

\x1b[4mUsage:\x1b[0m
  npx tsx bot.ts [options]

\x1b[4mOptions:\x1b[0m
  --name <name>         Bot display name (default: "TestBot")
  --relay <url>         Relay WebSocket URL (default: wss://relay.deepspaceshipping.co/ws)
  --add <did>           Send friend request to this DID on startup
  --interval <ms>       Send random messages every N ms (default: 0 = off)
  --echo                Echo received messages back to sender
  --no-auto-accept      Don't auto-accept incoming friend requests
  --debug               Enable debug logging
  --bots <n>            Swarm mode: launch N bots that befriend each other
  --group <name>        Create a group with all bots/friends (used with --bots)
  --call <did>          Start a 4K video call to this DID on startup
  --voice <did>         Start a voice call to this DID on startup
  --no-auto-call        Don't auto-accept incoming calls
  --help, -h            Show this help

\x1b[4mExamples:\x1b[0m
  \x1b[90m# Single bot that auto-accepts friends and echoes messages\x1b[0m
  npx tsx bot.ts --echo

  \x1b[90m# Bot that adds your app and sends messages every 10s\x1b[0m
  npx tsx bot.ts --name "Spammer" --add did:key:z6MkYourDid... --interval 10000

  \x1b[90m# 3 bots that befriend each other and chat in a group\x1b[0m
  npx tsx bot.ts --bots 3 --group "Test Group" --interval 15000

  \x1b[90m# Bot that calls a friend with 4K video after connecting\x1b[0m
  npx tsx bot.ts --add did:key:z6Mk... --call did:key:z6Mk...

\x1b[4mInteractive Commands (type while running):\x1b[0m
  send <did> <message>  Send a message to a friend
  broadcast <message>   Send message to all friends
  add <did>             Send friend request
  call <did>            Start 4K video call to a friend
  voice <did>           Start voice call to a friend
  hangup                End the current call
  callstatus            Show current call info
  friends               List friends
  pending               List pending requests
  group <name>          Create group with all friends
  status                Show bot status
  quit                  Stop bot and exit
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Single bot mode
// ─────────────────────────────────────────────────────────────────────────────

async function runSingleBot(opts: Record<string, string | boolean>) {
  const bot = new TestBot({
    name: (opts.name as string) || 'TestBot',
    relayUrl: (opts.relay as string) || undefined,
    autoAcceptFriends: !opts.noAutoAccept,
    autoAcceptCalls: !opts.noAutoCall,
    messageIntervalMs: opts.interval ? parseInt(opts.interval as string, 10) : 0,
    echoMessages: !!opts.echo,
    logLevel: opts.debug ? 'debug' : 'info',
  });

  console.log(`\n\x1b[1m╔══════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[1m║          Umbra Test Bot                          ║\x1b[0m`);
  console.log(`\x1b[1m╚══════════════════════════════════════════════════╝\x1b[0m\n`);
  console.log(`  Name:  ${bot.identity.displayName}`);
  console.log(`  DID:   \x1b[33m${bot.identity.did}\x1b[0m`);
  console.log(`  Relay: ${bot.config.relayUrl}`);
  console.log(`  Calls: ${bot.config.autoAcceptCalls ? 'auto-accept' : 'manual'}\n`);

  await bot.start();

  // Send initial friend request if --add was provided
  if (opts.add) {
    bot.sendFriendRequest(opts.add as string);
  }

  // Start call after a delay (wait for friendship to establish)
  if (opts.call || opts.voice) {
    const callDid = (opts.call || opts.voice) as string;
    const callType = opts.call ? 'video' : 'voice';
    console.log(`\x1b[36mWill start ${callType} call to ${callDid.slice(0, 30)}... after friendship establishes\x1b[0m\n`);

    // Poll until the target is a friend, then call
    const callTimer = setInterval(async () => {
      if (bot.friendList.some((f) => f.did === callDid)) {
        clearInterval(callTimer);
        await sleep(1000); // Short grace period
        await bot.startCall(callDid, callType as 'video' | 'voice');
      }
    }, 2000);

    // Give up after 60s
    setTimeout(() => clearInterval(callTimer), 60_000);
  }

  // Interactive CLI
  setupInteractiveInput(bot);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    bot.stop();
    process.exit(0);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Swarm mode — multiple bots that befriend each other
// ─────────────────────────────────────────────────────────────────────────────

async function runSwarm(count: number, opts: Record<string, string | boolean>) {
  const names = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'];
  const bots: TestBot[] = [];

  console.log(`\n\x1b[1m╔══════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[1m║          Umbra Bot Swarm (${count} bots)${' '.repeat(Math.max(0, 18 - String(count).length))}║\x1b[0m`);
  console.log(`\x1b[1m╚══════════════════════════════════════════════════╝\x1b[0m\n`);

  // Create and start all bots
  for (let i = 0; i < count; i++) {
    const bot = new TestBot({
      name: names[i] || `Bot-${i + 1}`,
      relayUrl: (opts.relay as string) || undefined,
      autoAcceptFriends: true,
      messageIntervalMs: opts.interval ? parseInt(opts.interval as string, 10) : 0,
      echoMessages: false,
      logLevel: opts.debug ? 'debug' : 'info',
    });

    console.log(`  ${bot.identity.displayName}: \x1b[33m${bot.identity.did}\x1b[0m`);
    bots.push(bot);
  }

  console.log('');

  // Start all bots
  for (const bot of bots) {
    await bot.start();
  }

  // Have each bot send friend requests to all others
  console.log('\x1b[36mSending friend requests between all bots...\x1b[0m\n');
  for (let i = 0; i < bots.length; i++) {
    for (let j = i + 1; j < bots.length; j++) {
      bots[i].sendFriendRequest(bots[j].identity.did);
      // Small delay to avoid race conditions
      await sleep(500);
    }
  }

  // Wait for all friendships to establish
  await sleep(3000);

  // Create group if requested
  if (opts.group) {
    console.log(`\n\x1b[36mCreating group "${opts.group}"...\x1b[0m\n`);
    bots[0].createGroupAndInviteAll(opts.group as string);
  }

  // If --add was provided, have all bots befriend that DID
  if (opts.add) {
    console.log(`\n\x1b[36mAll bots sending friend request to ${(opts.add as string).slice(0, 30)}...\x1b[0m\n`);
    for (const bot of bots) {
      bot.sendFriendRequest(opts.add as string);
      await sleep(300);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down swarm...');
    for (const bot of bots) bot.stop();
    process.exit(0);
  });

  // Keep alive
  console.log('\x1b[90mSwarm running. Press Ctrl+C to stop.\x1b[0m\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive input
// ─────────────────────────────────────────────────────────────────────────────

async function setupInteractiveInput(bot: TestBot) {
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.on('line', (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const [cmd, ...rest] = trimmed.split(' ');

    switch (cmd) {
      case 'send': {
        const did = rest[0];
        const msg = rest.slice(1).join(' ');
        if (!did || !msg) {
          console.log('Usage: send <did> <message>');
        } else {
          bot.sendMessage(did, msg);
        }
        break;
      }
      case 'broadcast': {
        const msg = rest.join(' ');
        if (!msg) {
          console.log('Usage: broadcast <message>');
        } else {
          bot.broadcastMessage(msg);
        }
        break;
      }
      case 'add': {
        const did = rest[0];
        if (!did) {
          console.log('Usage: add <did>');
        } else {
          bot.sendFriendRequest(did);
        }
        break;
      }
      case 'friends': {
        const friends = bot.friendList;
        if (friends.length === 0) {
          console.log('No friends yet.');
        } else {
          console.log(`\n  Friends (${friends.length}):`);
          for (const f of friends) {
            console.log(`    ${f.displayName} — ${f.did.slice(0, 30)}...`);
          }
          console.log('');
        }
        break;
      }
      case 'pending': {
        const pending = bot.pendingRequestList;
        if (pending.length === 0) {
          console.log('No pending requests.');
        } else {
          console.log(`\n  Pending requests (${pending.length}):`);
          for (const p of pending) {
            console.log(`    [${p.direction}] ${p.fromDisplayName} — ${p.fromDid.slice(0, 30)}...`);
          }
          console.log('');
        }
        break;
      }
      case 'call': {
        const did = rest[0];
        if (!did) {
          console.log('Usage: call <did>');
        } else {
          bot.startCall(did, 'video');
        }
        break;
      }
      case 'voice': {
        const did = rest[0];
        if (!did) {
          console.log('Usage: voice <did>');
        } else {
          bot.startCall(did, 'voice');
        }
        break;
      }
      case 'hangup': {
        bot.endCall();
        break;
      }
      case 'callstatus': {
        const call = bot.currentCall;
        if (!call) {
          console.log('No active call.');
        } else {
          const duration = call.connectedAt
            ? `${Math.floor((Date.now() - call.connectedAt) / 1000)}s`
            : 'not connected';
          console.log(`\n  Active Call:`);
          console.log(`    ID:       ${call.callId.slice(0, 16)}...`);
          console.log(`    Remote:   ${call.remoteDisplayName} (${call.remoteDid.slice(0, 30)}...)`);
          console.log(`    Type:     ${call.callType}`);
          console.log(`    Dir:      ${call.direction}`);
          console.log(`    Status:   ${call.status}`);
          console.log(`    Duration: ${duration}\n`);
        }
        break;
      }
      case 'group': {
        const name = rest.join(' ') || 'Test Group';
        bot.createGroupAndInviteAll(name);
        break;
      }
      case 'status': {
        console.log(`\n  Bot: ${bot.identity.displayName}`);
        console.log(`  DID: ${bot.identity.did}`);
        console.log(`  Friends: ${bot.friendCount}`);
        console.log(`  Pending: ${bot.pendingRequestList.length}`);
        console.log(`  Running: ${bot.isRunning}\n`);
        break;
      }
      case 'quit':
      case 'exit': {
        bot.stop();
        process.exit(0);
      }
      default:
        console.log(`Unknown command: ${cmd}. Type 'status' for info or 'quit' to exit.`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const opts = parseArgs();

  if (opts.bots) {
    const count = parseInt(opts.bots as string, 10);
    if (isNaN(count) || count < 2) {
      console.error('--bots requires a number >= 2');
      process.exit(1);
    }
    await runSwarm(count, opts);
  } else {
    await runSingleBot(opts);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
