/**
 * @module NewMessageDivider
 */
import React, { forwardRef, useMemo } from 'react';
import type { NewMessageDividerProps } from '@coexist/wisp-core/types/NewMessageDivider.types';
import {
  buildNewMessageDividerStyle,
  buildLineStyle,
  buildLabelStyle,
} from '@coexist/wisp-core/styles/NewMessageDivider.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';

/**
 * NewMessageDivider — Marks the boundary between read and unread messages.
 *
 * @remarks
 * Renders a horizontal colored line with a centered label (e.g. "New").
 * Defaults to the theme's danger/red color for high visibility.
 *
 * @example
 * ```tsx
 * <NewMessageDivider />
 *
 * <NewMessageDivider label="3 new messages" color="#6366f1" />
 * ```
 */
export const NewMessageDivider = forwardRef<HTMLDivElement, NewMessageDividerProps>(
  function NewMessageDivider(
    {
      label = 'New',
      color: colorOverride,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const resolvedColor = colorOverride ?? themeColors.status.danger;

    const dividerStyle = useMemo(
      () => buildNewMessageDividerStyle(theme),
      [theme],
    );

    const lineStyle = useMemo(
      () => buildLineStyle(resolvedColor),
      [resolvedColor],
    );

    const labelStyle = useMemo(
      () => buildLabelStyle(resolvedColor, theme),
      [resolvedColor, theme],
    );

    return (
      <div
        ref={ref}
        role="separator"
        className={className}
        style={{ ...dividerStyle, ...userStyle }}
        {...rest}
      >
        <div style={lineStyle} />
        <Text style={labelStyle}>{label}</Text>
        <div style={lineStyle} />
      </div>
    );
  },
);

NewMessageDivider.displayName = 'NewMessageDivider';
