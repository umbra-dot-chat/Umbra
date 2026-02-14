/**
 * MiniStats — Compact sidebar widget showing key stats at a glance.
 *
 * All rendering uses React.createElement (no JSX).
 */

import React from 'react';
import { getStats, subscribe, type SystemStats } from '../state';

// =============================================================================
// Sub-components
// =============================================================================

/** Tiny inline progress bar (sidebar-sized). */
function MiniBar(props: { percent: number; color: string }): React.ReactElement {
  return React.createElement(
    'div',
    {
      style: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#27272A',
        overflow: 'hidden',
        minWidth: 40,
      },
    },
    React.createElement('div', {
      style: {
        width: `${Math.min(props.percent, 100)}%`,
        height: '100%',
        borderRadius: 2,
        backgroundColor: props.color,
        transition: 'width 0.4s ease',
      },
    })
  );
}

/** A single stat row: label, percentage, tiny bar. */
function MiniStatRow(props: {
  label: string;
  percent: number;
  color: string;
}): React.ReactElement {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      },
    },
    // Label
    React.createElement(
      'span',
      {
        style: {
          color: '#71717A',
          fontSize: 11,
          fontWeight: 500,
          width: 32,
          flexShrink: 0,
        },
      },
      props.label
    ),
    // Bar
    React.createElement(MiniBar, {
      percent: props.percent,
      color: props.color,
    }),
    // Value
    React.createElement(
      'span',
      {
        style: {
          color: '#A1A1AA',
          fontSize: 11,
          fontWeight: 600,
          width: 34,
          textAlign: 'right' as const,
          flexShrink: 0,
        },
      },
      `${Math.round(props.percent)}%`
    )
  );
}

// =============================================================================
// Main component
// =============================================================================

export function MiniStats(): React.ReactElement {
  const [stats, setStats] = React.useState<SystemStats>(getStats);

  React.useEffect(() => {
    setStats(getStats());
    const unsub = subscribe((next) => setStats(next));
    return unsub;
  }, []);

  const cpuPercent = stats.cpuUsage;
  const memPercent = (stats.memoryUsed / stats.memoryTotal) * 100;

  function barColor(pct: number): string {
    if (pct < 50) return '#22C55E';
    if (pct < 75) return '#EAB308';
    return '#EF4444';
  }

  return React.createElement(
    'div',
    {
      style: {
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
      },
    },
    // Title
    React.createElement(
      'div',
      {
        style: {
          color: '#A1A1AA',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          marginBottom: 8,
        },
      },
      'System'
    ),
    // CPU row
    React.createElement(MiniStatRow, {
      label: 'CPU',
      percent: cpuPercent,
      color: barColor(cpuPercent),
    }),
    // Memory row
    React.createElement(MiniStatRow, {
      label: 'MEM',
      percent: memPercent,
      color: barColor(memPercent),
    })
  );
}
