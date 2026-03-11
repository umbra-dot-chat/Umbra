/**
 * @module E2EEKeyExchangeUI
 * @description A banner/card showing E2EE key exchange status.
 *
 * @remarks
 * Displays the current state of end-to-end encryption key exchange,
 * including pending, active, rotating, and error states. Supports both
 * a full card layout and a compact banner variant.
 *
 * @example
 * ```tsx
 * <E2EEKeyExchangeUI status="active" keyVersion={3} />
 * <E2EEKeyExchangeUI status="error" errorMessage="Key exchange failed" onRetry={() => {}} />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { E2EEKeyExchangeUIProps, KeyExchangeStatus } from '@coexist/wisp-core/types/E2EEKeyExchangeUI.types';
import {
  resolveE2EEColors,
  buildE2EEContainerStyle,
  buildE2EEHeaderStyle,
  buildE2EETitleStyle,
  buildE2EEDescriptionStyle,
  buildE2EEBadgeStyle,
  buildE2EEActionsStyle,
  buildE2EESkeletonStyle,
  buildE2EESkeletonBarStyle,
} from '@coexist/wisp-core/styles/E2EEKeyExchangeUI.styles';
import { useTheme } from '../../providers';
import { Spinner } from '../../primitives/spinner';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Status metadata
// ---------------------------------------------------------------------------

const STATUS_META: Record<KeyExchangeStatus, { title: string; description: string }> = {
  pending: {
    title: 'Key Exchange Pending',
    description: 'Establishing an encrypted session. Messages will be encrypted once the exchange completes.',
  },
  active: {
    title: 'End-to-End Encrypted',
    description: 'Messages in this conversation are secured with end-to-end encryption.',
  },
  rotating: {
    title: 'Rotating Keys',
    description: 'Encryption keys are being rotated. This may take a moment.',
  },
  error: {
    title: 'Encryption Error',
    description: 'Key exchange failed. Messages cannot be encrypted.',
  },
};

function StatusIcon({ status, color, size = 16 }: { status: KeyExchangeStatus; color: string; size?: number }) {
  switch (status) {
    case 'active':
      return <ShieldCheck size={size} color={color} strokeWidth={2} />;
    case 'error':
      return <ShieldAlert size={size} color={color} strokeWidth={2} />;
    case 'rotating':
      return <RefreshCw size={size} color={color} strokeWidth={2} />;
    case 'pending':
    default:
      return <Shield size={size} color={color} strokeWidth={2} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const E2EEKeyExchangeUI = forwardRef<HTMLDivElement, E2EEKeyExchangeUIProps>(
  function E2EEKeyExchangeUI(
    {
      status,
      keyVersion,
      errorMessage,
      onRetry,
      onRotateKey,
      rotating = false,
      compact = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    // Skeleton state
    const skeletonContainerStyle = useMemo(
      () => buildE2EESkeletonStyle(theme),
      [theme],
    );
    const skeletonBar1 = useMemo(
      () => buildE2EESkeletonBarStyle('60%', theme),
      [theme],
    );
    const skeletonBar2 = useMemo(
      () => buildE2EESkeletonBarStyle('80%', theme),
      [theme],
    );

    if (skeleton) {
      return (
        <div
          ref={ref}
          role="status"
          aria-label="Loading encryption status"
          className={className}
          style={{ ...skeletonContainerStyle, ...userStyle } as React.CSSProperties}
          {...rest}
        >
          <div style={skeletonBar1 as React.CSSProperties} />
          <div style={skeletonBar2 as React.CSSProperties} />
        </div>
      );
    }

    const colors = useMemo(
      () => resolveE2EEColors(status, theme),
      [status, theme],
    );

    const containerStyle = useMemo(
      () => buildE2EEContainerStyle(colors, compact, theme),
      [colors, compact, theme],
    );

    const headerStyle = useMemo(
      () => buildE2EEHeaderStyle(compact, theme),
      [compact, theme],
    );

    const titleStyle = useMemo(
      () => buildE2EETitleStyle(colors, theme),
      [colors, theme],
    );

    const descriptionStyle = useMemo(
      () => buildE2EEDescriptionStyle(colors, theme),
      [colors, theme],
    );

    const badgeStyle = useMemo(
      () => buildE2EEBadgeStyle(colors, theme),
      [colors, theme],
    );

    const actionsStyle = useMemo(
      () => buildE2EEActionsStyle(theme),
      [theme],
    );

    const meta = STATUS_META[status];
    const displayDescription = status === 'error' && errorMessage ? errorMessage : meta.description;

    const buttonBaseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
      border: `1px solid ${colors.border}`,
      borderRadius: theme.radii.md,
      background: 'transparent',
      color: colors.text,
      fontSize: theme.typography.sizes.xs.fontSize,
      fontWeight: theme.typography.weights.medium,
      cursor: 'pointer',
      fontFamily: 'inherit',
    };

    return (
      <div
        ref={ref}
        role="status"
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle as React.CSSProperties}>
          <StatusIcon status={status} color={colors.icon} />
          <span style={titleStyle as React.CSSProperties}>{meta.title}</span>
          {keyVersion != null && (
            <span style={badgeStyle as React.CSSProperties}>v{keyVersion}</span>
          )}
        </div>

        {/* Description */}
        {!compact && (
          <p style={descriptionStyle as React.CSSProperties}>{displayDescription}</p>
        )}

        {/* Actions */}
        {!compact && (status === 'error' || status === 'active') && (
          <div style={actionsStyle as React.CSSProperties}>
            {status === 'error' && onRetry && (
              <button type="button" onClick={onRetry} style={buttonBaseStyle}>
                Retry
              </button>
            )}
            {status === 'active' && onRotateKey && (
              <button
                type="button"
                onClick={onRotateKey}
                disabled={rotating}
                style={{
                  ...buttonBaseStyle,
                  opacity: rotating ? 0.5 : 1,
                  cursor: rotating ? 'default' : 'pointer',
                }}
              >
                {rotating && <Spinner size="xs" />}
                {rotating ? 'Rotating...' : 'Rotate Key'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

E2EEKeyExchangeUI.displayName = 'E2EEKeyExchangeUI';
