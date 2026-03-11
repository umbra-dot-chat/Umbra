import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { VanityURLSettingsProps } from '@coexist/wisp-core/types/VanityURLSettings.types';
import {
  resolveVanityURLSettingsColors,
  buildVanityURLSettingsContainerStyle,
  buildVanityURLSettingsTitleStyle,
  buildVanityURLSettingsDescriptionStyle,
  buildVanityURLSettingsInputRowStyle,
  buildVanityURLSettingsPrefixStyle,
  buildVanityURLSettingsStatusStyle,
  buildVanityURLSettingsActionsStyle,
  buildVanityURLSettingsSkeletonStyle,
} from '@coexist/wisp-core/styles/VanityURLSettings.styles';
import { useTheme } from '../../providers';

/**
 * VanityURLSettings -- Input for setting vanity URL with availability check.
 *
 * @remarks
 * Displays a base URL prefix, an editable slug input, a check availability
 * button, a status badge, and a save button.
 *
 * @module components/vanity-url-settings
 */
export const VanityURLSettings = forwardRef<HTMLDivElement, VanityURLSettingsProps>(
  function VanityURLSettings(
    {
      currentSlug = '',
      baseUrl = 'umbra.app/c/',
      onChange,
      onCheck,
      onSave,
      availability,
      saving = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [slug, setSlug] = useState(currentSlug);

    const colors = useMemo(
      () => resolveVanityURLSettingsColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildVanityURLSettingsSkeletonStyle(theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildVanityURLSettingsContainerStyle(colors, theme),
      [colors, theme],
    );

    const titleStyle = useMemo(
      () => buildVanityURLSettingsTitleStyle(colors, theme),
      [colors, theme],
    );

    const descriptionStyle = useMemo(
      () => buildVanityURLSettingsDescriptionStyle(colors, theme),
      [colors, theme],
    );

    const inputRowStyle = useMemo(
      () => buildVanityURLSettingsInputRowStyle(theme),
      [theme],
    );

    const prefixStyle = useMemo(
      () => buildVanityURLSettingsPrefixStyle(colors, theme),
      [colors, theme],
    );

    const actionsStyle = useMemo(
      () => buildVanityURLSettingsActionsStyle(theme),
      [theme],
    );

    const handleSlugChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setSlug(val);
        onChange?.(val);
      },
      [onChange],
    );

    const statusLabel: Record<string, string> = {
      available: 'Available',
      taken: 'Taken',
      checking: 'Checking...',
      invalid: 'Invalid',
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        <div style={titleStyle}>Vanity URL</div>
        <div style={descriptionStyle}>
          Set a custom URL for your community.
        </div>

        <div style={inputRowStyle}>
          <span style={prefixStyle}>{baseUrl}</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="your-community"
            style={{
              flex: 1,
              minWidth: 120,
              padding: '6px 10px',
              borderRadius: `0 ${theme.radii.md}px ${theme.radii.md}px 0`,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
              color: colors.text,
              fontSize: theme.typography.sizes.sm.fontSize,
              outline: 'none',
              lineHeight: '34px',
              height: 36,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {availability && (
          <div style={buildVanityURLSettingsStatusStyle(availability, colors, theme)}>
            {availability === 'checking' && (
              <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${colors.checking}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'wisp-spin 0.6s linear infinite' }} />
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: theme.radii.full,
                fontSize: theme.typography.sizes.xs.fontSize,
                fontWeight: theme.typography.weights.medium,
                backgroundColor: availability === 'available' ? theme.colors.status.successSurface
                  : availability === 'taken' ? theme.colors.status.dangerSurface
                  : availability === 'invalid' ? theme.colors.status.warningSurface
                  : 'transparent',
                color: availability === 'available' ? colors.available
                  : availability === 'taken' ? colors.taken
                  : availability === 'invalid' ? colors.invalid
                  : colors.checking,
              }}
            >
              {statusLabel[availability]}
            </span>
          </div>
        )}

        <div style={actionsStyle}>
          <button
            type="button"
            onClick={() => onCheck?.(slug)}
            disabled={!slug}
            style={{
              padding: '6px 16px',
              borderRadius: theme.radii.md,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
              color: colors.text,
              fontSize: theme.typography.sizes.sm.fontSize,
              cursor: slug ? 'pointer' : 'not-allowed',
              opacity: slug ? 1 : 0.5,
            }}
          >
            Check Availability
          </button>
          <button
            type="button"
            onClick={() => onSave?.(slug)}
            disabled={saving || availability !== 'available'}
            style={{
              padding: '6px 16px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: availability === 'available' ? theme.colors.accent.primary : colors.border,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: theme.typography.sizes.sm.fontSize,
              cursor: saving || availability !== 'available' ? 'not-allowed' : 'pointer',
              opacity: saving || availability !== 'available' ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  },
);

VanityURLSettings.displayName = 'VanityURLSettings';
