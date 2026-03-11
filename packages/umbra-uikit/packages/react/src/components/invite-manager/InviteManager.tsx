/**
 * @module InviteManager
 * @description A panel for creating and managing community invite links.
 *
 * Shows active invites, allows creating new ones with expiry and max uses
 * settings, supports vanity URLs, and has copy-to-clipboard functionality.
 *
 * Uses Wisp design system primitives (Select, Button, Badge) internally.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  InviteManagerProps,
  InviteLink,
  InviteCreateOptions,
} from '@coexist/wisp-core/types/InviteManager.types';
import {
  resolveInviteManagerColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildInviteRowStyle,
  buildInviteInfoStyle,
  buildInviteCodeStyle,
  buildInviteMetaStyle,
  buildCreateSectionStyle,
  buildCopyButtonStyle,
  buildDeleteButtonStyle,
  buildActionRowStyle,
  buildVanitySectionStyle,
  buildCloseButtonStyle,
  buildEmptyStateStyle,
  buildLabelStyle,
  buildSelectStyle,
  buildSkeletonRowStyle,
  buildSkeletonBlockStyle,
} from '@coexist/wisp-core/styles/InviteManager.styles';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Badge } from '../../primitives/badge';
import { Input } from '../../primitives/input';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CopyIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function TrashIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function XIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LinkIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Select options (converted to SelectOption format for Wisp Select)
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
// Skeleton
// ---------------------------------------------------------------------------

function InviteManagerSkeleton({ theme }: { theme: any }) {
  const skeletonRow = buildSkeletonRowStyle(theme);
  return (
    <div aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} style={skeletonRow}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <div style={buildSkeletonBlockStyle('60%', theme)} />
            <div style={buildSkeletonBlockStyle('40%', theme)} />
          </div>
          <div style={buildSkeletonBlockStyle(60, theme)} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InviteManager
// ---------------------------------------------------------------------------

/**
 * InviteManager -- Panel for creating and managing community invite links.
 *
 * @remarks
 * Displays a list of active invite links with copy and delete actions.
 * Provides controls for creating new invites with expiry and max uses
 * settings, and optionally supports vanity URL customisation.
 *
 * Uses Wisp Select, Button, and Badge components for consistent styling.
 *
 * @example
 * ```tsx
 * <InviteManager
 *   invites={activeInvites}
 *   onCreateInvite={(opts) => createInvite(opts)}
 *   onDeleteInvite={(id) => deleteInvite(id)}
 *   onCopy={(code) => navigator.clipboard.writeText(code)}
 * />
 * ```
 */
export const InviteManager = forwardRef<HTMLDivElement, InviteManagerProps>(
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
      skeleton = false,
      onClose,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Local state for the creation form
    const [expiresIn, setExpiresIn] = useState('86400'); // 1 day default
    const [maxUses, setMaxUses] = useState('0'); // no limit default

    const colors = useMemo(
      () => resolveInviteManagerColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildContainerStyle(colors, theme, userStyle as any),
      [colors, theme, userStyle],
    );

    const headerStyle = useMemo(
      () => buildHeaderStyle(colors, theme),
      [colors, theme],
    );

    const createSectionStyle = useMemo(
      () => buildCreateSectionStyle(colors, theme),
      [colors, theme],
    );

    const inviteRowStyle = useMemo(
      () => buildInviteRowStyle(colors, theme),
      [colors, theme],
    );

    const inviteInfoStyle = useMemo(
      () => buildInviteInfoStyle(colors, theme),
      [colors, theme],
    );

    const inviteCodeStyle = useMemo(
      () => buildInviteCodeStyle(colors, theme),
      [colors, theme],
    );

    const inviteMetaStyle = useMemo(
      () => buildInviteMetaStyle(colors, theme),
      [colors, theme],
    );

    const copyBtnStyle = useMemo(
      () => buildCopyButtonStyle(colors, theme),
      [colors, theme],
    );

    const deleteBtnStyle = useMemo(
      () => buildDeleteButtonStyle(colors, theme),
      [colors, theme],
    );

    const actionRowStyle = useMemo(
      () => buildActionRowStyle(theme),
      [theme],
    );

    const closeBtnStyle = useMemo(
      () => buildCloseButtonStyle(colors, theme),
      [colors, theme],
    );

    const emptyStateStyle = useMemo(
      () => buildEmptyStateStyle(colors, theme),
      [colors, theme],
    );

    const labelStyle = useMemo(
      () => buildLabelStyle(colors, theme),
      [colors, theme],
    );

    const selectStyle = useMemo(
      () => buildSelectStyle(colors, theme),
      [colors, theme],
    );

    const vanitySectionStyle = useMemo(
      () => (vanitySlug !== undefined ? buildVanitySectionStyle(colors, theme) : null),
      [colors, theme, vanitySlug],
    );

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
      return (
        <div
          ref={ref}
          className={className}
          style={containerStyle}
          aria-hidden="true"
          {...rest}
        >
          <div style={headerStyle}>
            <span>{title}</span>
          </div>
          <InviteManagerSkeleton theme={theme} />
        </div>
      );
    }

    // ----- Render -----------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={containerStyle}
        role="region"
        aria-label={title}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <span>{title}</span>
          {onClose && (
            <button
              type="button"
              style={closeBtnStyle}
              onClick={onClose}
              aria-label="Close invite manager"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        {/* Create section */}
        {onCreateInvite && (
          <div style={{ ...createSectionStyle, flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>Expires</span>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  style={{ ...selectStyle, width: '100%', WebkitAppearance: 'none', appearance: 'none' as any }}
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>Max uses</span>
                <select
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  style={{ ...selectStyle, width: '100%', WebkitAppearance: 'none', appearance: 'none' as any }}
                >
                  {MAX_USES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleCreate}
              disabled={creating}
              isLoading={creating}
            >
              {creating ? 'Creating...' : 'Create Invite'}
            </Button>
          </div>
        )}

        {/* Vanity URL section */}
        {vanitySlug !== undefined && onVanityChange && vanitySectionStyle && (
          <div style={vanitySectionStyle}>
            <LinkIcon size={14} color={colors.textSecondary} />
            <span style={labelStyle}>{baseUrl}</span>
            <Input
              value={vanitySlug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onVanityChange(e.target.value)}
              placeholder="custom-slug"
              aria-label="Vanity invite URL"
              size="sm"
              style={{ flex: 1 }}
            />
          </div>
        )}

        {/* Active invites list */}
        {invites.length === 0 ? (
          <div style={emptyStateStyle}>
            No active invite links. Create one to get started.
          </div>
        ) : (
          invites.map((invite) => {
            const expired = isExpired(invite.expiresAt);

            return (
              <div key={invite.id} style={inviteRowStyle}>
                {/* Info column */}
                <div style={inviteInfoStyle}>
                  <span style={inviteCodeStyle}>
                    {baseUrl}{invite.code}
                  </span>
                  <span style={inviteMetaStyle}>
                    {invite.createdBy} &middot; {formatUses(invite.uses, invite.maxUses)}
                  </span>
                </div>

                {/* Expiry badge */}
                <Badge
                  variant={expired ? 'danger' : 'success'}
                  size="sm"
                  dot
                >
                  {formatExpiry(invite.expiresAt)}
                </Badge>

                {/* Actions */}
                <div style={actionRowStyle}>
                  {onCopy && (
                    <button
                      type="button"
                      style={copyBtnStyle}
                      onClick={() => handleCopy(invite.code)}
                      aria-label={`Copy invite ${invite.code}`}
                    >
                      <CopyIcon size={14} />
                    </button>
                  )}
                  {onDeleteInvite && (
                    <button
                      type="button"
                      style={deleteBtnStyle}
                      onClick={() => onDeleteInvite(invite.id)}
                      aria-label={`Delete invite ${invite.code}`}
                    >
                      <TrashIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  },
);

InviteManager.displayName = 'InviteManager';
