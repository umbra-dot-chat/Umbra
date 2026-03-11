/**
 * @module ConversationView
 * @description React Native wrapper component providing the E2EE status banner
 * above the message area for both DM chats and community channels.
 *
 * @remarks
 * ConversationView renders a compact E2EEKeyExchangeUI banner at the top
 * when `encrypted` is true. It wraps the conversation body (messages,
 * typing indicators, input, etc.) in a flex column.
 *
 * Works identically in both chat (DM/group) and community (channel) contexts.
 *
 * @example
 * ```tsx
 * <ConversationView encrypted e2eeStatus="active" e2eeKeyVersion={3}>
 *   <MessageList entries={entries} />
 *   <MessageInput onSubmit={handleSend} />
 * </ConversationView>
 * ```
 */
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import type { KeyExchangeStatus } from '@coexist/wisp-core/types/E2EEKeyExchangeUI.types';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { E2EEKeyExchangeUI } from '../e2ee-key-exchange-ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationViewProps extends ViewProps {
  /** Whether the conversation/channel uses end-to-end encryption. @default false */
  encrypted?: boolean;

  /** Current E2EE key exchange status. Shown when `encrypted` is true. @default 'active' */
  e2eeStatus?: KeyExchangeStatus;

  /** Current key version number for the E2EE badge. */
  e2eeKeyVersion?: number;

  /** Error message to display in the E2EE banner when status is 'error'. */
  e2eeErrorMessage?: string;

  /** Called when the E2EE retry button is pressed (error state). */
  onE2eeRetry?: () => void;

  /** Called when the E2EE key rotation button is pressed (active state). */
  onE2eeRotateKey?: () => void;

  /** Whether E2EE key rotation is in progress. @default false */
  e2eeRotating?: boolean;

  /** Children are rendered as the conversation body (messages, input, etc.). */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ConversationView = forwardRef<View, ConversationViewProps>(
  function ConversationView(
    {
      encrypted = false,
      e2eeStatus = 'active',
      e2eeKeyVersion,
      e2eeErrorMessage,
      onE2eeRetry,
      onE2eeRotateKey,
      e2eeRotating = false,
      children,
      style,
      ...rest
    },
    ref,
  ) {
    const containerStyle: ViewStyle = {
      flex: 1,
      flexDirection: 'column',
      minHeight: 0,
    };

    const bannerWrapperStyle: ViewStyle = {
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.xs,
    };

    return (
      <View ref={ref} style={[containerStyle, style as ViewStyle]} {...rest}>
        {/* E2EE status banner — compact, at the top of the conversation */}
        {encrypted && (
          <View style={bannerWrapperStyle}>
            <E2EEKeyExchangeUI
              status={e2eeStatus}
              keyVersion={e2eeKeyVersion}
              errorMessage={e2eeErrorMessage}
              onRetry={onE2eeRetry}
              onRotateKey={onE2eeRotateKey}
              rotating={e2eeRotating}
              compact
            />
          </View>
        )}

        {/* Conversation body */}
        {children}
      </View>
    );
  },
);

ConversationView.displayName = 'ConversationView';
