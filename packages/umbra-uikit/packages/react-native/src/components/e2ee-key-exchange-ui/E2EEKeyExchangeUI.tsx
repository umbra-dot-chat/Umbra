/**
 * @module E2EEKeyExchangeUI
 * @description React Native E2EE key exchange status banner/card for the Wisp design system.
 *
 * @remarks
 * Displays the current state of end-to-end encryption key exchange,
 * including pending, active, rotating, and error states. Supports both
 * a full card layout and a compact banner variant.
 *
 * Uses the Umbra E2EE protocol:
 * - X25519 ECDH for initial key exchange
 * - AES-256-GCM for message encryption
 * - HKDF-SHA256 for key derivation
 * - Ed25519 for message signing
 *
 * Status states:
 * - **pending**: Initial key exchange in progress (e.g. new conversation, reconnecting)
 * - **active**: Encryption fully operational after successful ECDH exchange
 * - **rotating**: Group key rotation in progress (after member removal)
 * - **error**: Key exchange failed (network issue, peer offline, crypto failure)
 *
 * Key rotation (groups only): When a member is removed, the admin generates
 * a new AES-256 group key, increments `keyVersion`, and distributes the new
 * key to all remaining members. Old members cannot decrypt new messages.
 *
 * @example
 * ```tsx
 * // Active encryption with key version badge
 * <E2EEKeyExchangeUI status="active" keyVersion={3} onRotateKey={rotateGroupKey} />
 *
 * // Error state with retry
 * <E2EEKeyExchangeUI status="error" errorMessage="Peer did not respond" onRetry={retryExchange} />
 *
 * // Compact banner for channel headers
 * <E2EEKeyExchangeUI status="active" keyVersion={1} compact />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText, ActivityIndicator } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { KeyExchangeStatus } from '@coexist/wisp-core/types/E2EEKeyExchangeUI.types';
import { resolveE2EEColors } from '@coexist/wisp-core/styles/E2EEKeyExchangeUI.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface E2EEKeyExchangeUIProps extends ViewProps {
  /** Current key exchange status. */
  status: KeyExchangeStatus;
  /** Current key version number (groups only). Displays as "v{n}" badge. */
  keyVersion?: number;
  /** Error message (when status is 'error'). Overrides the default description. */
  errorMessage?: string;
  /** Called when retry is clicked (on error). */
  onRetry?: () => void;
  /** Called when rotate key is clicked (active state, groups only). */
  onRotateKey?: () => void;
  /** Whether key rotation is in progress. @default false */
  rotating?: boolean;
  /** Show as a compact single-row banner instead of a full card. @default false */
  compact?: boolean;
  /** Skeleton loading state. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons (matching lucide-react icons from the DOM version)
// ---------------------------------------------------------------------------

/** Shield — pending / default state. */
function ShieldIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Svg>
  );
}

/** ShieldCheck — active / encrypted state. */
function ShieldCheckIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

/** ShieldAlert — error state. */
function ShieldAlertIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="M12 8v4" />
      <Path d="M12 16h.01" />
    </Svg>
  );
}

/** RefreshCw — rotating state. */
function RefreshCwIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <Path d="M21 3v5h-5" />
      <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <Path d="M8 16H3v5" />
    </Svg>
  );
}

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

function StatusIcon({ status, color, size = 18 }: { status: KeyExchangeStatus; color: string; size?: number }) {
  switch (status) {
    case 'active':
      return <ShieldCheckIcon size={size} color={color} />;
    case 'error':
      return <ShieldAlertIcon size={size} color={color} />;
    case 'rotating':
      return <RefreshCwIcon size={size} color={color} />;
    case 'pending':
    default:
      return <ShieldIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function E2EESkeleton({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const containerStyle: ViewStyle = {
    gap: defaultSpacing.sm,
    padding: defaultSpacing.lg,
    borderRadius: defaultRadii.lg,
    backgroundColor: tc.background.sunken,
    borderWidth: 1,
    borderColor: tc.border.subtle,
  };

  const barBase: ViewStyle = {
    height: 12,
    borderRadius: defaultRadii.sm,
    backgroundColor: tc.border.subtle,
    opacity: 0.5,
  };

  return (
    <View accessibilityLabel="Loading encryption status" style={[containerStyle, style]}>
      <View style={[barBase, { width: '60%' }]} />
      <View style={[barBase, { width: '80%' }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const E2EEKeyExchangeUI = forwardRef<View, E2EEKeyExchangeUIProps>(
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
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveE2EEColors(status, theme),
      [status, theme],
    );

    // -- Skeleton early return -------------------------------------------------

    if (skeleton) {
      return <E2EESkeleton style={userStyle as ViewStyle} />;
    }

    // -- Styles ----------------------------------------------------------------

    const containerStyle: ViewStyle = {
      flexDirection: compact ? 'row' : 'column',
      alignItems: compact ? 'center' : 'flex-start',
      gap: compact ? defaultSpacing.sm : defaultSpacing.md,
      padding: compact ? defaultSpacing.sm : defaultSpacing.lg,
      paddingHorizontal: compact ? defaultSpacing.md : defaultSpacing.lg,
      borderRadius: defaultRadii.lg,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      ...(compact ? { flex: 1 } : {}),
    };

    const titleStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.text,
    };

    const descriptionStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: 18,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.text,
      opacity: 0.85,
    };

    const badgeStyle: ViewStyle = {
      borderWidth: 1,
      borderColor: colors.badge,
      borderRadius: defaultRadii.full,
      paddingHorizontal: defaultSpacing.sm,
      paddingVertical: defaultSpacing['2xs'],
    };

    const badgeTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.badge,
    };

    const buttonStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: defaultRadii.md,
    };

    const buttonTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.text,
    };

    const meta = STATUS_META[status];
    const displayDescription = status === 'error' && errorMessage ? errorMessage : meta.description;

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={`${meta.title}${keyVersion != null ? `, version ${keyVersion}` : ''}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header: icon + title + optional key version badge */}
        <View style={headerStyle}>
          <StatusIcon status={status} color={colors.icon} />
          <RNText style={titleStyle}>{meta.title}</RNText>
          {keyVersion != null && (
            <View style={badgeStyle}>
              <RNText style={badgeTextStyle}>v{keyVersion}</RNText>
            </View>
          )}
        </View>

        {/* Description (card mode only) */}
        {!compact && (
          <RNText style={descriptionStyle}>{displayDescription}</RNText>
        )}

        {/* Actions (card mode only, status-dependent) */}
        {!compact && (status === 'error' || status === 'active') && (
          <View style={{ flexDirection: 'row', gap: defaultSpacing.sm }}>
            {status === 'error' && onRetry && (
              <Pressable
                onPress={onRetry}
                style={buttonStyle}
                accessibilityRole="button"
                accessibilityLabel="Retry key exchange"
              >
                <RefreshCwIcon size={14} color={colors.text} />
                <RNText style={buttonTextStyle}>Retry</RNText>
              </Pressable>
            )}
            {status === 'active' && onRotateKey && (
              <Pressable
                onPress={onRotateKey}
                disabled={rotating}
                style={[buttonStyle, { opacity: rotating ? 0.5 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={rotating ? 'Rotating encryption keys' : 'Rotate encryption key'}
              >
                {rotating && <ActivityIndicator size="small" color={colors.text} />}
                <RNText style={buttonTextStyle}>
                  {rotating ? 'Rotating...' : 'Rotate Key'}
                </RNText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  },
);

E2EEKeyExchangeUI.displayName = 'E2EEKeyExchangeUI';
