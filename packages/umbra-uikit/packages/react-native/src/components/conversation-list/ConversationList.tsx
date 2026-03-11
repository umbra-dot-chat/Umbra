/**
 * @module components/conversation-list
 * @description Scrollable conversation list for the Wisp design system.
 *
 * Wraps children (typically `ConversationListItem` elements) in a scrollable
 * container with optional header slot for search/filters.
 */

import React, { forwardRef } from 'react';
import { View, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConversationListProps extends ViewProps {
  /** Content rendered above the scrollable list (e.g. SearchInput). */
  header?: React.ReactNode;
  /** Conversation items to render inside the scrollable area. */
  children?: React.ReactNode;
  /** Maximum height of the scrollable area. Defaults to flex: 1. */
  maxHeight?: number;
}

// ---------------------------------------------------------------------------
// ConversationList
// ---------------------------------------------------------------------------

export const ConversationList = forwardRef<View, ConversationListProps>(
  function ConversationList(
    { header, children, maxHeight, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle: ViewStyle = {
      flex: maxHeight ? undefined : 1,
      maxHeight,
      backgroundColor: theme.colors.background.canvas,
    };

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {header && (
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            {header}
          </View>
        )}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  },
);

ConversationList.displayName = 'ConversationList';
