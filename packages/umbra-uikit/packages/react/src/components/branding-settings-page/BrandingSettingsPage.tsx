import React, { forwardRef, useMemo, useState, useCallback, useId } from 'react';
import type { BrandingSettingsPageProps } from '@coexist/wisp-core/types/BrandingSettingsPage.types';
import {
  resolveBrandingSettingsPageColors,
  buildBrandingSettingsPageContainerStyle,
  buildBrandingSettingsPageHeaderStyle,
  buildBrandingSettingsPageSectionStyle,
  buildBrandingSettingsPageSectionTitleStyle,
  buildBrandingSettingsPageFieldStyle,
  buildBrandingSettingsPageLabelStyle,
  buildBrandingSettingsPagePreviewStyle,
  buildBrandingSettingsPageColorPresetsStyle,
  buildBrandingSettingsPageColorPresetStyle,
  buildBrandingSettingsPageFooterStyle,
  buildBrandingSettingsPageSkeletonStyle,
} from '@coexist/wisp-core/styles/BrandingSettingsPage.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Accent color presets
// ---------------------------------------------------------------------------

const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

/**
 * BrandingSettingsPage -- Community branding settings page for the Wisp design system.
 *
 * @remarks
 * Provides a full-page settings experience for community branding,
 * including icon, banner, and splash image uploads, accent color
 * selection with presets, and a custom CSS editor textarea.
 *
 * @module components/branding-settings-page
 */
export const BrandingSettingsPage = forwardRef<HTMLDivElement, BrandingSettingsPageProps>(
  function BrandingSettingsPage(
    {
      iconUrl,
      bannerUrl,
      splashUrl,
      accentColor = '#6366f1',
      customCss = '',
      onIconChange,
      onBannerChange,
      onSplashChange,
      onAccentColorChange,
      onCustomCssChange,
      onSave,
      saving = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const scopeId = useId();

    const colors = useMemo(
      () => resolveBrandingSettingsPageColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildBrandingSettingsPageSkeletonStyle(theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildBrandingSettingsPageContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildBrandingSettingsPageHeaderStyle(colors, theme),
      [colors, theme],
    );

    const sectionStyle = useMemo(
      () => buildBrandingSettingsPageSectionStyle(colors, theme),
      [colors, theme],
    );

    const sectionTitleStyle = useMemo(
      () => buildBrandingSettingsPageSectionTitleStyle(colors, theme),
      [colors, theme],
    );

    const fieldStyle = useMemo(
      () => buildBrandingSettingsPageFieldStyle(theme),
      [theme],
    );

    const labelStyle = useMemo(
      () => buildBrandingSettingsPageLabelStyle(colors, theme),
      [colors, theme],
    );

    const previewStyle = useMemo(
      () => buildBrandingSettingsPagePreviewStyle(colors, theme),
      [colors, theme],
    );

    const colorPresetsStyle = useMemo(
      () => buildBrandingSettingsPageColorPresetsStyle(theme),
      [theme],
    );

    const footerStyle = useMemo(
      () => buildBrandingSettingsPageFooterStyle(theme),
      [theme],
    );

    const handleFileInput = useCallback(
      (cb?: (file: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && cb) cb(file);
      },
      [],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        <div style={headerStyle}>Branding Settings</div>

        {/* Images Section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Images</div>

          {/* Icon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Community Icon</label>
            <div style={{ ...previewStyle, width: 80, height: 80, borderRadius: '50%' }}>
              {iconUrl ? (
                <img src={iconUrl} alt="Community icon" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span style={{ color: colors.textMuted, fontSize: 12 }}>No icon</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput(onIconChange)}
              style={{ fontSize: 13, color: colors.textSecondary }}
            />
          </div>

          {/* Banner */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Banner</label>
            <div style={{ ...previewStyle, backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined }}>
              {!bannerUrl && (
                <span style={{ color: colors.textMuted, fontSize: 12 }}>No banner</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput(onBannerChange)}
              style={{ fontSize: 13, color: colors.textSecondary }}
            />
          </div>

          {/* Splash */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Splash</label>
            <div style={{ ...previewStyle, height: 160, backgroundImage: splashUrl ? `url(${splashUrl})` : undefined }}>
              {!splashUrl && (
                <span style={{ color: colors.textMuted, fontSize: 12 }}>No splash</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput(onSplashChange)}
              style={{ fontSize: 13, color: colors.textSecondary }}
            />
          </div>
        </div>

        {/* Colors Section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Colors</div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Accent Color</label>
            <div style={colorPresetsStyle}>
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select accent color ${color}`}
                  style={buildBrandingSettingsPageColorPresetStyle(color, color === accentColor, theme)}
                  onClick={() => onAccentColorChange?.(color)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange?.(e.target.value)}
                style={{ width: 36, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: colors.textMuted, fontFamily: 'monospace' }}>
                {accentColor}
              </span>
            </div>
          </div>
        </div>

        {/* Custom CSS Section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Custom CSS</div>
          <div style={fieldStyle}>
            <label style={labelStyle}>CSS Editor</label>
            <textarea
              value={customCss}
              onChange={(e) => onCustomCssChange?.(e.target.value)}
              placeholder="/* Enter custom CSS here */"
              rows={8}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.sectionBg,
                color: colors.text,
                fontFamily: 'monospace',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Save Footer */}
        <div style={footerStyle}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            style={{
              padding: '8px 24px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: accentColor,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  },
);

BrandingSettingsPage.displayName = 'BrandingSettingsPage';
