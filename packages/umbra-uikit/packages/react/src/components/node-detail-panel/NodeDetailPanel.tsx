import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { NodeDetailPanelProps } from '@coexist/wisp-core/types/NodeDetailPanel.types';
import {
  buildPanelContainerStyle,
  buildPanelHeaderStyle,
  buildSectionStyle,
  buildInfoRowStyle,
  buildPublicKeyStyle,
  buildConfigRowStyle,
  buildDangerZoneStyle,
  buildPanelSkeletonStyle,
} from '@coexist/wisp-core/styles/NodeDetailPanel.styles';
import { buildStatusDotStyle } from '@coexist/wisp-core/styles/BoostNodeDashboard.styles';
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

function formatTimestamp(iso?: string): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NodeDetailPanel -- Configuration panel for a single boost node.
 *
 * @remarks
 * Shows node configuration, status, storage usage, and provides controls
 * for updating settings or deleting the node.
 *
 * @module components/node-detail-panel
 */
export const NodeDetailPanel = forwardRef<HTMLDivElement, NodeDetailPanelProps>(
  function NodeDetailPanel(
    {
      name,
      nodeType,
      enabled,
      lastSeenAt,
      maxStorageBytes,
      usedStorageBytes,
      maxBandwidthMbps,
      publicKey,
      status,
      onToggleEnabled,
      onUpdateConfig,
      onDelete,
      onClose,
      saving = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const containerStyle = useMemo(() => buildPanelContainerStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildPanelHeaderStyle(theme), [theme]);
    const sectionStyle = useMemo(() => buildSectionStyle(theme), [theme]);
    const infoRowStyle = useMemo(() => buildInfoRowStyle(theme), [theme]);
    const publicKeyStyle = useMemo(() => buildPublicKeyStyle(theme), [theme]);
    const dangerZoneStyle = useMemo(() => buildDangerZoneStyle(theme), [theme]);
    const dotStyle = useMemo(() => buildStatusDotStyle(status, theme), [status, theme]);

    const storagePercent = maxStorageBytes > 0 ? (usedStorageBytes / maxStorageBytes) * 100 : 0;

    const handleCopyKey = useCallback(() => {
      navigator.clipboard?.writeText(publicKey);
    }, [publicKey]);

    // Skeleton early return
    if (skeleton) {
      return (
        <div
          ref={ref}
          className={className}
          aria-hidden
          style={{ ...buildPanelSkeletonStyle(theme), ...userStyle }}
          {...rest}
        />
      );
    }

    const inputStyle: React.CSSProperties = {
      padding: '6px 10px',
      borderRadius: theme.radii.md,
      border: `1px solid ${theme.colors.border.strong}`,
      backgroundColor: theme.colors.background.sunken,
      color: theme.colors.text.primary,
      fontSize: 13,
      outline: 'none',
      width: 120,
    };

    return (
      <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={dotStyle} />
            <span style={{ fontSize: 18, fontWeight: 600, color: theme.colors.text.primary }}>{name}</span>
            <span
              style={{
                display: 'inline-flex',
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
              {nodeType}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              x
            </button>
          )}
        </div>

        {/* Status info */}
        <div style={sectionStyle}>
          <div style={infoRowStyle}>
            <span style={{ fontSize: 13, color: theme.colors.text.muted }}>Status</span>
            <span style={{ fontSize: 14, color: theme.colors.text.primary, textTransform: 'capitalize' }}>{status}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={{ fontSize: 13, color: theme.colors.text.muted }}>Last Seen</span>
            <span style={{ fontSize: 14, color: theme.colors.text.primary }}>{formatTimestamp(lastSeenAt)}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={{ fontSize: 13, color: theme.colors.text.muted }}>Enabled</span>
            <button
              type="button"
              onClick={() => onToggleEnabled?.(!enabled)}
              role="switch"
              aria-checked={enabled}
              style={{
                width: 40,
                height: 22,
                borderRadius: theme.radii.full,
                backgroundColor: enabled ? theme.colors.accent.primary : theme.colors.border.subtle,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 150ms ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: enabled ? 20 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: theme.radii.full,
                  backgroundColor: '#fff',
                  transition: 'left 150ms ease',
                }}
              />
            </button>
          </div>
        </div>

        {/* Public key */}
        <div style={sectionStyle}>
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>Public Key</span>
          <div style={publicKeyStyle}>
            <span style={{ flex: 1 }}>{publicKey}</span>
            <button
              type="button"
              onClick={handleCopyKey}
              aria-label="Copy public key"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Storage usage */}
        <div style={sectionStyle}>
          <div style={infoRowStyle}>
            <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>Storage Usage</span>
            <span style={{ fontSize: 12, color: theme.colors.text.muted }}>
              {formatBytes(usedStorageBytes)} / {formatBytes(maxStorageBytes)} ({storagePercent.toFixed(1)}%)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.border.subtle,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: theme.radii.full,
                backgroundColor: storagePercent > 90 ? theme.colors.status.warning : theme.colors.accent.primary,
                width: `${Math.min(100, storagePercent)}%`,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>

        {/* Configuration */}
        <div style={sectionStyle}>
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>Configuration</span>
          <div style={buildConfigRowStyle(theme)}>
            <label style={{ flex: 1, fontSize: 13, color: theme.colors.text.muted }}>Max Storage (GB)</label>
            <input
              type="number"
              value={Math.round(maxStorageBytes / (1024 * 1024 * 1024))}
              onChange={(e) => onUpdateConfig?.({ maxStorageBytes: Number(e.target.value) * 1024 * 1024 * 1024 })}
              style={inputStyle}
              min={1}
            />
          </div>
          <div style={buildConfigRowStyle(theme)}>
            <label style={{ flex: 1, fontSize: 13, color: theme.colors.text.muted }}>Max Bandwidth (Mbps)</label>
            <input
              type="number"
              value={maxBandwidthMbps}
              onChange={(e) => onUpdateConfig?.({ maxBandwidthMbps: Number(e.target.value) })}
              style={inputStyle}
              min={1}
            />
          </div>
          {saving && (
            <span style={{ fontSize: 12, color: theme.colors.text.muted }}>Saving...</span>
          )}
        </div>

        {/* Danger zone */}
        <div style={dangerZoneStyle}>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.status.danger }}>Danger Zone</span>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radii.md,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.status.danger}`,
                color: theme.colors.status.danger,
                cursor: 'pointer',
                fontSize: 13,
                alignSelf: 'flex-start',
              }}
            >
              Delete Node
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: theme.colors.status.danger }}>Are you sure?</span>
              <button
                type="button"
                onClick={() => { onDelete?.(); setConfirmDelete(false); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.status.danger,
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: theme.radii.md,
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.border.strong}`,
                  color: theme.colors.text.secondary,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

NodeDetailPanel.displayName = 'NodeDetailPanel';
