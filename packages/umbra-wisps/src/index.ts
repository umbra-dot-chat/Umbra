import { Command } from 'commander';
import { WispOrchestrator } from './orchestrator.js';

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
    const orchestrator = new WispOrchestrator({
      relayUrl: opts.relay,
      ollamaUrl: opts.ollama,
      model: opts.model,
      count: parseInt(opts.count, 10),
      dataDir: opts.dataDir,
      httpPort: parseInt(opts.httpPort, 10),
    });
    await orchestrator.start();
    await orchestrator.befriendAll();
    if (opts.add) await orchestrator.befriendUser(opts.add);

    process.on('SIGINT', async () => {
      console.log('\n[Wisps] Shutting down...');
      await orchestrator.stop();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await orchestrator.stop();
      process.exit(0);
    });
  });

program
  .command('scenario <name>')
  .description('Run a wisp scenario')
  .option('--count <n>', 'Number of wisps', '4')
  .option('--relay <url>', 'Relay WebSocket URL', 'wss://relay.umbra.chat/ws')
  .option('--model <name>', 'Ollama model', 'llama3.2:1b')
  .option('--ollama <url>', 'Ollama API URL', 'http://localhost:11434')
  .option('--data-dir <path>', 'Data directory', './wisp-data')
  .option('--http-port <port>', 'HTTP control port', '3334')
  .action(async (name: string, opts) => {
    const orchestrator = new WispOrchestrator({
      relayUrl: opts.relay,
      ollamaUrl: opts.ollama,
      model: opts.model,
      count: parseInt(opts.count, 10),
      dataDir: opts.dataDir,
      httpPort: parseInt(opts.httpPort, 10),
    });
    await orchestrator.start();
    await orchestrator.befriendAll();
    const result = await orchestrator.runScenario(name);
    console.log('[Wisps] Scenario result:', JSON.stringify(result, null, 2));
    await orchestrator.stop();
    process.exit(result.success ? 0 : 1);
  });

program
  .command('scenarios')
  .description('List available scenarios')
  .action(async () => {
    // Import to trigger registration side effects
    await import('./scenarios/index.js');
    await import('./scenarios/dm-conversation.js');
    await import('./scenarios/group-chat.js');
    await import('./scenarios/friend-storm.js');
    await import('./scenarios/debate.js');
    const { listScenarios } = await import('./scenarios/index.js');
    console.log('Available scenarios:');
    for (const name of listScenarios()) {
      console.log(`  - ${name}`);
    }
  });

program
  .command('status')
  .description('Check wisp swarm status')
  .option('--port <port>', 'HTTP port', '3334')
  .action(async (opts) => {
    try {
      const resp = await fetch(`http://localhost:${opts.port}/wisps/status`);
      const data = await resp.json();
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.error('Could not connect. Is the wisp swarm running?');
      process.exit(1);
    }
  });

program.parse();
