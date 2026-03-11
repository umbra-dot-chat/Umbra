/**
 * @module ConversationView
 * @description A wrapper component that provides the E2EE status banner above
 * the message area for both DM chats and community channels.
 *
 * @remarks
 * ConversationView renders an E2EEKeyExchangeUI compact banner at the top
 * when `encrypted` is true. It accepts children that represent the
 * conversation body (messages, typing indicators, input, etc.).
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
import type { ConversationViewProps } from '@coexist/wisp-core/types/ConversationView.types';
import { useTheme } from '../../providers';
import { E2EEKeyExchangeUI } from '../e2ee-key-exchange-ui';

export type { ConversationViewProps };

export const ConversationView = forwardRef<HTMLDivElement, ConversationViewProps & React.HTMLAttributes<HTMLDivElement>>(
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
    const { theme } = useTheme();

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          ...style,
        }}
        {...rest}
      >
        {/* E2EE status banner — compact, at the top of the conversation */}
        {encrypted && (
          <div style={{ padding: `${theme.spacing.xs}px ${theme.spacing.md}px` }}>
            <E2EEKeyExchangeUI
              status={e2eeStatus}
              keyVersion={e2eeKeyVersion}
              errorMessage={e2eeErrorMessage}
              onRetry={onE2eeRetry}
              onRotateKey={onE2eeRotateKey}
              rotating={e2eeRotating}
              compact
            />
          </div>
        )}

        {/* Conversation body */}
        {children}
      </div>
    );
  },
);

ConversationView.displayName = 'ConversationView';
