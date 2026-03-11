/**
 * @module components/screen-share-picker
 * @description React Native ScreenSharePicker for the Wisp design system.
 *
 * A modal dialog for selecting which screen/window/tab to share.
 * Reuses types from `@coexist/wisp-core`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  ScreenShareSource,
  ScreenShareSourceType,
} from '@coexist/wisp-core/types/ScreenSharePicker.types';
import { screenShareSourceTypes } from '@coexist/wisp-core/types/ScreenSharePicker.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScreenSharePickerProps extends ViewProps {
  open: boolean;
  onClose: () => void;
  sources?: ScreenShareSource[];
  onSelect?: (sourceId: string) => void;
  title?: string;
  loading?: boolean;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Tab labels
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<ScreenShareSourceType, string> = {
  screen: 'Screens',
  window: 'Windows',
  tab: 'Tabs',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ScreenSharePicker = forwardRef<View, ScreenSharePickerProps>(
  function ScreenSharePicker(
    {
      open,
      onClose,
      sources = [],
      onSelect,
      title = 'Share Your Screen',
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<ScreenShareSourceType>('screen');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredSources = useMemo(
      () => sources.filter((s) => s.type === activeTab),
      [sources, activeTab],
    );

    const availableTabs = useMemo(() => {
      const tabsWithSources = new Set(sources.map((s) => s.type));
      return sources.length > 0
        ? screenShareSourceTypes.filter((t) => tabsWithSources.has(t))
        : (['screen'] as const);
    }, [sources]);

    const handleSelect = useCallback(
      (sourceId: string) => {
        setSelectedId(sourceId);
        onSelect?.(sourceId);
      },
      [onSelect],
    );

    return (
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={overlayStyle}>
          <View
            ref={ref}
            style={[
              dialogStyle,
              {
                backgroundColor: theme.colors.background.raised,
                borderColor: theme.colors.border.subtle,
              },
              userStyle,
            ]}
            {...rest}
          >
            {/* Header */}
            <View style={[headerStyle, { borderBottomColor: theme.colors.border.subtle }]}>
              <Text style={[titleStyle, { color: theme.colors.text.primary }]}>{title}</Text>
              <Pressable onPress={onClose} style={closeButtonStyle} accessibilityLabel="Close">
                <Text style={{ color: theme.colors.text.muted, fontSize: 18 }}>X</Text>
              </Pressable>
            </View>

            {/* Tabs */}
            <View style={[tabBarStyle, { borderBottomColor: theme.colors.border.subtle }]}>
              {availableTabs.map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    tabStyle,
                    activeTab === tab && {
                      borderBottomColor: theme.colors.text.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tabTextStyle,
                      {
                        color: activeTab === tab
                          ? theme.colors.text.primary
                          : theme.colors.text.muted,
                      },
                    ]}
                  >
                    {TAB_LABELS[tab]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Content */}
            <ScrollView style={contentStyle} contentContainerStyle={contentContainerStyle}>
              {skeleton && (
                <View style={sourceGridStyle}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[skeletonCardStyle, { backgroundColor: theme.colors.border.subtle }]}
                    />
                  ))}
                </View>
              )}

              {!skeleton && loading && (
                <View style={loadingContainerStyle}>
                  <Text style={{ color: theme.colors.text.muted, fontSize: 14 }}>
                    Loading available sources...
                  </Text>
                </View>
              )}

              {!skeleton && !loading && (
                <View style={sourceGridStyle}>
                  {filteredSources.length === 0 && (
                    <View style={loadingContainerStyle}>
                      <Text style={{ color: theme.colors.text.muted, fontSize: 14 }}>
                        No {TAB_LABELS[activeTab].toLowerCase()} available
                      </Text>
                    </View>
                  )}
                  {filteredSources.map((source) => (
                    <Pressable
                      key={source.id}
                      onPress={() => handleSelect(source.id)}
                      style={[
                        sourceCardStyle,
                        {
                          borderColor: selectedId === source.id
                            ? theme.colors.text.primary
                            : theme.colors.border.subtle,
                          borderWidth: selectedId === source.id ? 2 : 1,
                          backgroundColor: selectedId === source.id
                            ? theme.colors.background.sunken
                            : 'transparent',
                        },
                      ]}
                      accessibilityLabel={source.name}
                    >
                      <View style={[thumbnailStyle, { backgroundColor: theme.colors.background.sunken }]}>
                        {source.thumbnail ? (source.thumbnail as React.ReactElement) : (
                          <Text style={{ color: theme.colors.text.muted, fontSize: 24 }}>S</Text>
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[sourceNameStyle, { color: theme.colors.text.secondary }]}
                      >
                        {source.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

ScreenSharePicker.displayName = 'ScreenSharePicker';

// ---------------------------------------------------------------------------
// Static styles
// ---------------------------------------------------------------------------

const overlayStyle: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const dialogStyle: ViewStyle = {
  width: '100%',
  maxWidth: 640,
  maxHeight: '80%',
  borderRadius: 16,
  borderWidth: 1,
  overflow: 'hidden',
};

const headerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
};

const titleStyle: TextStyle = {
  fontSize: 16,
  fontWeight: '600',
};

const closeButtonStyle: ViewStyle = {
  padding: 4,
};

const tabBarStyle: ViewStyle = {
  flexDirection: 'row',
  paddingHorizontal: 20,
  borderBottomWidth: 1,
};

const tabStyle: ViewStyle = {
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderBottomWidth: 2,
  borderBottomColor: 'transparent',
};

const tabTextStyle: TextStyle = {
  fontSize: 13,
  fontWeight: '500',
};

const contentStyle: ViewStyle = {
  flex: 1,
};

const contentContainerStyle: ViewStyle = {
  padding: 20,
};

const sourceGridStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
};

const sourceCardStyle: ViewStyle = {
  width: '47%',
  borderRadius: 12,
  padding: 8,
  gap: 8,
};

const thumbnailStyle: ViewStyle = {
  width: '100%',
  aspectRatio: 16 / 9,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const sourceNameStyle: TextStyle = {
  fontSize: 12,
  fontWeight: '500',
  textAlign: 'center',
};

const loadingContainerStyle: ViewStyle = {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
};

const skeletonCardStyle: ViewStyle = {
  width: '47%',
  height: 120,
  borderRadius: 12,
};
