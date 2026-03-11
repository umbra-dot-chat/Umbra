/**
 * ScreenSharePicker -- Dialog for selecting which screen/window/tab to share.
 *
 * @remarks
 * Presents a modal dialog with tabbed categories (Screens, Windows, Tabs) and
 * a grid of source cards with thumbnails. Click a source to select it.
 *
 * Since actual screen capture uses browser APIs (getDisplayMedia), this component
 * serves as the selection UI -- sources are provided externally via the `sources` prop.
 *
 * @module components/screen-share-picker
 *
 * @example
 * ```tsx
 * <ScreenSharePicker
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   sources={sources}
 *   onSelect={(id) => startSharing(id)}
 * />
 * ```
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  ScreenSharePickerProps,
  ScreenShareSource,
  ScreenShareSourceType,
} from '@coexist/wisp-core/types/ScreenSharePicker.types';
import { screenShareSourceTypes } from '@coexist/wisp-core/types/ScreenSharePicker.types';
import {
  buildOverlayStyle,
  buildDialogStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildCloseButtonStyle,
  buildTabBarStyle,
  buildTabStyle,
  buildContentStyle,
  buildSourceGridStyle,
  buildSourceCardStyle,
  buildThumbnailStyle,
  buildSourceNameStyle,
  buildLoadingStyle,
  buildSkeletonCardStyle,
} from '@coexist/wisp-core/styles/ScreenSharePicker.styles';
import { useTheme } from '../../providers';

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

export const ScreenSharePicker = forwardRef<HTMLDivElement, ScreenSharePickerProps>(
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
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<ScreenShareSourceType>('screen');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // -------------------------------------------------------------------
    // Filtered sources by active tab
    // -------------------------------------------------------------------
    const filteredSources = useMemo(
      () => sources.filter((s) => s.type === activeTab),
      [sources, activeTab],
    );

    // -------------------------------------------------------------------
    // Available tabs (only show tabs that have sources)
    // -------------------------------------------------------------------
    const availableTabs = useMemo(() => {
      const tabsWithSources = new Set(sources.map((s) => s.type));
      // Always show all tabs when there are sources; show at least 'screen' when empty
      return sources.length > 0
        ? screenShareSourceTypes.filter((t) => tabsWithSources.has(t))
        : (['screen'] as const);
    }, [sources]);

    // -------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------
    const handleSelect = useCallback(
      (sourceId: string) => {
        setSelectedId(sourceId);
        onSelect?.(sourceId);
      },
      [onSelect],
    );

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose],
    );

    // -------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------
    const overlayStyle = useMemo(
      () => buildOverlayStyle() as React.CSSProperties,
      [],
    );
    const dialogStyle = useMemo(
      () => buildDialogStyle(theme) as React.CSSProperties,
      [theme],
    );
    const headerStyle = useMemo(
      () => buildHeaderStyle(theme) as React.CSSProperties,
      [theme],
    );
    const titleStyleObj = useMemo(
      () => buildTitleStyle(theme) as React.CSSProperties,
      [theme],
    );
    const closeBtnStyle = useMemo(
      () => buildCloseButtonStyle(theme) as React.CSSProperties,
      [theme],
    );
    const tabBarStyle = useMemo(
      () => buildTabBarStyle(theme) as React.CSSProperties,
      [theme],
    );
    const contentStyleObj = useMemo(
      () => buildContentStyle(theme) as React.CSSProperties,
      [theme],
    );
    const gridStyle = useMemo(
      () => buildSourceGridStyle() as React.CSSProperties,
      [],
    );
    const thumbnailStyleObj = useMemo(
      () => buildThumbnailStyle(theme) as React.CSSProperties,
      [theme],
    );
    const sourceNameStyleObj = useMemo(
      () => buildSourceNameStyle(theme) as React.CSSProperties,
      [theme],
    );
    const loadingStyleObj = useMemo(
      () => buildLoadingStyle(theme) as React.CSSProperties,
      [theme],
    );
    const skeletonCardStyleObj = useMemo(
      () => buildSkeletonCardStyle(theme) as React.CSSProperties,
      [theme],
    );

    // -------------------------------------------------------------------
    // Hidden when not open
    // -------------------------------------------------------------------
    if (!open) return null;

    return (
      <div
        style={overlayStyle}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="screen-share-picker"
      >
        <div
          ref={ref}
          className={className}
          style={{ ...dialogStyle, ...userStyle } as React.CSSProperties}
          {...rest}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyleObj}>{title}</h2>
            <button
              type="button"
              style={closeBtnStyle}
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={tabBarStyle} role="tablist">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                style={buildTabStyle(activeTab === tab, theme) as React.CSSProperties}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={contentStyleObj}>
            {/* Skeleton state */}
            {skeleton && (
              <div style={gridStyle}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={skeletonCardStyleObj} />
                ))}
              </div>
            )}

            {/* Loading state */}
            {!skeleton && loading && (
              <div style={loadingStyleObj}>
                Loading available sources...
              </div>
            )}

            {/* Sources grid */}
            {!skeleton && !loading && (
              <div style={gridStyle}>
                {filteredSources.length === 0 && (
                  <div style={loadingStyleObj}>
                    No {TAB_LABELS[activeTab].toLowerCase()} available
                  </div>
                )}
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    role="button"
                    tabIndex={0}
                    aria-label={source.name}
                    style={buildSourceCardStyle(selectedId === source.id, theme) as React.CSSProperties}
                    onClick={() => handleSelect(source.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(source.id);
                      }
                    }}
                  >
                    <div style={thumbnailStyleObj}>
                      {source.thumbnail ?? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.text.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      )}
                    </div>
                    <span style={sourceNameStyleObj}>{source.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ScreenSharePicker.displayName = 'ScreenSharePicker';
