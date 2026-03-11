import React, { forwardRef, useMemo, useId } from 'react';
import type { ThemePreviewProps } from '@coexist/wisp-core/types/ThemePreview.types';
import {
  resolveThemePreviewColors,
  buildThemePreviewContainerStyle,
  buildThemePreviewHeaderStyle,
  buildThemePreviewIconStyle,
  buildThemePreviewBodyStyle,
  buildThemePreviewChannelListStyle,
  buildThemePreviewChannelItemStyle,
  buildThemePreviewMessageAreaStyle,
  buildThemePreviewMessageStyle,
  buildThemePreviewMessageAvatarStyle,
  buildThemePreviewMessageContentStyle,
  buildThemePreviewMessageAuthorStyle,
  buildThemePreviewMessageTextStyle,
  buildThemePreviewSkeletonStyle,
} from '@coexist/wisp-core/styles/ThemePreview.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Sample data for the preview
// ---------------------------------------------------------------------------

const SAMPLE_CHANNELS = ['# general', '# announcements', '# off-topic', '# dev'];
const SAMPLE_MESSAGES = [
  { author: 'Alice', text: 'Hey everyone, welcome to the community!' },
  { author: 'Bob', text: 'Thanks for having me here.' },
  { author: 'Carol', text: 'This looks great with the new theme.' },
];

/**
 * ThemePreview -- Live preview of community accent color and custom CSS effects.
 *
 * @remarks
 * Renders a self-contained Card showing a mini mockup of a community:
 * header with icon and name using accent color, sample channel list,
 * and sample message area. Custom CSS applied via a scoped style tag.
 *
 * @module components/theme-preview
 */
export const ThemePreview = forwardRef<HTMLDivElement, ThemePreviewProps>(
  function ThemePreview(
    {
      accentColor = '#6366f1',
      customCss = '',
      communityName = 'My Community',
      communityIcon,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const scopeId = useId();
    const scopeClass = `wisp-tp-${scopeId.replace(/:/g, '')}`;

    const colors = useMemo(
      () => resolveThemePreviewColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildThemePreviewSkeletonStyle(theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildThemePreviewContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildThemePreviewHeaderStyle(accentColor, theme),
      [accentColor, theme],
    );

    const iconStyle = useMemo(
      () => buildThemePreviewIconStyle(theme),
      [theme],
    );

    const bodyStyle = useMemo(
      () => buildThemePreviewBodyStyle(colors),
      [colors],
    );

    const channelListStyle = useMemo(
      () => buildThemePreviewChannelListStyle(colors, theme),
      [colors, theme],
    );

    const messageAreaStyle = useMemo(
      () => buildThemePreviewMessageAreaStyle(colors, theme),
      [colors, theme],
    );

    const messageStyle = useMemo(
      () => buildThemePreviewMessageStyle(colors, theme),
      [colors, theme],
    );

    const messageContentStyle = useMemo(
      () => buildThemePreviewMessageContentStyle(colors, theme),
      [colors, theme],
    );

    const messageTextStyle = useMemo(
      () => buildThemePreviewMessageTextStyle(colors, theme),
      [colors, theme],
    );

    // Scoped custom CSS
    const scopedCss = useMemo(() => {
      if (!customCss) return '';
      // Prefix all selectors with the scope class
      return customCss
        .replace(/([^{}]+)\{/g, (_, selector: string) => {
          const scoped = selector
            .split(',')
            .map((s: string) => `.${scopeClass} ${s.trim()}`)
            .join(', ');
          return `${scoped} {`;
        });
    }, [customCss, scopeClass]);

    return (
      <div
        ref={ref}
        className={`${scopeClass}${className ? ` ${className}` : ''}`}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Scoped custom CSS */}
        {scopedCss && <style>{scopedCss}</style>}

        {/* Header */}
        <div style={headerStyle} data-part="header">
          <div style={iconStyle}>
            {communityIcon ?? (
              <span style={{ fontSize: 14, color: '#fff' }}>
                {communityName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span>{communityName}</span>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Channel List */}
          <div style={channelListStyle} data-part="channels">
            {SAMPLE_CHANNELS.map((ch, i) => (
              <div
                key={ch}
                style={buildThemePreviewChannelItemStyle(colors, i === 0, accentColor, theme)}
              >
                {ch}
              </div>
            ))}
          </div>

          {/* Message Area */}
          <div style={messageAreaStyle} data-part="messages">
            {SAMPLE_MESSAGES.map((msg, i) => (
              <div key={i} style={messageStyle}>
                <div style={buildThemePreviewMessageAvatarStyle(accentColor, theme)} />
                <div style={messageContentStyle}>
                  <span style={buildThemePreviewMessageAuthorStyle(accentColor, theme)}>
                    {msg.author}
                  </span>
                  <span style={messageTextStyle}>{msg.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

ThemePreview.displayName = 'ThemePreview';
