/**
 * @module components/notification-group
 * @description Web NotificationGroup for the Wisp design system.
 */

import React, { forwardRef, useMemo, type CSSProperties } from 'react';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { resolveNotificationGroupColors } from '@coexist/wisp-core/styles/NotificationGroup.styles';
import type { NotificationGroupProps } from '@coexist/wisp-core/types/NotificationGroup.types';
import { useTheme } from '../../providers';

export const NotificationGroup = forwardRef<HTMLDivElement, NotificationGroupProps>(
  function NotificationGroup({ label, count, children, style: userStyle }, ref) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveNotificationGroupColors(theme), [theme]);

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: defaultSpacing.xs, ...(userStyle as CSSProperties) }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            padding: `${defaultSpacing.md}px ${defaultSpacing.md}px ${defaultSpacing.xs}px`,
          }}
        >
          <span
            style={{
              fontSize: defaultTypography.sizes.xs.fontSize,
              lineHeight: `${defaultTypography.sizes.xs.lineHeight}px`,
              fontWeight: defaultTypography.weights.semibold,
              color: colors.labelText,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </span>
          {count != null && count > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: colors.countBg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingInline: 5,
                fontSize: 10,
                fontWeight: defaultTypography.weights.semibold,
                color: colors.countText,
              }}
            >
              {count}
            </span>
          )}
          <div style={{ flex: 1, height: 1, background: colors.separator }} />
        </div>

        {/* Notification items */}
        {children}
      </div>
    );
  },
);

NotificationGroup.displayName = 'NotificationGroup';
