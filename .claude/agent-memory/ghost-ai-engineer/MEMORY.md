# Ghost AI Engineer Memory

## Cross-Package TypeScript Import Pattern (Wisps)

When importing from `@umbra/test-bot` into `@umbra/wisps`:
- `file:` dependency creates symlink that tsc follows into uncompiled .ts files
- test-bot has no tsconfig/build step, so its .ts files fail tsc when resolved
- Ambient module declarations (.d.ts) are overridden when tsc finds actual .ts source
- **Solution used**: Copy needed functions (crypto, relay-client) into wisps package
- Both packages share the same `@noble/*` dependencies so copying is safe
- See `packages/umbra-wisps/src/crypto.ts` and `packages/umbra-wisps/src/relay-client.ts`

## Wisps Package Structure (Phase 2)

| File | Purpose |
|------|---------|
| `crypto.ts` | encryptMessage, decryptMessage, computeConversationId, uuid |
| `relay-client.ts` | WebSocket relay client (connect, send, reconnect) |
| `wisp.ts` | Core Wisp class: identity + relay + friends + LLM + messages |
| `orchestrator.ts` | Spawns/manages N wisps, befriending, status |
| `conversation-loop.ts` | Autonomous 30-60s interval conversations |
| `reactions.ts` | 1-2 random wisps react to user messages with emoji |
