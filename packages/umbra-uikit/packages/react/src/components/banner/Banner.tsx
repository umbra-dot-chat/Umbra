/**
 * @module Banner
 */
import React, { forwardRef, useMemo } from 'react';
import type { BannerProps } from '@coexist/wisp-core/types/Banner.types';
import {
  resolveBannerColors,
  buildBannerStyle,
  buildBannerTitleStyle,
  buildBannerMessageStyle,
  buildBannerDismissStyle,
} from '@coexist/wisp-core/styles/Banner.styles';
import { useTheme } from '../../providers';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

/**
 * Banner — Inline notification banner for the Wisp design system.
 *
 * @remarks
 * Displays an informational, success, warning, or danger message with
 * optional icon, title, action slot, and dismiss button.
 *
 * @example
 * ```tsx
 * <Banner variant="info" icon={Info} title="Update available">
 *   A new version is ready. Refresh to update.
 * </Banner>
 * <Banner variant="danger" dismissible onDismiss={() => {}}>
 *   Something went wrong. Please try again.
 * </Banner>
 * ```
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    children,
    title,
    variant = 'default',
    icon: Icon,
    action,
    dismissible = false,
    onDismiss,
    fullWidth = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const colors = useMemo(
    () => resolveBannerColors(variant, theme),
    [variant, theme],
  );

  const bannerStyle = useMemo(
    () => buildBannerStyle(colors, fullWidth, theme),
    [colors, fullWidth, theme],
  );
  const titleStyle = useMemo(
    () => buildBannerTitleStyle(colors, theme),
    [colors, theme],
  );
  const messageStyle = useMemo(
    () => buildBannerMessageStyle(colors, theme),
    [colors, theme],
  );
  const dismissStyle = useMemo(
    () => buildBannerDismissStyle(colors, theme),
    [colors, theme],
  );

  return (
    <div
      ref={ref}
      role="alert"
      className={className}
      style={{ ...bannerStyle, ...userStyle }}
      {...rest}
    >
      {/* Icon */}
      {Icon && (
        <div style={{ flexShrink: 0, marginTop: defaultSpacing['2xs'] }}>
          <Icon size={18} color={colors.icon} strokeWidth={2} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={titleStyle}>{title}</div>}
        <div style={messageStyle}>{children}</div>
      </div>

      {/* Action */}
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}

      {/* Dismiss */}
      {dismissible && (
        <button
          type="button"
          style={dismissStyle}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
});

Banner.displayName = 'Banner';
