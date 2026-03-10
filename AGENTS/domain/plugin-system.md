# Domain: Plugin System

## Overview

Umbra has a sandboxed plugin system with three components:

| Package | Purpose |
|---------|---------|
| `@umbra/plugin-sdk` | Types, hooks, and utilities for plugin developers |
| `@umbra/plugin-runtime` | Sandboxed execution environment for plugins |
| `plugins/` | Actual plugin implementations |

## Current Plugins

- `language-tutor/` — Language learning plugin
- `translator/` — Translation plugin
- `system-monitor/` — System monitoring
- `suppress-os-logs.js` — Utility script

## Plugin Structure

Each plugin follows this layout:

```
plugins/my-plugin/
├── manifest.json          # Plugin metadata (name, version, permissions)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── src/                   # Source code
│   └── index.ts          # Entry point
├── dist/                  # Compiled output
└── .build-shims/          # Build-time polyfills
```

## Key Integration Points

### Slash Commands

Plugins register commands via the SDK:

```typescript
api.registerSlashCommand({
  name: 'translate',
  description: 'Translate a message',
  handler: async (args, context) => { ... }
});
```

Commands are routed through `SlashCommandRegistry` in `src/services/`.

### Plugin Context

`src/contexts/PluginContext.tsx` manages plugin lifecycle:
- Loading/unloading plugins
- Dispatching slash commands
- Permission management

### Plugin Runtime Sandbox

`@umbra/plugin-runtime` creates an isolated execution environment:
- Restricted API surface
- Permission-gated access to app features
- Resource limits

## Key Files

| File | Purpose |
|------|---------|
| `packages/umbra-plugin-sdk/` | SDK package root |
| `packages/umbra-plugin-runtime/` | Runtime package root |
| `src/contexts/PluginContext.tsx` | Client-side plugin state management |
| `src/services/SlashCommandRegistry.ts` | Slash command routing |
| `src/hooks/useSlashCommand.ts` | Hook for slash command UI integration |

## Common Tasks

### Creating a New Plugin

1. Copy `packages/umbra-plugin-template/` to `plugins/my-plugin/`
2. Edit `manifest.json` with plugin metadata
3. Implement handler in `src/index.ts`
4. Build: `npm run build` (from plugin directory)
5. Register in the plugin runtime

### Modifying the Plugin SDK

1. Edit files in `packages/umbra-plugin-sdk/src/`
2. Ensure backwards compatibility (plugins may be third-party)
3. Type-check: `cd packages/umbra-plugin-sdk && npx tsc --noEmit`
4. Update version in `package.json` if public API changes
