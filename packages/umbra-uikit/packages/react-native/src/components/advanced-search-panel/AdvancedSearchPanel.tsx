/**
 * @module components/advanced-search-panel
 * @description React Native AdvancedSearchPanel for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveAdvancedSearchPanelColors,
} from '@coexist/wisp-core/styles/AdvancedSearchPanel.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AdvancedSearchFilters {
  query?: string;
  fromUser?: string;
  inChannel?: string;
  before?: string;
  after?: string;
  hasFile?: boolean;
  hasReaction?: boolean;
  isPinned?: boolean;
}

export interface AdvancedSearchPanelProps extends ViewProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  onSearch?: () => void;
  onReset?: () => void;
  channels?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string }>;
  loading?: boolean;
  resultCount?: number;
  title?: string;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// AdvancedSearchPanel
// ---------------------------------------------------------------------------

export const AdvancedSearchPanel = forwardRef<View, AdvancedSearchPanelProps>(
  function AdvancedSearchPanel(
    {
      filters,
      onFiltersChange,
      onSearch,
      onReset,
      channels,
      users,
      loading = false,
      resultCount,
      title = 'Advanced Search',
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const panelColors = useMemo(
      () => resolveAdvancedSearchPanelColors(theme),
      [theme],
    );

    const update = useCallback(
      (patch: Partial<AdvancedSearchFilters>) => {
        onFiltersChange({ ...filters, ...patch });
      },
      [filters, onFiltersChange],
    );

    const containerStyle: ViewStyle = {
      gap: defaultSpacing.lg,
      padding: defaultSpacing.lg,
      backgroundColor: panelColors.bg,
      borderWidth: 1,
      borderColor: panelColors.border,
      borderRadius: defaultRadii.lg,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    };

    const titleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.lg.fontSize,
      lineHeight: defaultTypography.sizes.lg.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: panelColors.headerText,
    };

    const labelTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: panelColors.labelText,
    };

    const inputStyle: ViewStyle & TextStyle = {
      borderWidth: 1,
      borderColor: panelColors.border,
      borderRadius: defaultRadii.md,
      padding: defaultSpacing.sm,
      backgroundColor: theme.colors.background.sunken,
      color: theme.colors.text.primary,
      fontSize: defaultTypography.sizes.sm.fontSize,
    };

    const fieldGroupStyle: ViewStyle = {
      gap: defaultSpacing.xs,
    };

    const toggleRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.lg,
      flexWrap: 'wrap',
    };

    const toggleItemStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
    };

    const buttonRowStyle: ViewStyle = {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: defaultSpacing.sm,
      borderTopWidth: 1,
      borderTopColor: panelColors.border,
      paddingTop: defaultSpacing.sm,
    };

    const buttonStyle: ViewStyle = {
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: theme.colors.accent.primary,
    };

    const secondaryButtonStyle: ViewStyle = {
      ...buttonStyle,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: panelColors.border,
    };

    const badgeStyle: ViewStyle = {
      paddingHorizontal: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      borderRadius: defaultRadii.full,
      backgroundColor: panelColors.resultBadgeBg,
    };

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleTextStyle}>{title}</Text>
          {resultCount !== undefined && (
            <View style={badgeStyle}>
              <Text style={{ ...labelTextStyle, color: panelColors.resultBadgeText }}>
                {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Fields */}
        <ScrollView>
          <View style={fieldGroupStyle}>
            <Text style={labelTextStyle}>Search query</Text>
            <TextInput
              style={inputStyle}
              placeholder="Enter search terms..."
              placeholderTextColor={theme.colors.text.muted}
              value={filters.query ?? ''}
              onChangeText={(text) => update({ query: text })}
              editable={!loading}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: defaultSpacing.md, marginTop: defaultSpacing.md }}>
            <View style={[fieldGroupStyle, { flex: 1 }]}>
              <Text style={labelTextStyle}>From user</Text>
              <TextInput
                style={inputStyle}
                placeholder="Username"
                placeholderTextColor={theme.colors.text.muted}
                value={filters.fromUser ?? ''}
                onChangeText={(text) => update({ fromUser: text })}
                editable={!loading}
              />
            </View>
            <View style={[fieldGroupStyle, { flex: 1 }]}>
              <Text style={labelTextStyle}>In channel</Text>
              <TextInput
                style={inputStyle}
                placeholder="Channel name"
                placeholderTextColor={theme.colors.text.muted}
                value={filters.inChannel ?? ''}
                onChangeText={(text) => update({ inChannel: text })}
                editable={!loading}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: defaultSpacing.md, marginTop: defaultSpacing.md }}>
            <View style={[fieldGroupStyle, { flex: 1 }]}>
              <Text style={labelTextStyle}>Before date</Text>
              <TextInput
                style={inputStyle}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.muted}
                value={filters.before ?? ''}
                onChangeText={(text) => update({ before: text })}
                editable={!loading}
              />
            </View>
            <View style={[fieldGroupStyle, { flex: 1 }]}>
              <Text style={labelTextStyle}>After date</Text>
              <TextInput
                style={inputStyle}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.muted}
                value={filters.after ?? ''}
                onChangeText={(text) => update({ after: text })}
                editable={!loading}
              />
            </View>
          </View>
        </ScrollView>

        {/* Toggles */}
        <View style={toggleRowStyle}>
          <View style={toggleItemStyle}>
            <Switch
              value={filters.hasFile ?? false}
              onValueChange={(val) => update({ hasFile: val })}
              disabled={loading}
            />
            <Text style={labelTextStyle}>Has file</Text>
          </View>
          <View style={toggleItemStyle}>
            <Switch
              value={filters.hasReaction ?? false}
              onValueChange={(val) => update({ hasReaction: val })}
              disabled={loading}
            />
            <Text style={labelTextStyle}>Has reaction</Text>
          </View>
          <View style={toggleItemStyle}>
            <Switch
              value={filters.isPinned ?? false}
              onValueChange={(val) => update({ isPinned: val })}
              disabled={loading}
            />
            <Text style={labelTextStyle}>Is pinned</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={buttonRowStyle}>
          {onReset && (
            <Pressable
              onPress={onReset}
              disabled={loading}
              style={secondaryButtonStyle}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.colors.text.primary, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Reset
              </Text>
            </Pressable>
          )}
          {onSearch && (
            <Pressable
              onPress={onSearch}
              disabled={loading}
              style={buttonStyle}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.colors.text.inverse, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Search
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

AdvancedSearchPanel.displayName = 'AdvancedSearchPanel';
