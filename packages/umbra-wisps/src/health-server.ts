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
        const groupId = await orchestrator.createGroup(name, creator.name, userDid);
        json(res, { ok: true, groupId });
      } else if (req.method === 'POST' && url.pathname === '/wisps/scenario') {
        const body = await readBody(req);
        const { name } = JSON.parse(body) as { name: string };
        const result = await orchestrator.runScenario(name);
        json(res, result);
      } else if (req.method === 'GET' && url.pathname === '/wisps/scenarios') {
        json(res, { scenarios: orchestrator.getAvailableScenarios() });
      } else if (req.method === 'GET' && url.pathname === '/wisps/groups') {
        const wisps = orchestrator.getWisps();
        const groups = wisps.map(w => ({
          name: w.name,
          groups: w.getGroups().map(g => ({ groupId: g.groupId, groupName: g.groupName, members: g.members.length })),
        }));
        json(res, { groups });
      } else if (req.method === 'POST' && url.pathname === '/wisps/send-group-message') {
        const body = await readBody(req);
        const { wispName, groupId, text } = JSON.parse(body) as { wispName: string; groupId: string; text: string };
        const wisp = orchestrator.getWisp(wispName);
        if (!wisp) { res.writeHead(404); res.end('Wisp not found'); return; }
        wisp.sendGroupMessage(groupId, text);
        json(res, { ok: true });
      // ── Community endpoints ──────────────────────────────────────
      } else if (req.method === 'POST' && url.pathname === '/wisps/community/join') {
        const body = await readBody(req);
        const { communityId, info } = JSON.parse(body) as { communityId?: string; info?: any };
        if (!info) { res.writeHead(400); res.end(JSON.stringify({ error: 'info required' })); return; }
        // Create stub send/reaction functions that broadcast via wisps
        const sendFn = (wispDid: string, cId: string, channelId: string, channelName: string, senderDisplayName: string, content: string, replyToId?: string) => {
          const wisp = orchestrator.getWisps().find(w => w.did === wispDid);
          if (!wisp) return;
          // Broadcast community message to all community members via relay
          for (const member of info.members ?? []) {
            if (member.did === wispDid) continue;
            wisp.sendRawEnvelope(member.did, {
              envelope: 'community_message', version: 1,
              payload: { communityId: cId, channelId, channelName, senderDid: wispDid, senderDisplayName, content, replyToId, timestamp: Date.now() },
            });
          }
        };
        const reactionFn = (wispDid: string, cId: string, channelId: string, messageId: string, emoji: string) => {
          const wisp = orchestrator.getWisps().find(w => w.did === wispDid);
          if (!wisp) return;
          for (const member of info.members ?? []) {
            if (member.did === wispDid) continue;
            wisp.sendRawEnvelope(member.did, {
              envelope: 'community_reaction', version: 1,
              payload: { communityId: cId, channelId, messageId, emoji, senderDid: wispDid, timestamp: Date.now() },
            });
          }
        };
        orchestrator.addCommunity(info, sendFn, reactionFn);
        json(res, { ok: true });

      } else if (req.method === 'POST' && url.pathname === '/wisps/community/leave') {
        const body = await readBody(req);
        const { communityId } = JSON.parse(body) as { communityId: string };
        orchestrator.removeCommunity(communityId);
        json(res, { ok: true });

      } else if (req.method === 'GET' && url.pathname === '/wisps/community/status') {
        // Return minimal community status (communities are managed by CommunityActivity)
        json(res, { communities: [] });

      } else if (req.method === 'POST' && url.pathname === '/wisps/community/activity') {
        const body = await readBody(req);
        const { action, msgsPerHour } = JSON.parse(body) as { action: string; msgsPerHour?: number; rate?: number };
        // Community activity is managed within addCommunity; these control start/stop/rate
        // For now return ok -- the CommunityActivity engine auto-starts on addCommunity
        json(res, { ok: true, action, msgsPerHour });

      // ── Voice endpoints ─────────────────────────────────────────
      } else if (req.method === 'POST' && url.pathname === '/wisps/voice/join') {
        const body = await readBody(req);
        const { channelId, wispNames } = JSON.parse(body) as { channelId: string; wispNames?: string[] };
        if (!channelId) { res.writeHead(400); res.end(JSON.stringify({ error: 'channelId required' })); return; }
        const joined = await orchestrator.joinVoice(channelId, wispNames);
        json(res, { ok: true, joined });

      } else if (req.method === 'POST' && url.pathname === '/wisps/voice/leave') {
        const body = await readBody(req);
        const { wispNames } = JSON.parse(body) as { wispNames?: string[] };
        const left = orchestrator.leaveVoice(wispNames);
        json(res, { ok: true, left });

      } else if (req.method === 'GET' && url.pathname === '/wisps/voice/status') {
        json(res, orchestrator.getVoiceStatus());

      // ── Schedule endpoints ──────────────────────────────────────
      } else if (req.method === 'POST' && url.pathname === '/wisps/schedule') {
        const body = await readBody(req);
        const { action, enabled } = JSON.parse(body) as { action?: string; enabled?: boolean };
        const turnOn = action === 'on' || enabled === true;
        if (turnOn) {
          orchestrator.enablePresenceScheduling();
        }
        // Note: disabling presence scheduling would need a disablePresenceScheduling method
        // For now, enabling is supported; disable is a no-op acknowledgment
        json(res, { ok: true, scheduling: turnOn ? 'enabled' : 'disabled' });

      } else if (req.method === 'GET' && url.pathname === '/wisps/schedule/status') {
        const status = orchestrator.getPresenceStatus();
        json(res, { enabled: status !== null, ...(status ?? {}) });

      } else if (req.method === 'POST' && url.pathname === '/wisps/summon') {
        const body = await readBody(req);
        const { userDid } = JSON.parse(body) as { userDid: string };
        if (!userDid) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'userDid required' }));
          return;
        }
        await orchestrator.befriendUser(userDid);
        const creator = orchestrator.getWisps()[0];
        const groupId = await orchestrator.createGroup('Wisp Hangout', creator.name, userDid);
        json(res, { ok: true, groupId });
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
