import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  createContext,
  useContext,
} from 'react';
import { View, Text as RNText, Pressable, ScrollView } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import type { SidebarWidth, SidebarPosition, SidebarContextValue } from '@coexist/wisp-core/types/Sidebar.types';
import { sidebarWidthMap } from '@coexist/wisp-core/types/Sidebar.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (ctx === null) {
    throw new Error('[Wisp] SidebarSection and SidebarItem must be used within <Sidebar>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Sidebar Props
// ---------------------------------------------------------------------------

export interface SidebarProps {
  children?: React.ReactNode;
  /** Width variant. @default 'default' */
  width?: SidebarWidth;
  /** Whether the sidebar supports collapsing. @default false */
  collapsible?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Callback fired when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Which edge the sidebar is anchored to. @default 'left' */
  position?: SidebarPosition;
  style?: object;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export const Sidebar = forwardRef<View, SidebarProps>(function Sidebar(
  {
    children,
    width = 'default',
    collapsible = false,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    position = 'left',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const isControlled = controlledCollapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleCollapsedChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalCollapsed(next);
      onCollapsedChange?.(next);
    },
    [isControlled, onCollapsedChange],
  );

  const resolvedWidth = collapsible && collapsed ? 'collapsed' : width;
  const isNarrow = resolvedWidth === 'collapsed' || resolvedWidth === 'compact';

  const contextValue = useMemo<SidebarContextValue>(
    () => ({ collapsed: isNarrow, width: resolvedWidth }),
    [isNarrow, resolvedWidth],
  );

  const borderSide = position === 'left' ? 'borderRightWidth' : 'borderLeftWidth';

  return (
    <SidebarContext.Provider value={contextValue}>
      <View
        ref={ref}
        accessibilityRole="menu"
        style={[
          {
            width: sidebarWidthMap[resolvedWidth],
            height: '100%',
            backgroundColor: themeColors.background.surface,
            [borderSide]: 1,
            borderColor: themeColors.border.subtle,
            paddingVertical: defaultSpacing.sm,
          },
          userStyle,
        ]}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {collapsible && (
          <CollapseToggle
            collapsed={collapsed}
            onToggle={() => handleCollapsedChange(!collapsed)}
            themeColors={themeColors}
          />
        )}
      </View>
    </SidebarContext.Provider>
  );
});

Sidebar.displayName = 'Sidebar';

// ---------------------------------------------------------------------------
// CollapseToggle (internal)
// ---------------------------------------------------------------------------

function CollapseToggle({
  collapsed,
  onToggle,
  themeColors,
}: {
  collapsed: boolean;
  onToggle: () => void;
  themeColors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.sm,
        borderTopWidth: 1,
        borderTopColor: themeColors.border.subtle,
      }}
    >
      <Svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          transform: [{ rotate: collapsed ? '180deg' : '0deg' }],
        }}
      >
        <Polyline
          points="15 18 9 12 15 6"
          stroke={themeColors.text.onRaisedSecondary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SidebarSection Props
// ---------------------------------------------------------------------------

export interface SidebarSectionProps {
  children?: React.ReactNode;
  /** Optional section heading text. */
  title?: string;
  /** Whether the section can be collapsed. @default false */
  collapsible?: boolean;
  /** Whether the section starts collapsed. @default false */
  defaultCollapsed?: boolean;
  style?: object;
}

// ---------------------------------------------------------------------------
// SidebarSection
// ---------------------------------------------------------------------------

export const SidebarSection = forwardRef<View, SidebarSectionProps>(function SidebarSection(
  {
    children,
    title,
    collapsible = false,
    defaultCollapsed = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { collapsed: sidebarCollapsed } = useSidebarContext();
  const [sectionCollapsed, setSectionCollapsed] = useState(defaultCollapsed);

  const showTitle = title && !sidebarCollapsed;

  return (
    <View ref={ref} style={userStyle}>
      {showTitle && (
        <Pressable
          onPress={() => collapsible && setSectionCollapsed((prev) => !prev)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: defaultSpacing.lg,
            paddingTop: defaultSpacing.md,
            paddingBottom: defaultSpacing.xs,
          }}
        >
          <RNText
            style={{
              fontSize: defaultTypography.sizes.xs.fontSize,
              fontWeight: defaultTypography.weights.semibold,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: themeColors.text.onRaisedSecondary,
            }}
          >
            {title}
          </RNText>
          {collapsible && (
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: [{ rotate: sectionCollapsed ? '-90deg' : '0deg' }],
              }}
            >
              <Polyline
                points="6 9 12 15 18 9"
                stroke={themeColors.text.onRaisedSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </Pressable>
      )}
      {!sectionCollapsed && <View>{children}</View>}
    </View>
  );
});

SidebarSection.displayName = 'SidebarSection';

// ---------------------------------------------------------------------------
// SidebarItem Props
// ---------------------------------------------------------------------------

export interface SidebarItemProps {
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Navigation label text. */
  label: string;
  /** Whether this item is the active / current route. @default false */
  active?: boolean;
  /** Whether interaction is disabled. @default false */
  disabled?: boolean;
  /** Trailing badge or count node. */
  badge?: React.ReactNode;
  /** Press handler. */
  onPress?: () => void;
  style?: object;
}

// ---------------------------------------------------------------------------
// SidebarItem
// ---------------------------------------------------------------------------

export const SidebarItem = forwardRef<View, SidebarItemProps>(function SidebarItem(
  {
    icon,
    label,
    active = false,
    disabled = false,
    badge,
    onPress,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { collapsed: sidebarCollapsed, width: sidebarWidth } = useSidebarContext();

  const backgroundColor = active ? themeColors.accent.primary : 'transparent';
  const color = active ? themeColors.text.inverse : themeColors.text.onRaised;

  const horizontalMargin = 8;

  const baseStyle = useMemo(() => {
    if (sidebarCollapsed) {
      const squareSize = sidebarWidthMap[sidebarWidth] - horizontalMargin * 2;
      return {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        width: squareSize,
        height: squareSize,
        marginHorizontal: horizontalMargin,
        marginVertical: defaultSpacing['2xs'],
        borderRadius: defaultRadii.md,
        overflow: 'hidden' as const,
        backgroundColor,
        opacity: disabled ? 0.4 : 1,
      };
    }

    return {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      paddingVertical: defaultSpacing.sm,
      marginHorizontal: horizontalMargin,
      marginVertical: defaultSpacing['2xs'],
      borderRadius: defaultRadii.md,
      overflow: 'hidden' as const,
      backgroundColor,
      opacity: disabled ? 0.4 : 1,
    };
  }, [sidebarCollapsed, sidebarWidth, backgroundColor, disabled]);

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ selected: active, disabled }}
      style={[baseStyle, userStyle]}
    >
      {icon && (
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color })
            : icon}
        </View>
      )}
      {!sidebarCollapsed && (
        <RNText
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: defaultTypography.sizes.sm.fontSize,
            fontWeight: defaultTypography.weights.medium,
            color,
          }}
        >
          {label}
        </RNText>
      )}
      {!sidebarCollapsed && badge && (
        <View style={{ marginLeft: 'auto', flexShrink: 0 }}>{badge}</View>
      )}
    </Pressable>
  );
});

SidebarItem.displayName = 'SidebarItem';
