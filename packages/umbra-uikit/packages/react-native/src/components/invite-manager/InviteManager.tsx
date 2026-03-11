/**
 * @module components/invite-manager
 * @description React Native InviteManager for the Wisp design system.
 *
 * A panel for creating and managing community invite links.
 * Shows active invites, creation controls, and copy/delete actions.
 *
 * Matches the exact layout and style of the React DOM version:
 * - Create section: two select columns (Expires + Max uses) stacked above
 *   a full-width primary Create Invite button
 * - Invite rows: code, metadata, expiry badge with dot indicator, action buttons
 * - Vanity URL section with link icon, base URL label, and input
 */

import React, { forwardRef, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, StyleSheet } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveInviteManagerColors,
} from '@coexist/wisp-core/styles/InviteManager.styles';
import type { InviteManagerColors } from '@coexist/wisp-core/styles/InviteManager.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Circle, Line, Path, Rect, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types — matching core definitions
// ---------------------------------------------------------------------------

export interface InviteLink {
  id: string;
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  uses: number;
  isVanity?: boolean;
}

export interface InviteCreateOptions {
  expiresIn: number;
  maxUses: number;
}

export interface InviteManagerProps extends ViewProps {
  /** List of active invite links. */
  invites: InviteLink[];
  /** Called when a new invite is created. */
  onCreateInvite?: (options: InviteCreateOptions) => void;
  /** Called when an invite is deleted/revoked. */
  onDeleteInvite?: (inviteId: string) => void;
  /** Called when an invite code is copied. */
  onCopy?: (code: string) => void;
  /** Base URL for constructing full invite links. @default 'https://umbra.app/invite/' */
  baseUrl?: string;
  /** Whether creation is in progress. @default false */
  creating?: boolean;
  /** Title text. @default 'Invite People' */
  title?: string;
  /** Vanity URL slug (if set). */
  vanitySlug?: string;
  /** Called when vanity URL is changed. */
  onVanityChange?: (slug: string) => void;
  /** Whether the panel is in a loading state. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Called when close/back is clicked. */
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// SVG Icons (matching React DOM icon sizes — default 14)
// ---------------------------------------------------------------------------

function CopyIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </Svg>
  );
}

function TrashIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <Path d="M10 11v6" />
      <Path d="M14 11v6" />
      <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </Svg>
  );
}

function XIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function LinkIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Select options — matching React DOM string values exactly
// ---------------------------------------------------------------------------

const EXPIRY_OPTIONS = [
  { value: '1800', label: '30 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '21600', label: '6 hours' },
  { value: '43200', label: '12 hours' },
  { value: '86400', label: '1 day' },
  { value: '604800', label: '7 days' },
  { value: '0', label: 'Never' },
];

const MAX_USES_OPTIONS = [
  { value: '0', label: 'No limit' },
  { value: '1', label: '1 use' },
  { value: '5', label: '5 uses' },
  { value: '10', label: '10 uses' },
  { value: '25', label: '25 uses' },
  { value: '50', label: '50 uses' },
  { value: '100', label: '100 uses' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function formatExpiry(expiresAt?: string | null): string {
  if (!expiresAt) return 'Never';
  if (isExpired(expiresAt)) return 'Expired';
  return new Date(expiresAt).toLocaleDateString();
}

function formatUses(uses: number, maxUses?: number | null): string {
  if (maxUses == null || maxUses === 0) return `${uses} uses`;
  return `${uses} / ${maxUses} uses`;
}

// ---------------------------------------------------------------------------
// ChevronDown icon for dropdown indicator
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// OptionPicker — Modal-based dropdown select (works inside nested modals)
// Uses <Modal transparent> like Wisp's Select/DropdownMenu so it renders
// above all other layers regardless of parent z-index or absolute positioning.
// ---------------------------------------------------------------------------

function OptionPicker({
  options,
  value,
  onChange,
  label,
  style,
  colors,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  style: ViewStyle;
  colors: InviteManagerColors;
}) {
  const [open, setOpen] = useState(false);
  const idx = options.findIndex((o) => o.value === value);
  const anchorRef = useRef<View>(null);
  const [anchorLayout, setAnchorLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleOpen = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchorLayout({ x, y, width, height });
      setOpen(true);
    });
  }, []);

  const handleSelect = useCallback((val: string) => {
    onChange(val);
    setOpen(false);
  }, [onChange]);

  return (
    <View ref={anchorRef} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handleOpen}
        style={[style, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
      >
        <Text
          style={{
            fontSize: defaultTypography.sizes.sm.fontSize,
            color: colors.textPrimary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {options[idx >= 0 ? idx : 0].label}
        </Text>
        <ChevronDownIcon size={12} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        {/* Full-screen backdrop to close on outside tap */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          {/* Positioned dropdown — uses absolute coords from measureInWindow */}
          {anchorLayout && (
            <View
              style={{
                position: 'absolute',
                top: anchorLayout.y + anchorLayout.height + 4,
                left: anchorLayout.x,
                width: anchorLayout.width,
              }}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={{
                    backgroundColor: colors.bg,
                    borderRadius: defaultRadii.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleSelect(option.value)}
                        style={({ pressed }) => ({
                          paddingVertical: 6,
                          paddingHorizontal: defaultSpacing.sm,
                          backgroundColor: isSelected
                            ? colors.accentBg + '20'
                            : pressed
                              ? colors.inputBg
                              : 'transparent',
                        })}
                      >
                        <Text
                          style={{
                            fontSize: defaultTypography.sizes.sm.fontSize,
                            color: isSelected ? colors.accentBg : colors.textPrimary,
                            fontWeight: isSelected
                              ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
                              : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
                          }}
                          numberOfLines={1}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InviteManager = forwardRef<View, InviteManagerProps>(
  function InviteManager(
    {
      invites,
      onCreateInvite,
      onDeleteInvite,
      onCopy,
      baseUrl = 'https://umbra.app/invite/',
      creating = false,
      title = 'Invite People',
      vanitySlug,
      onVanityChange,
      loading: _loading = false,
      skeleton = false,
      onClose,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Match DOM: string-based state
    const [expiresIn, setExpiresIn] = useState('86400'); // 1 day default
    const [maxUses, setMaxUses] = useState('0'); // no limit default

    const colors = useMemo(
      () => resolveInviteManagerColors(theme),
      [theme],
    );

    // -- Styles (matching React DOM core style builders) ----------------------

    const containerStyle = useMemo<ViewStyle>(() => ({
      backgroundColor: colors.bg,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    }), [colors]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    }), [colors]);

    const headerTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      lineHeight: defaultTypography.sizes.base.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.headerText,
    }), [colors]);

    const closeButtonStyle = useMemo<ViewStyle>(() => ({
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    // Create section: vertical column layout matching DOM
    const createSectionStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'column',
      gap: 8,
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.createBg,
    }), [colors]);

    const selectRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      gap: 8,
    }), []);

    const selectColumnStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      flexDirection: 'column',
      gap: 4,
    }), []);

    const selectStyle = useMemo<ViewStyle>(() => ({
      height: 32,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    }), [colors]);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.textSecondary,
    }), [colors]);

    // Full-width primary button matching DOM's <Button variant="primary" fullWidth>
    const createBtnStyle = useMemo<ViewStyle>(() => ({
      height: 32,
      borderRadius: defaultRadii.md,
      backgroundColor: colors.accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: creating ? 0.5 : 1,
    }), [colors, creating]);

    const createBtnText = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.accentText,
    }), [colors]);

    const inviteRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: defaultSpacing.md,
    }), [colors]);

    const inviteInfoStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      gap: defaultSpacing['2xs'],
      minWidth: 0,
    }), []);

    const inviteCodeStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.textPrimary,
    }), [colors]);

    const inviteMetaStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: colors.textSecondary,
    }), [colors]);

    const actionRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing['2xs'],
    }), []);

    // Match DOM: 28px copy button with copyBg background
    const copyBtnStyle = useMemo<ViewStyle>(() => ({
      height: 28,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: colors.copyBg,
      alignItems: 'center',
      justifyContent: 'center',
    }), [colors]);

    // Match DOM: 28px delete button with transparent background
    const deleteBtnStyle = useMemo<ViewStyle>(() => ({
      height: 28,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    const emptyStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: defaultSpacing.xl,
      paddingHorizontal: defaultSpacing.lg,
    }), []);

    const emptyTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.textMuted,
      textAlign: 'center',
    }), [colors]);

    const vanitySectionStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    }), [colors]);

    const vanityInputStyle = useMemo<TextStyle>(() => ({
      flex: 1,
      height: 32,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
      fontSize: defaultTypography.sizes.sm.fontSize,
    }), [colors]);

    // -- Callbacks -----------------------------------------------------------

    const handleCreate = useCallback(() => {
      if (creating) return;
      onCreateInvite?.({ expiresIn: Number(expiresIn), maxUses: Number(maxUses) });
    }, [creating, onCreateInvite, expiresIn, maxUses]);

    const handleCopy = useCallback(
      (code: string) => {
        const fullUrl = `${baseUrl}${code}`;
        onCopy?.(fullUrl);
      },
      [baseUrl, onCopy],
    );

    // ----- Skeleton ---------------------------------------------------------
    if (skeleton) {
      const skeletonBlock = (width: number): ViewStyle => ({
        height: 14,
        width,
        borderRadius: defaultRadii.sm,
        backgroundColor: colors.border,
      });

      return (
        <View
          ref={ref}
          accessibilityElementsHidden
          style={[containerStyle, userStyle as ViewStyle]}
          {...rest}
        >
          <View style={headerStyle}>
            <Text style={headerTextStyle}>{title}</Text>
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} style={inviteRowStyle}>
              <View style={inviteInfoStyle}>
                <View style={skeletonBlock(180)} />
                <View style={skeletonBlock(120)} />
              </View>
              <View style={skeletonBlock(60)} />
            </View>
          ))}
        </View>
      );
    }

    // ----- Render (matching DOM layout exactly) -----------------------------
    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={title}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header */}
        <View style={headerStyle}>
          <Text style={headerTextStyle}>{title}</Text>
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close invite manager"
              onPress={onClose}
              style={closeButtonStyle}
            >
              <XIcon size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Create section — matches DOM: column with select row + full-width button */}
          {onCreateInvite && (
            <View style={createSectionStyle}>
              {/* Two select columns side-by-side (matching DOM layout) */}
              <View style={selectRowStyle}>
                <View style={selectColumnStyle}>
                  <Text style={labelStyle}>Expires</Text>
                  <OptionPicker
                    options={EXPIRY_OPTIONS}
                    value={expiresIn}
                    onChange={setExpiresIn}
                    label="Invite expiry"
                    style={selectStyle}
                    colors={colors}
                  />
                </View>
                <View style={selectColumnStyle}>
                  <Text style={labelStyle}>Max uses</Text>
                  <OptionPicker
                    options={MAX_USES_OPTIONS}
                    value={maxUses}
                    onChange={setMaxUses}
                    label="Maximum uses"
                    style={selectStyle}
                    colors={colors}
                  />
                </View>
              </View>

              {/* Full-width create button — matches DOM's <Button variant="primary" fullWidth> */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create invite"
                onPress={handleCreate}
                disabled={creating}
                style={createBtnStyle}
              >
                <Text style={createBtnText}>
                  {creating ? 'Creating...' : 'Create Invite'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Vanity URL section */}
          {vanitySlug !== undefined && onVanityChange && (
            <View style={vanitySectionStyle}>
              <LinkIcon size={14} color={colors.textSecondary} />
              <Text style={labelStyle}>{baseUrl}</Text>
              <TextInput
                style={vanityInputStyle}
                value={vanitySlug}
                onChangeText={onVanityChange}
                placeholder="custom-slug"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Vanity invite URL"
              />
            </View>
          )}

          {/* Invite list */}
          {invites.length === 0 ? (
            <View style={emptyStyle}>
              <Text style={emptyTextStyle}>
                No active invite links. Create one to get started.
              </Text>
            </View>
          ) : (
            invites.map((invite) => {
              const expired = isExpired(invite.expiresAt);

              // Badge with dot — matching DOM's <Badge variant="success|danger" size="sm" dot>
              const badgeBg = expired ? colors.expiryExpiredBg : colors.expiryActiveBg;
              const badgeColor = expired ? colors.expiryExpiredText : colors.expiryActiveText;

              const badgeStyle: ViewStyle = {
                flexDirection: 'row',
                alignItems: 'center',
                height: 20,
                paddingHorizontal: defaultSpacing.xs,
                borderRadius: defaultRadii.full,
                backgroundColor: badgeBg,
                gap: 4,
              };

              const badgeTextStyle: TextStyle = {
                fontSize: defaultTypography.sizes['2xs'].fontSize,
                fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
                color: badgeColor,
              };

              return (
                <View
                  key={invite.id}
                  accessibilityLabel={`Invite ${invite.code}`}
                  style={inviteRowStyle}
                >
                  {/* Info column */}
                  <View style={inviteInfoStyle}>
                    <Text style={inviteCodeStyle} numberOfLines={1}>
                      {baseUrl}{invite.code}
                    </Text>
                    <Text style={inviteMetaStyle} numberOfLines={1}>
                      {invite.createdBy} · {formatUses(invite.uses, invite.maxUses)}
                    </Text>
                  </View>

                  {/* Expiry badge with dot indicator */}
                  <View style={badgeStyle}>
                    <Svg width={6} height={6} viewBox="0 0 6 6">
                      <Circle cx={3} cy={3} r={3} fill={badgeColor} />
                    </Svg>
                    <Text style={badgeTextStyle}>
                      {formatExpiry(invite.expiresAt)}
                    </Text>
                  </View>

                  {/* Action buttons — matching DOM: 28px with copyBg / transparent */}
                  <View style={actionRowStyle}>
                    {onCopy && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Copy invite ${invite.code}`}
                        onPress={() => handleCopy(invite.code)}
                        style={copyBtnStyle}
                      >
                        <CopyIcon size={14} color={colors.copyText} />
                      </Pressable>
                    )}
                    {onDeleteInvite && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete invite ${invite.code}`}
                        onPress={() => onDeleteInvite(invite.id)}
                        style={deleteBtnStyle}
                      >
                        <TrashIcon size={14} color={colors.deleteText} />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  },
);

InviteManager.displayName = 'InviteManager';
