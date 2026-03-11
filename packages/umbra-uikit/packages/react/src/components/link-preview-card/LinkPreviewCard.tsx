/**
 * @module LinkPreviewCard
 * @description URL preview card showing title, description, image, and domain.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { LinkPreviewCardProps } from '@coexist/wisp-core/types/LinkPreviewCard.types';
import {
  resolveLinkPreviewCardColors,
  buildLinkPreviewCardContainerStyle,
  buildLinkPreviewImageStyle,
  buildLinkPreviewContentStyle,
  buildLinkPreviewTitleStyle,
  buildLinkPreviewDescriptionStyle,
  buildLinkPreviewDomainRowStyle,
  buildLinkPreviewFaviconStyle,
  buildLinkPreviewDomainStyle,
  buildLinkPreviewSkeletonStyle,
  buildLinkPreviewSkeletonImageStyle,
  buildLinkPreviewSkeletonLineStyle,
} from '@coexist/wisp-core/styles/LinkPreviewCard.styles';
import { useTheme } from '../../providers';
import { useLinkPreview } from '../../hooks/use-link-preview';

// ---------------------------------------------------------------------------
// Helper: extract domain from URL
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// LinkPreviewCard
// ---------------------------------------------------------------------------

/**
 * LinkPreviewCard — URL preview card with image, title, description, and domain.
 *
 * @remarks
 * Renders Open Graph-style link previews like those seen in Telegram, Slack,
 * and Discord. Supports vertical (image on top) and horizontal (image on side)
 * layouts with three size presets.
 *
 * When `autoFetch` is enabled, automatically fetches Open Graph metadata from
 * the URL. Explicit props (title, description, image) override fetched data.
 *
 * @example
 * ```tsx
 * // Manual data
 * <LinkPreviewCard
 *   url="https://github.com/wisp-ui/wisp"
 *   title="Wisp UI Kit"
 *   description="A monochrome, cross-platform UI kit."
 *   siteName="GitHub"
 * />
 *
 * // Auto-fetch metadata
 * <LinkPreviewCard url="https://github.com" autoFetch />
 * ```
 */
export const LinkPreviewCard = forwardRef<HTMLDivElement, LinkPreviewCardProps>(
  function LinkPreviewCard(
    {
      url,
      title: titleProp,
      description: descProp,
      image: imageProp,
      siteName: siteNameProp,
      favicon: faviconProp,
      size = 'md',
      layout = 'vertical',
      onPress,
      loading: loadingProp = false,
      skeleton = false,
      autoFetch = false,
      fetcher,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Auto-fetch OG metadata when enabled
    const { data: fetchedData, loading: fetchLoading } = useLinkPreview({
      url,
      enabled: autoFetch,
      fetcher,
    });

    // Merge: explicit props override fetched data
    const title = titleProp ?? fetchedData?.title;
    const description = descProp ?? fetchedData?.description;
    const image = imageProp ?? fetchedData?.image;
    const siteName = siteNameProp ?? fetchedData?.siteName;
    const favicon = faviconProp ?? fetchedData?.favicon;
    const isLoading = loadingProp || (autoFetch && fetchLoading);

    const colors = useMemo(
      () => resolveLinkPreviewCardColors(theme),
      [theme],
    );

    // ------ Skeleton / Loading ------
    if (skeleton || isLoading) {
      const skelContainer = buildLinkPreviewSkeletonStyle(layout, size, theme);
      const skelImage = buildLinkPreviewSkeletonImageStyle(layout, size, theme);
      const skelLine1 = buildLinkPreviewSkeletonLineStyle('70%', 14, theme);
      const skelLine2 = buildLinkPreviewSkeletonLineStyle('90%', 12, theme);
      const skelLine3 = buildLinkPreviewSkeletonLineStyle('40%', 11, theme);
      const contentSkelStyle = buildLinkPreviewContentStyle(size);

      return (
        <div
          ref={ref}
          aria-hidden
          className={className}
          style={{ ...skelContainer, ...userStyle }}
          {...rest}
        >
          <div style={skelImage} />
          <div style={contentSkelStyle}>
            <div style={skelLine1} />
            <div style={skelLine2} />
            <div style={skelLine3} />
          </div>
        </div>
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildLinkPreviewCardContainerStyle(colors, layout, size, theme),
      [colors, layout, size, theme],
    );

    const imageStyle = useMemo(
      () => (image ? buildLinkPreviewImageStyle(layout, size) : undefined),
      [image, layout, size],
    );

    const contentStyle = useMemo(
      () => buildLinkPreviewContentStyle(size),
      [size],
    );

    const titleStyle = useMemo(
      () => buildLinkPreviewTitleStyle(colors, size, theme),
      [colors, size, theme],
    );

    const descStyle = useMemo(
      () => (description ? buildLinkPreviewDescriptionStyle(colors, size, theme) : undefined),
      [description, colors, size, theme],
    );

    const domainRowStyle = useMemo(
      () => buildLinkPreviewDomainRowStyle(),
      [],
    );

    const faviconStyle = useMemo(
      () => buildLinkPreviewFaviconStyle(),
      [],
    );

    const domainStyle = useMemo(
      () => buildLinkPreviewDomainStyle(colors, size, theme),
      [colors, size, theme],
    );

    const displayDomain = siteName || extractDomain(url);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (onPress) {
          onPress();
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      },
      [onPress, url],
    );

    return (
      <div
        ref={ref}
        role="link"
        tabIndex={0}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        {...rest}
      >
        {/* Image */}
        {image && (
          <img
            src={image}
            alt={title || 'Link preview'}
            style={imageStyle}
            loading="lazy"
          />
        )}

        {/* Content */}
        <div style={contentStyle}>
          {title && <div style={titleStyle}>{title}</div>}
          {description && <div style={descStyle}>{description}</div>}

          {/* Domain row */}
          <div style={domainRowStyle}>
            {favicon && <img src={favicon} alt="" style={faviconStyle} />}
            <span style={domainStyle}>{displayDomain}</span>
          </div>
        </div>
      </div>
    );
  },
);

LinkPreviewCard.displayName = 'LinkPreviewCard';
