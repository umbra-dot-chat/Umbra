#!/usr/bin/env node
/**
 * Ghost — Umbra AI Agent
 *
 * A friendly AI companion that lives on the Umbra encrypted messaging network.
 *
 * Usage:
 *   ghost --relay wss://relay.umbra.chat/ws --model llama3.1 --language en
 *   ghost --relay wss://seoul.relay.umbra.chat/ws --model qwen2.5 --language ko
 */

import { Command } from 'commander';
import { GhostBot } from './bot.js';
import { loadConfig } from './config.js';

const program = new Command()
  .name('ghost')
  .description('Ghost — Umbra AI Agent 👻')
  .version('1.0.0')
  .option('--relay <url>', 'Relay server WebSocket URL')
  .option('--model <name>', 'Ollama LLM model name')
  .option('--embed-model <name>', 'Ollama embedding model name')
  .option('--ollama <url>', 'Ollama API base URL')
  .option('--language <lang>', 'Bot language (en | ko)')
  .option('--data-dir <path>', 'Data directory for persistence')
  .option('--codebase-path <path>', 'Path to Umbra codebase for RAG')
  .option('--http-port <port>', 'HTTP port for health/webhook endpoints')
  .option('--log-level <level>', 'Log level (debug | info | warn | error)')
  .parse();

const config = loadConfig(program.opts());
const bot = new GhostBot(config);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Ghost...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  bot.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  bot.stop();
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[ERROR] Unhandled rejection:', err);
});

// Start the bot
bot.start().catch((err) => {
  console.error('[FATAL] Failed to start Ghost:', err);
  process.exit(1);
});
