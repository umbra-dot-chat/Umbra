/**
 * @module primitives/toast
 * @description React Native Toast primitive for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` instead of `<div>` and `<Pressable>` instead of `<button>`.
 * - Uses `<Text>` from `../text` instead of `<p>` elements.
 * - Dismiss icon rendered as a text glyph instead of `lucide-react` `<X />`.
 * - No CSS `transition`, `cursor`, or `fontFamily` stack.
 * - No `className`, `surface` (glass), or mouse event props.
 */

import React, { forwardRef, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ToastVariant } from '@coexist/wisp-core/types/Toast.types';
import { resolveToastColors } from '@coexist/wisp-core/styles/Toast.styles';
import type { ToastColors } from '@coexist/wisp-core/styles/Toast.styles';
import { Text } from '../text';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToastProps extends Omit<ViewProps, 'children'> {
  /**
   * Semantic color variant applied to background, border, and text.
   * @default 'default'
   */
  variant?: ToastVariant;

  /** Primary notification text (required). */
  title: string;

  /** Optional secondary description text displayed below the title. */
  description?: string;

  /** Optional children rendered inside the content column. */
  children?: React.ReactNode;

  /** Optional leading icon element rendered before the content column. */
  icon?: React.ReactNode;

  /** Optional trailing action element (e.g. a Button) rendered after the content. */
  action?: React.ReactNode;

  /** Callback fired when the dismiss button is pressed. */
  onDismiss?: () => void;

  /**
   * Whether the dismiss button is rendered when {@link ToastProps.onDismiss} is provided.
   * @default true
   */
  dismissible?: boolean;

  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Toast -- Notification banner primitive for the Wisp design system.
 *
 * @remarks
 * Renders an alert-role notification with a title, optional description,
 * optional leading icon, optional trailing action slot, and a dismissible
 * close button. Key features:
 *
 * - Five semantic variants: `default`, `success`, `warning`, `danger`, `info`.
 * - Optional leading icon via {@link ToastProps.icon}.
 * - Optional action slot (e.g. a Button) via {@link ToastProps.action}.
 * - Dismiss button via {@link ToastProps.onDismiss}.
 * - Controlled visibility through {@link ToastProps.dismissible}.
 *
 * @example
 * ```tsx
 * <Toast variant="success" title="Saved" description="Your changes were saved." />
 * <Toast variant="danger" title="Error" onDismiss={() => close()} />
 * <Toast
 *   variant="info"
 *   title="Update available"
 *   action={<Button size="sm">Update</Button>}
 * />
 * ```
 */
export const Toast = forwardRef<View, ToastProps>(function Toast(
  {
    variant = 'default',
    title,
    description,
    children,
    icon,
    action,
    onDismiss,
    dismissible = true,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const colors: ToastColors = useMemo(
    () => resolveToastColors(variant, theme),
    [variant, themeColors],
  );

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: defaultSpacing.md,
    paddingVertical: defaultSpacing.md,
    paddingHorizontal: defaultSpacing.md,
    borderRadius: defaultRadii.lg,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  }), [colors]);

  const iconWrapperStyle = useMemo<ViewStyle>(() => ({
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }), []);

  const contentStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    gap: defaultSpacing['2xs'],
  }), []);

  const titleStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 20,
    fontWeight: defaultTypography.weights.medium,
    color: colors.text,
  }), [colors]);

  const descriptionStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 18,
    fontWeight: defaultTypography.weights.regular,
    color: colors.description,
  }), [colors]);

  const actionWrapperStyle = useMemo<ViewStyle>(() => ({
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }), []);

  const dismissButtonStyle = useMemo<ViewStyle>(() => ({
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: defaultRadii.sm,
  }), []);

  const dismissTextStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.base.fontSize,
    lineHeight: 18,
    color: colors.dismiss,
  }), [colors]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <View
      ref={ref}
      accessibilityRole="alert"
      style={[containerStyle, userStyle]}
      {...rest}
    >
      {icon && <View style={iconWrapperStyle}>{icon}</View>}

      <View style={contentStyle}>
        <Text style={titleStyle}>{title}</Text>
        {description && <Text style={descriptionStyle}>{description}</Text>}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text style={descriptionStyle}>{children}</Text>
        ) : (
          children
        )}
      </View>

      {action && <View style={actionWrapperStyle}>{action}</View>}

      {dismissible && onDismiss && (
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => [
            dismissButtonStyle,
            pressed ? { opacity: 0.7 } : undefined,
          ]}
        >
          <Text style={dismissTextStyle}>{'\u2715'}</Text>
        </Pressable>
      )}
    </View>
  );
});

Toast.displayName = 'Toast';
