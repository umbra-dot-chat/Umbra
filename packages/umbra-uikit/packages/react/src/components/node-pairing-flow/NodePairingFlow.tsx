import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { NodePairingFlowProps } from '@coexist/wisp-core/types/NodePairingFlow.types';
import {
  buildPairingContainerStyle,
  buildQRWrapperStyle,
  buildTokenDisplayStyle,
  resolvePairingStatusColor,
  buildManualSectionStyle,
  buildPairingErrorStyle,
} from '@coexist/wisp-core/styles/NodePairingFlow.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NodePairingFlow -- Pairing interface for remote nodes with QR code or token.
 *
 * @remarks
 * Displays a QR code of the pairing token, a copyable token string,
 * and a manual input field for entering remote tokens.
 *
 * @module components/node-pairing-flow
 */
export const NodePairingFlow = forwardRef<HTMLDivElement, NodePairingFlowProps>(
  function NodePairingFlow(
    {
      open,
      onClose,
      pairingToken,
      remoteAddress,
      onGenerateToken,
      onVerifyPairing,
      pairingStatus = 'idle',
      error,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [manualToken, setManualToken] = useState('');

    const containerStyle = useMemo(() => buildPairingContainerStyle(theme), [theme]);
    const qrWrapperStyle = useMemo(() => buildQRWrapperStyle(theme), [theme]);
    const tokenDisplayStyle = useMemo(() => buildTokenDisplayStyle(theme), [theme]);
    const manualSectionStyle = useMemo(() => buildManualSectionStyle(theme), [theme]);
    const statusColor = useMemo(
      () => resolvePairingStatusColor(pairingStatus, theme),
      [pairingStatus, theme],
    );

    const handleCopyToken = useCallback(() => {
      if (pairingToken) navigator.clipboard?.writeText(pairingToken);
    }, [pairingToken]);

    const handleVerify = useCallback(() => {
      if (manualToken.trim()) onVerifyPairing?.(manualToken.trim());
    }, [manualToken, onVerifyPairing]);

    if (!open) return null;

    const statusLabels: Record<string, string> = {
      idle: 'Ready to pair',
      waiting: 'Waiting for connection...',
      connected: 'Connected!',
      failed: 'Pairing failed',
    };

    return (
      <div
        ref={ref}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label="Node Pairing"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.overlay,
          zIndex: 1000,
          ...userStyle,
        }}
        {...rest}
      >
        <div
          style={{
            ...containerStyle,
            backgroundColor: theme.colors.background.surface,
            borderRadius: theme.radii.xl,
            border: `1px solid ${theme.colors.border.subtle}`,
            maxWidth: 440,
            width: '100%',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: theme.colors.text.primary }}>
              Pair Remote Node
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: theme.radii.full,
                backgroundColor: statusColor,
              }}
            />
            <span style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              {statusLabels[pairingStatus]}
            </span>
            {pairingStatus === 'waiting' && (
              <span style={{ fontSize: 12, color: theme.colors.text.muted, animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite' }}>
                ...
              </span>
            )}
          </div>

          {/* QR code area */}
          {pairingToken && (
            <div style={qrWrapperStyle}>
              <div
                data-testid="qr-placeholder"
                style={{
                  width: 160,
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#666',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  padding: 8,
                  wordBreak: 'break-all',
                }}
              >
                QR: {pairingToken.slice(0, 20)}...
              </div>
            </div>
          )}

          {/* Token display */}
          {pairingToken && (
            <div style={tokenDisplayStyle}>
              <span style={{ flex: 1 }}>{pairingToken}</span>
              <button
                type="button"
                onClick={handleCopyToken}
                aria-label="Copy pairing token"
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
          )}

          {/* Remote address */}
          {remoteAddress && (
            <div style={{ fontSize: 13, color: theme.colors.text.muted, textAlign: 'center' }}>
              Remote address: <strong>{remoteAddress}</strong>
            </div>
          )}

          {/* Generate token button */}
          {!pairingToken && onGenerateToken && (
            <button
              type="button"
              onClick={onGenerateToken}
              style={{
                padding: '10px 20px',
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.accent.primary,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Generate Pairing Token
            </button>
          )}

          {/* Manual input */}
          <div style={manualSectionStyle}>
            <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>
              Or enter a token manually:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste pairing token..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.border.strong}`,
                  backgroundColor: theme.colors.background.sunken,
                  color: theme.colors.text.primary,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={!manualToken.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.accent.primary,
                  color: '#fff',
                  border: 'none',
                  cursor: manualToken.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: manualToken.trim() ? 1 : 0.5,
                }}
              >
                Verify
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div style={buildPairingErrorStyle(theme)}>{error}</div>}
        </div>
      </div>
    );
  },
);

NodePairingFlow.displayName = 'NodePairingFlow';
