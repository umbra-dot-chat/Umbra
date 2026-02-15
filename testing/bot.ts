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
 *   npx tsx bot.ts --scenario all           # Run all automated test scenarios
 *   npx tsx bot.ts --auto-react --auto-thread  # Auto-react and thread-reply
 */

import { TestBot } from './test-bot.js';
import { ScenarioRunner, getAllScenarios, getScenariosByTag, type RunnerOptions } from './scenarios.js';
import { ALL_SUITES } from './suites/index.js';

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
    } else if (arg === '--auto-react') {
      opts.autoReact = true;
    } else if (arg === '--auto-thread') {
      opts.autoThread = true;
    } else if (arg === '--debug') {
      opts.debug = true;
    } else if (arg === '--continue') {
      opts.continue = true;
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--quiet') {
      opts.quiet = true;
    } else if (arg === '--list-suites') {
      opts.listSuites = true;
    } else if (arg === '--list-scenarios') {
      opts.listScenarios = true;
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

\x1b[4mBot Options:\x1b[0m
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
  --auto-react          Auto-react to received messages with random emoji
  --auto-thread         Auto-reply in threads to received messages
  --test-audio <mode>   Call audio: sine, sweep, dtmf, silence (default: sine)

\x1b[4mTest Suite Options:\x1b[0m
  --suite <name|all>    Run a test suite (friends, messages, threads, reactions,
                        receipts, typing, groups, calls, stress, resilience, all)
  --scenario <name>     Run a single test scenario by name (use "list" or "all")
  --report json         Output JSON report instead of console
  --retry <n>           Retry failed scenarios n times (default: 0)
  --continue            Don't stop on first failure
  --verbose             Show debug logs from bots during scenarios
  --quiet               Only show failures
  --list-suites         List available suites with scenario counts
  --list-scenarios      List all scenarios across all suites
  --tags <tag>          Run only scenarios matching a tag (e.g., smoke, critical, bug)
  --help, -h            Show this help

\x1b[4mExamples:\x1b[0m
  \x1b[90m# Single bot that auto-accepts friends and echoes messages\x1b[0m
  npx tsx bot.ts --echo

  \x1b[90m# 3 bots that befriend each other and chat in a group\x1b[0m
  npx tsx bot.ts --bots 3 --group "Test Group" --interval 15000

  \x1b[90m# Bot that calls a friend with 4K video after connecting\x1b[0m
  npx tsx bot.ts --add did:key:z6Mk... --call did:key:z6Mk...

  \x1b[90m# Run the friends test suite\x1b[0m
  npx tsx bot.ts --suite friends

  \x1b[90m# Run all suites, don't stop on failure, retry flaky tests\x1b[0m
  npx tsx bot.ts --suite all --continue --retry 2

  \x1b[90m# CI mode: JSON report, exit code\x1b[0m
  npx tsx bot.ts --suite all --continue --report json

  \x1b[90m# Run only smoke tests\x1b[0m
  npx tsx bot.ts --tags smoke

  \x1b[90m# List suites and scenarios\x1b[0m
  npx tsx bot.ts --list-suites
  npx tsx bot.ts --list-scenarios

\x1b[4mInteractive Commands (type while running):\x1b[0m
  send <did> <message>     Send a message to a friend
  broadcast <message>      Send message to all friends
  thread <did> <text>      Reply in thread to last message from <did>
  react <did> <emoji>      React to last message from <did>
  unreact <did> <emoji>    Remove reaction from last message from <did>
  add <did>                Send friend request
  call <did>               Start 4K video call to a friend
  voice <did>              Start voice call to a friend
  hangup                   End the current call
  callstatus               Show current call info
  friends                  List friends
  pending                  List pending requests
  messages                 Show recent messages
  group <name>             Create group with all friends
  scenario <name>          Run a test scenario
  suite <name>             Run a test suite
  status                   Show bot status
  quit                     Stop bot and exit
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Single bot mode
// ─────────────────────────────────────────────────────────────────────────────

async function runSingleBot(opts: Record<string, string | boolean>) {
  const audioMode = (opts['test-audio'] as string) || 'sine';

  const bot = new TestBot({
    name: (opts.name as string) || 'TestBot',
    ...(opts.relay ? { relayUrl: opts.relay as string } : {}),
    autoAcceptFriends: !opts.noAutoAccept,
    autoAcceptCalls: !opts.noAutoCall,
    messageIntervalMs: opts.interval ? parseInt(opts.interval as string, 10) : 0,
    echoMessages: !!opts.echo,
    autoReact: !!opts.autoReact,
    autoThread: !!opts.autoThread,
    audioMode: audioMode as 'sine' | 'sweep' | 'dtmf' | 'silence',
    logLevel: opts.debug ? 'debug' : 'info',
  });

  console.log(`\n\x1b[1m╔══════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[1m║          Umbra Test Bot                          ║\x1b[0m`);
  console.log(`\x1b[1m╚══════════════════════════════════════════════════╝\x1b[0m\n`);
  console.log(`  Name:       ${bot.identity.displayName}`);
  console.log(`  DID:        \x1b[33m${bot.identity.did}\x1b[0m`);
  console.log(`  Relay:      ${bot.config.relayUrl}`);
  console.log(`  Calls:      ${bot.config.autoAcceptCalls ? 'auto-accept' : 'manual'}`);
  console.log(`  Audio:      ${audioMode}`);
  console.log(`  AutoReact:  ${bot.config.autoReact}`);
  console.log(`  AutoThread: ${bot.config.autoThread}\n`);

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
      ...(opts.relay ? { relayUrl: opts.relay as string } : {}),
      autoAcceptFriends: true,
      autoReact: !!opts.autoReact,
      autoThread: !!opts.autoThread,
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
// Scenario mode
// ─────────────────────────────────────────────────────────────────────────────

function buildRunnerOptions(opts: Record<string, string | boolean>): Partial<RunnerOptions> {
  const runnerOpts: Partial<RunnerOptions> = {};
  if (opts.continue) runnerOpts.continueOnError = true;
  if (opts.retry) runnerOpts.retryCount = parseInt(opts.retry as string, 10) || 0;
  if (opts.report === 'json') runnerOpts.outputFormat = 'json';
  if (opts.verbose) runnerOpts.verbosity = 'verbose';
  if (opts.quiet) runnerOpts.verbosity = 'quiet';
  return runnerOpts;
}

async function runScenario(scenarioName: string, opts: Record<string, string | boolean>) {
  const relayUrl = (opts.relay as string) || undefined;
  const allScenarios = getAllScenarios();

  if (scenarioName === 'list') {
    console.log(`\n\x1b[1mAvailable Test Scenarios (${allScenarios.length} total):\x1b[0m\n`);
    for (const s of allScenarios) {
      const tags = s.tags?.length ? ` \x1b[90m[${s.tags.join(', ')}]\x1b[0m` : '';
      console.log(`  \x1b[33m${s.name}\x1b[0m — ${s.description} (${s.botCount} bots, ${s.timeout / 1000}s)${tags}`);
    }
    console.log(`\n  \x1b[33mall\x1b[0m — Run all scenarios sequentially\n`);
    process.exit(0);
  }

  const runner = new ScenarioRunner(relayUrl, buildRunnerOptions(opts));

  if (scenarioName === 'all') {
    const results = await runner.runAll(allScenarios);
    const report = runner.generateReport(results);
    if (opts.report === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report);
    }
    const failed = results.filter((r) => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  }

  // Single scenario
  const scenario = allScenarios.find((s) => s.name === scenarioName);
  if (!scenario) {
    console.error(`Unknown scenario: "${scenarioName}". Use --scenario list to see available scenarios.`);
    process.exit(1);
  }

  const result = await runner.run(scenario);
  process.exit(result.passed ? 0 : 1);
}

async function runSuiteMode(suiteName: string, opts: Record<string, string | boolean>) {
  const relayUrl = (opts.relay as string) || undefined;
  const runner = new ScenarioRunner(relayUrl, buildRunnerOptions(opts));

  if (suiteName === 'all') {
    const allScenarios = getAllScenarios();
    console.log(`\n\x1b[1mRunning all ${allScenarios.length} scenarios across ${ALL_SUITES.size} suites\x1b[0m\n`);
    const results = await runner.runAll(allScenarios);
    const report = runner.generateReport(results);
    if (opts.report === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report);
    }
    const failed = results.filter((r) => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  }

  try {
    console.log(`\n\x1b[1mRunning suite: ${suiteName}\x1b[0m\n`);
    const results = await runner.runSuite(suiteName);
    const report = runner.generateReport(results);
    if (opts.report === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report);
    }
    const failed = results.filter((r) => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

async function runByTag(tag: string, opts: Record<string, string | boolean>) {
  const relayUrl = (opts.relay as string) || undefined;
  const runner = new ScenarioRunner(relayUrl, buildRunnerOptions(opts));
  const scenarios = getScenariosByTag(tag);

  if (scenarios.length === 0) {
    console.error(`No scenarios found with tag: "${tag}"`);
    process.exit(1);
  }

  console.log(`\n\x1b[1mRunning ${scenarios.length} scenarios with tag: ${tag}\x1b[0m\n`);
  const results = await runner.runAll(scenarios);
  const report = runner.generateReport(results);
  if (opts.report === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(report);
  }
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

function listSuites() {
  console.log(`\n\x1b[1mAvailable Test Suites (${ALL_SUITES.size}):\x1b[0m\n`);
  for (const [name, suite] of ALL_SUITES) {
    console.log(`  \x1b[33m${name}\x1b[0m — ${suite.description} (${suite.scenarios.length} scenarios)`);
  }
  const total = getAllScenarios().length;
  console.log(`\n  \x1b[90m${total} scenarios total across all suites\x1b[0m\n`);
  process.exit(0);
}

function listScenarios() {
  const allScenarios = getAllScenarios();
  console.log(`\n\x1b[1mAll Test Scenarios (${allScenarios.length}):\x1b[0m\n`);
  for (const [suiteName, suite] of ALL_SUITES) {
    console.log(`  \x1b[1m${suiteName}\x1b[0m (${suite.scenarios.length}):`);
    for (const s of suite.scenarios) {
      const tags = s.tags?.length ? ` \x1b[90m[${s.tags.join(', ')}]\x1b[0m` : '';
      console.log(`    \x1b[33m${s.name}\x1b[0m — ${s.botCount} bots, ${s.timeout / 1000}s${tags}`);
    }
    console.log('');
  }
  process.exit(0);
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
      case 'thread': {
        const did = rest[0];
        const text = rest.slice(1).join(' ');
        if (!did || !text) {
          console.log('Usage: thread <did> <text>');
        } else {
          const lastMsg = bot.messageTracker.getLastReceived({ senderDid: did });
          if (!lastMsg) {
            console.log(`No messages received from ${did.slice(0, 24)}...`);
          } else {
            const parentId = lastMsg.threadId ?? lastMsg.messageId;
            bot.sendThreadReply(parentId, did, text);
          }
        }
        break;
      }
      case 'react': {
        const did = rest[0];
        const emoji = rest[1];
        if (!did || !emoji) {
          console.log('Usage: react <did> <emoji>');
        } else {
          const lastMsg = bot.messageTracker.getLastReceived({ senderDid: did });
          if (!lastMsg) {
            console.log(`No messages received from ${did.slice(0, 24)}...`);
          } else {
            bot.addReaction(lastMsg.messageId, did, emoji);
          }
        }
        break;
      }
      case 'unreact': {
        const did = rest[0];
        const emoji = rest[1];
        if (!did || !emoji) {
          console.log('Usage: unreact <did> <emoji>');
        } else {
          const lastMsg = bot.messageTracker.getLastReceived({ senderDid: did });
          if (!lastMsg) {
            console.log(`No messages received from ${did.slice(0, 24)}...`);
          } else {
            bot.removeReaction(lastMsg.messageId, did, emoji);
          }
        }
        break;
      }
      case 'messages': {
        const recent = bot.messageTracker.getRecent(10);
        if (recent.length === 0) {
          console.log('No messages yet.');
        } else {
          console.log(`\n  Recent messages (${recent.length}):`);
          for (const m of recent) {
            const dir = m.senderDid === bot.identity.did ? 'SENT' : 'RECV';
            const thread = m.threadId ? ` [thread:${m.threadId.slice(0, 8)}...]` : '';
            console.log(`    [${dir}] ${m.messageId.slice(0, 12)}... "${m.content.slice(0, 40)}"${thread}`);
          }
          console.log('');
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
      case 'scenario': {
        const name = rest.join(' ');
        const allScenarios = getAllScenarios();
        if (!name) {
          console.log(`Available scenarios (${allScenarios.length}):`);
          for (const s of allScenarios) {
            console.log(`  ${s.name} — ${s.description}`);
          }
        } else {
          const scenario = allScenarios.find((s) => s.name === name);
          if (!scenario) {
            console.log(`Unknown scenario: "${name}"`);
          } else {
            console.log(`Running scenario: ${name}...`);
            const runner = new ScenarioRunner(bot.config.relayUrl);
            runner.run(scenario).then((result) => {
              if (result.passed) {
                console.log(`\x1b[32mScenario "${name}" PASSED (${(result.duration / 1000).toFixed(1)}s)\x1b[0m`);
              } else {
                console.log(`\x1b[31mScenario "${name}" FAILED (${(result.duration / 1000).toFixed(1)}s)\x1b[0m`);
              }
            });
          }
        }
        break;
      }
      case 'suite': {
        const name = rest.join(' ');
        if (!name) {
          console.log(`Available suites (${ALL_SUITES.size}):`);
          for (const [sn, suite] of ALL_SUITES) {
            console.log(`  ${sn} — ${suite.description} (${suite.scenarios.length} scenarios)`);
          }
        } else {
          console.log(`Running suite: ${name}...`);
          const runner = new ScenarioRunner(bot.config.relayUrl);
          runner.runSuite(name).then((results) => {
            const report = runner.generateReport(results);
            console.log(report);
          }).catch((err: Error) => {
            console.log(`\x1b[31mError: ${err.message}\x1b[0m`);
          });
        }
        break;
      }
      case 'status': {
        console.log(`\n  Bot: ${bot.identity.displayName}`);
        console.log(`  DID: ${bot.identity.did}`);
        console.log(`  Friends: ${bot.friendCount}`);
        console.log(`  Pending: ${bot.pendingRequestList.length}`);
        console.log(`  Messages: ${bot.messageTracker.totalCount}`);
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

  // 1. List commands — print and exit
  if (opts.listSuites) {
    listSuites();
    return;
  }
  if (opts.listScenarios) {
    listScenarios();
    return;
  }

  // 2. Tag-based run
  if (opts.tags) {
    await runByTag(opts.tags as string, opts);
    return;
  }

  // 3. Suite mode
  if (opts.suite) {
    await runSuiteMode(opts.suite as string, opts);
    return;
  }

  // 4. Single scenario mode
  if (opts.scenario) {
    await runScenario(opts.scenario as string, opts);
    return;
  }

  // 5. Swarm mode
  if (opts.bots) {
    const count = parseInt(opts.bots as string, 10);
    if (isNaN(count) || count < 2) {
      console.error('--bots requires a number >= 2');
      process.exit(1);
    }
    await runSwarm(count, opts);
  } else {
    // 6. Single bot mode
    await runSingleBot(opts);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
