import React, { forwardRef, useMemo } from 'react';
import type {
  BoostNodeDashboardProps,
  BoostNode,
} from '@coexist/wisp-core/types/BoostNodeDashboard.types';
import {
  buildContainerStyle,
  buildHeaderStyle,
  buildGridStyle,
  buildNodeCardStyle,
  buildNodeCardHeaderStyle,
  buildStatusDotStyle,
  buildStorageBarTrackStyle,
  buildStorageBarFillStyle,
  buildSkeletonStyle,
} from '@coexist/wisp-core/styles/BoostNodeDashboard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * BoostNodeDashboard -- Dashboard listing user's registered boost nodes.
 *
 * @remarks
 * Displays a grid of node cards with status indicators, storage bars,
 * and a register button for adding new nodes.
 *
 * @module components/boost-node-dashboard
 */
export const BoostNodeDashboard = forwardRef<HTMLDivElement, BoostNodeDashboardProps>(
  function BoostNodeDashboard(
    {
      nodes,
      onNodeClick,
      onRegisterClick,
      title = 'Boost Nodes',
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(() => buildContainerStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const gridStyle = useMemo(() => buildGridStyle(theme), [theme]);

    // Skeleton early return
    if (skeleton) {
      const skelStyle = buildSkeletonStyle(theme);
      return (
        <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
          <div style={headerStyle}>
            <div style={{ height: 24, width: 120, borderRadius: 6, backgroundColor: theme.colors.border.subtle, animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={gridStyle}>
            {[1, 2, 3].map((i) => (
              <div key={i} aria-hidden style={skelStyle} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
        <div style={headerStyle}>
          <span style={{ fontSize: 18, fontWeight: 600, color: theme.colors.text.primary }}>
            {title}
          </span>
          {onRegisterClick && (
            <button
              type="button"
              onClick={onRegisterClick}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.accent.primary,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Register Node
            </button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 24, color: theme.colors.text.muted, fontSize: 14 }}>
            Loading nodes...
          </div>
        )}

        {!loading && nodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: theme.colors.text.muted, fontSize: 14 }}>
            No boost nodes registered yet.
          </div>
        )}

        {!loading && nodes.length > 0 && (
          <div style={gridStyle}>
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} onClick={onNodeClick} theme={theme} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

BoostNodeDashboard.displayName = 'BoostNodeDashboard';

// ---------------------------------------------------------------------------
// NodeCard (internal)
// ---------------------------------------------------------------------------

function NodeCard({
  node,
  onClick,
  theme,
}: {
  node: BoostNode;
  onClick?: (nodeId: string) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const cardStyle = useMemo(() => buildNodeCardStyle(theme), [theme]);
  const headerStyle = useMemo(() => buildNodeCardHeaderStyle(), []);
  const dotStyle = useMemo(() => buildStatusDotStyle(node.status, theme), [node.status, theme]);

  const storagePercent = node.maxStorageBytes > 0
    ? (node.usedStorageBytes / node.maxStorageBytes) * 100
    : 0;

  const trackStyle = useMemo(() => buildStorageBarTrackStyle(theme), [theme]);
  const fillStyle = useMemo(
    () => buildStorageBarFillStyle(storagePercent, theme),
    [storagePercent, theme],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(node.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(node.id); }}
      style={cardStyle}
    >
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={dotStyle} />
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.text.primary }}>
            {node.name}
          </span>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.border.subtle,
            fontSize: 11,
            fontWeight: 500,
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {node.nodeType}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.colors.text.muted }}>
        <span>{node.status}</span>
        <span>{node.enabled ? 'Enabled' : 'Disabled'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.colors.text.muted }}>
          <span>Storage</span>
          <span>{formatBytes(node.usedStorageBytes)} / {formatBytes(node.maxStorageBytes)}</span>
        </div>
        <div style={trackStyle}>
          <div style={fillStyle} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: theme.colors.text.muted }}>
        {node.maxBandwidthMbps} Mbps max bandwidth
      </div>
    </div>
  );
}
