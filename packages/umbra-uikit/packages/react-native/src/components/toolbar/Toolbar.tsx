import React, { forwardRef, useMemo, createContext, useContext } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ToolbarSizeConfig, ToolbarSize, ToolbarVariant } from '@coexist/wisp-core/types/Toolbar.types';
import { toolbarSizeMap } from '@coexist/wisp-core/types/Toolbar.types';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ToolbarContextValue {
  sizeConfig: ToolbarSizeConfig;
}

const ToolbarContext = createContext<ToolbarContextValue>({
  sizeConfig: toolbarSizeMap.md,
});

function useToolbarContext(): ToolbarContextValue {
  return useContext(ToolbarContext);
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

export interface ToolbarProps {
  children?: React.ReactNode;
  size?: ToolbarSize;
  variant?: ToolbarVariant;
  style?: ViewStyle;
}

export const Toolbar = forwardRef<View, ToolbarProps>(function Toolbar(
  {
    children,
    size = 'md',
    variant = 'elevated',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = toolbarSizeMap[size];

  const toolbarStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingX,
      gap: sizeConfig.gap,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          backgroundColor: themeColors.background.raised,
          borderRadius: defaultRadii.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 2,
        };
      case 'pill':
        return {
          ...base,
          backgroundColor: themeColors.background.raised,
          borderRadius: sizeConfig.height / 2,
        };
      case 'transparent':
      default:
        return {
          ...base,
          backgroundColor: 'transparent',
        };
    }
  }, [sizeConfig, variant, themeColors]);

  const ctxValue = useMemo<ToolbarContextValue>(
    () => ({ sizeConfig }),
    [sizeConfig],
  );

  return (
    <ToolbarContext.Provider value={ctxValue}>
      <View
        ref={ref}
        accessibilityRole="toolbar"
        style={[toolbarStyle, userStyle]}
      >
        {children}
      </View>
    </ToolbarContext.Provider>
  );
});

Toolbar.displayName = 'Toolbar';

// ---------------------------------------------------------------------------
// ToolbarGroup
// ---------------------------------------------------------------------------

const spacingMap: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export interface ToolbarGroupProps {
  children?: React.ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const ToolbarGroup = forwardRef<View, ToolbarGroupProps>(function ToolbarGroup(
  {
    children,
    gap = 'xs',
    style: userStyle,
  },
  ref,
) {
  const groupStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingMap[gap] ?? 4,
    }),
    [gap],
  );

  return (
    <View ref={ref} accessibilityRole="none" style={[groupStyle, userStyle]}>
      {children}
    </View>
  );
});

ToolbarGroup.displayName = 'ToolbarGroup';

// ---------------------------------------------------------------------------
// ToolbarSeparator
// ---------------------------------------------------------------------------

export interface ToolbarSeparatorProps {
  style?: ViewStyle;
}

export const ToolbarSeparator = forwardRef<View, ToolbarSeparatorProps>(
  function ToolbarSeparator({ style: userStyle }, ref) {
    const { theme } = useTheme();
    const { sizeConfig } = useToolbarContext();
    const themeColors = theme.colors;

    const separatorStyle = useMemo<ViewStyle>(
      () => ({
        width: 1,
        height: sizeConfig.separatorHeight,
        backgroundColor: themeColors.border.subtle,
        marginHorizontal: defaultSpacing.xs,
      }),
      [sizeConfig, themeColors],
    );

    return <View ref={ref} style={[separatorStyle, userStyle]} />;
  },
);

ToolbarSeparator.displayName = 'ToolbarSeparator';
