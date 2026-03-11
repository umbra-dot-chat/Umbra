import { Command } from 'commander';

const program = new Command()
  .name('wisps')
  .description('AI Wisps — fake users for Umbra testing')
  .version('0.1.0');

program
  .command('start')
  .description('Start the wisp swarm')
  .option('--count <n>', 'Number of wisps', '4')
  .option('--relay <url>', 'Relay WebSocket URL', 'wss://relay.umbra.chat/ws')
  .option('--model <name>', 'Ollama model', 'llama3.2:1b')
  .option('--ollama <url>', 'Ollama API URL', 'http://localhost:11434')
  .option('--data-dir <path>', 'Data directory', './wisp-data')
  .option('--http-port <port>', 'HTTP control port', '3334')
  .option('--add <did>', 'Befriend this user DID')
  .action(async (opts) => {
    console.log('[Wisps] Starting swarm...', opts);
    // TODO: Wire to orchestrator
  });

program
  .command('scenario <name>')
  .description('Run a wisp scenario')
  .action(async (name: string) => {
    console.log(`[Wisps] Running scenario: ${name}`);
  });

program
  .command('status')
  .description('Check wisp swarm status')
  .option('--port <port>', 'HTTP port', '3334')
  .action(async () => {
    console.log('[Wisps] Checking status...');
  });

program.parse();
