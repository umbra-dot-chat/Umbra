/**
 * System Monitor plugin — entry point.
 *
 * Exports the PluginModule shape expected by the Umbra runtime:
 *   activate / deactivate / components
 */

import type { PluginAPI, PluginModule } from '@umbra/plugin-sdk';
import { updateStats, getStats, clearListeners } from './state';
import { SystemInfoPanel } from './components/SystemInfoPanel';
import { MiniStats } from './components/MiniStats';

// =============================================================================
// Module state
// =============================================================================

let api: PluginAPI | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let unregisterCommand: (() => void) | null = null;

// =============================================================================
// Helpers
// =============================================================================

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// =============================================================================
// Plugin lifecycle
// =============================================================================

function activate(pluginApi: PluginAPI): void {
  api = pluginApi;

  // Start the simulated polling loop (every 2 s)
  pollInterval = setInterval(() => {
    updateStats();
  }, 2000);

  // Register a command-palette entry that toasts a summary
  unregisterCommand = api.registerCommand({
    id: 'system-monitor.show-stats',
    label: 'System: Show Stats',
    description: 'Display current system statistics',
    onSelect() {
      const s = getStats();
      const msg = [
        `CPU: ${s.cpuUsage}%`,
        `Mem: ${s.memoryUsed}/${s.memoryTotal} GB`,
        `Disk: ${s.diskUsed}/${s.diskTotal} GB`,
        `Up: ${formatUptime(s.uptime)}`,
      ].join(' | ');
      api?.showToast(msg, 'info');
    },
  });
}

function deactivate(): void {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (unregisterCommand) {
    unregisterCommand();
    unregisterCommand = null;
  }
  clearListeners();
  api = null;
}

// =============================================================================
// Export
// =============================================================================

const plugin: PluginModule = {
  activate,
  deactivate,
  components: {
    SystemInfoPanel,
    MiniStats,
  },
};

export default plugin;
export { activate, deactivate };
export const components = plugin.components;
