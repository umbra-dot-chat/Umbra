/**
 * SystemInfoPanel — Full settings-tab panel showing detailed system info.
 *
 * All rendering uses React.createElement (no JSX).
 */

import React from 'react';
import { PluginPanel } from '@umbra/plugin-sdk';
import { getStats, subscribe, type SystemStats } from '../state';

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
// Sub-components (all React.createElement)
// =============================================================================

/** Reusable progress bar row. */
function StatRow(props: {
  label: string;
  value: string;
  percent: number;
  color: string;
}): React.ReactElement {
  const { label, value, percent, color } = props;

  return React.createElement(
    'div',
    { style: { marginBottom: 20 } },
    // Label row
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
      },
      React.createElement(
        'span',
        { style: { color: '#A1A1AA', fontSize: 13, fontWeight: 500 } },
        label
      ),
      React.createElement(
        'span',
        { style: { color: '#FAFAFA', fontSize: 13, fontWeight: 600 } },
        value
      )
    ),
    // Track
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: 8,
          borderRadius: 4,
          backgroundColor: '#27272A',
          overflow: 'hidden',
        },
      },
      // Fill
      React.createElement('div', {
        style: {
          width: `${Math.min(percent, 100)}%`,
          height: '100%',
          borderRadius: 4,
          backgroundColor: color,
          transition: 'width 0.4s ease',
        },
      })
    )
  );
}

/** Small info row without a bar. */
function InfoRow(props: {
  label: string;
  value: string;
}): React.ReactElement {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #27272A',
      },
    },
    React.createElement(
      'span',
      { style: { color: '#A1A1AA', fontSize: 13 } },
      props.label
    ),
    React.createElement(
      'span',
      { style: { color: '#FAFAFA', fontSize: 13, fontWeight: 500 } },
      props.value
    )
  );
}

// =============================================================================
// Main component
// =============================================================================

export function SystemInfoPanel(): React.ReactElement {
  const [stats, setStats] = React.useState<SystemStats>(getStats);

  React.useEffect(() => {
    // Seed with current snapshot
    setStats(getStats());
    // Subscribe to future updates
    const unsub = subscribe((next) => setStats(next));
    return unsub;
  }, []);

  const cpuPercent = stats.cpuUsage;
  const memPercent = (stats.memoryUsed / stats.memoryTotal) * 100;
  const diskPercent = (stats.diskUsed / stats.diskTotal) * 100;

  // Color ramps: green -> yellow -> red
  function barColor(pct: number): string {
    if (pct < 50) return '#22C55E';
    if (pct < 75) return '#EAB308';
    return '#EF4444';
  }

  return React.createElement(
    PluginPanel,
    { title: 'System Monitor', icon: null },
    React.createElement(
      'div',
      { style: { maxWidth: 480 } },

      // Section heading
      React.createElement(
        'h3',
        {
          style: {
            color: '#FAFAFA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
            marginBottom: 16,
            marginTop: 0,
          },
        },
        'Performance'
      ),

      // CPU
      React.createElement(StatRow, {
        label: 'CPU Usage',
        value: `${stats.cpuUsage}%`,
        percent: cpuPercent,
        color: barColor(cpuPercent),
      }),

      // Memory
      React.createElement(StatRow, {
        label: 'Memory',
        value: `${stats.memoryUsed} / ${stats.memoryTotal} GB`,
        percent: memPercent,
        color: barColor(memPercent),
      }),

      // Disk
      React.createElement(StatRow, {
        label: 'Disk',
        value: `${stats.diskUsed} / ${stats.diskTotal} GB`,
        percent: diskPercent,
        color: barColor(diskPercent),
      }),

      // Divider
      React.createElement('div', {
        style: { height: 1, backgroundColor: '#27272A', margin: '8px 0 16px' },
      }),

      // Section heading
      React.createElement(
        'h3',
        {
          style: {
            color: '#FAFAFA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
            marginBottom: 12,
            marginTop: 0,
          },
        },
        'System'
      ),

      // Uptime
      React.createElement(InfoRow, {
        label: 'Uptime',
        value: formatUptime(stats.uptime),
      }),

      // Platform
      React.createElement(InfoRow, {
        label: 'Platform',
        value: stats.platform,
      }),

      // Note
      React.createElement(
        'p',
        {
          style: {
            color: '#52525B',
            fontSize: 11,
            marginTop: 24,
            fontStyle: 'italic',
          },
        },
        'Stats are simulated for this WASM proof-of-concept. In production, data is read from the host OS via Tauri commands.'
      )
    )
  );
}
