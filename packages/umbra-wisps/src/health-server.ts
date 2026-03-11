/**
 * HTTP health/control server for the wisp orchestrator.
 *
 * Provides REST endpoints for status, friend management,
 * group creation, and scenario execution.
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import type { WispOrchestrator } from './orchestrator.js';

export function startHealthServer(
  orchestrator: WispOrchestrator,
  port: number,
): Server {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    try {
      if (req.method === 'GET' && url.pathname === '/wisps/status') {
        json(res, orchestrator.getStatus());
      } else if (req.method === 'POST' && url.pathname === '/wisps/befriend-user') {
        const body = await readBody(req);
        const { did } = JSON.parse(body) as { did: string };
        await orchestrator.befriendUser(did);
        json(res, { ok: true });
      } else if (req.method === 'POST' && url.pathname === '/wisps/create-group') {
        const body = await readBody(req);
        const { name, userDid } = JSON.parse(body) as { name: string; userDid?: string };
        const creator = orchestrator.getWisps()[0];
        const groupId = await orchestrator.createGroup(name, creator.name);
        if (userDid) await orchestrator.befriendUser(userDid);
        json(res, { ok: true, groupId });
      } else if (req.method === 'POST' && url.pathname === '/wisps/scenario') {
        const body = await readBody(req);
        const { name } = JSON.parse(body) as { name: string };
        const result = await orchestrator.runScenario(name);
        json(res, result);
      } else if (req.method === 'GET' && url.pathname === '/wisps/scenarios') {
        json(res, { scenarios: orchestrator.getAvailableScenarios() });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: String(err) }));
    }
  });

  server.listen(port, () => {
    console.log(`[Health] Wisp control server on http://localhost:${port}`);
  });
  return server;
}

function json(res: ServerResponse, data: unknown): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
  });
}
