/**
 * @module WebhookDetailPage
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { WebhookDetailPageProps } from '@coexist/wisp-core/types/WebhookDetailPage.types';
import {
  buildDetailContainerStyle,
  buildDetailSectionStyle,
  buildDetailAvatarRowStyle,
  buildDetailAvatarStyle,
  buildDetailLabelStyle,
  buildDetailHeadingStyle,
  buildDetailInputStyle,
  buildDetailTokenRowStyle,
  buildDetailTokenFieldStyle,
  buildDetailMetaStyle,
  buildDetailActionRowStyle,
  buildDetailPrimaryButtonStyle,
  buildDetailSecondaryButtonStyle,
  buildDetailDangerButtonStyle,
} from '@coexist/wisp-core/styles/WebhookDetailPage.styles';
import { useTheme } from '../../providers';

/**
 * WebhookDetailPage — Detail view for a single webhook with token display,
 * editable name, avatar, and management actions.
 *
 * @remarks
 * Displays the webhook avatar, an editable name field, channel info, a masked
 * token field with copy and regenerate buttons, and save/delete actions.
 * Includes confirmation dialogs for destructive operations.
 *
 * @example
 * ```tsx
 * <WebhookDetailPage
 *   name="GitHub Bot"
 *   channelName="dev"
 *   token="abc123xyz"
 *   createdBy="Admin"
 *   createdAt="2024-01-15"
 *   onCopyToken={(t) => navigator.clipboard.writeText(t)}
 *   onSave={() => console.log('Save')}
 * />
 * ```
 */
export const WebhookDetailPage = forwardRef<HTMLDivElement, WebhookDetailPageProps>(
  function WebhookDetailPage(
    {
      name,
      avatarUrl,
      channelName,
      token,
      createdBy,
      createdAt,
      onNameChange,
      onAvatarChange,
      onRegenerateToken,
      onDelete,
      onCopyToken,
      saving = false,
      onSave,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(() => buildDetailContainerStyle(theme), [theme]);
    const sectionStyle = useMemo(() => buildDetailSectionStyle(theme), [theme]);
    const avatarRowStyle = useMemo(() => buildDetailAvatarRowStyle(theme), [theme]);
    const avatarImgStyle = useMemo(() => buildDetailAvatarStyle(theme), [theme]);
    const labelStyle = useMemo(() => buildDetailLabelStyle(theme), [theme]);
    const headingStyle = useMemo(() => buildDetailHeadingStyle(theme), [theme]);
    const inputStyle = useMemo(() => buildDetailInputStyle(theme), [theme]);
    const tokenRowStyle = useMemo(() => buildDetailTokenRowStyle(theme), [theme]);
    const tokenFieldStyle = useMemo(() => buildDetailTokenFieldStyle(theme), [theme]);
    const metaStyle = useMemo(() => buildDetailMetaStyle(theme), [theme]);
    const actionRowStyle = useMemo(() => buildDetailActionRowStyle(theme), [theme]);
    const primaryButtonStyle = useMemo(() => buildDetailPrimaryButtonStyle(theme), [theme]);
    const secondaryButtonStyle = useMemo(() => buildDetailSecondaryButtonStyle(theme), [theme]);
    const dangerButtonStyle = useMemo(() => buildDetailDangerButtonStyle(theme), [theme]);

    const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // Skeleton mode
    if (skeleton) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={className}
          style={{ ...containerStyle, minHeight: 300, ...userStyle }}
          {...rest}
        />
      );
    }

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Webhook details"
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Avatar + heading */}
        <div style={avatarRowStyle}>
          <div style={avatarImgStyle}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${name} avatar`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: theme.colors.text.muted,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h2 style={headingStyle}>{name}</h2>
            <p style={metaStyle}>#{channelName}</p>
          </div>
        </div>

        {/* Name edit */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            readOnly={!onNameChange}
            style={inputStyle}
            aria-label="Webhook name"
          />
        </div>

        {/* Avatar change */}
        {onAvatarChange && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarChange(file);
              }}
              aria-label="Change avatar"
              style={{
                fontSize: 13,
                fontFamily: 'inherit',
                color: theme.colors.text.secondary,
              }}
            />
          </div>
        )}

        {/* Token */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Webhook Token</label>
          <div style={tokenRowStyle}>
            <div style={tokenFieldStyle} aria-label="Webhook token">
              {token.slice(0, 8)}{'••••••••••••'}
            </div>
            {onCopyToken && (
              <button
                type="button"
                onClick={() => onCopyToken(token)}
                aria-label="Copy token"
                style={secondaryButtonStyle}
              >
                Copy
              </button>
            )}
            {onRegenerateToken && (
              <button
                type="button"
                onClick={() => setShowConfirmRegenerate(true)}
                aria-label="Regenerate token"
                style={secondaryButtonStyle}
              >
                Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={sectionStyle}>
          <p style={metaStyle}>
            Created by {createdBy} on {createdAt}
          </p>
        </div>

        {/* Actions */}
        <div style={actionRowStyle}>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              aria-label="Save changes"
              style={{
                ...primaryButtonStyle,
                ...(saving ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              aria-label="Delete webhook"
              style={dangerButtonStyle}
            >
              Delete Webhook
            </button>
          )}
        </div>

        {/* Confirm regenerate dialog */}
        {showConfirmRegenerate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowConfirmRegenerate(false)}
            role="presentation"
          >
            <div
              role="alertdialog"
              aria-label="Confirm regenerate token"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.background.surface,
                border: `1px solid ${theme.colors.border.subtle}`,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.lg,
                maxWidth: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
              }}
            >
              <p style={{ ...labelStyle, fontSize: 14 }}>
                Are you sure you want to regenerate this token? The old token will stop working immediately.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.sm }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmRegenerate(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmRegenerate(false);
                    onRegenerateToken?.();
                  }}
                  style={dangerButtonStyle}
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete dialog */}
        {showConfirmDelete && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowConfirmDelete(false)}
            role="presentation"
          >
            <div
              role="alertdialog"
              aria-label="Confirm delete webhook"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.background.surface,
                border: `1px solid ${theme.colors.border.subtle}`,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.lg,
                maxWidth: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
              }}
            >
              <p style={{ ...labelStyle, fontSize: 14 }}>
                Are you sure you want to delete this webhook? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.sm }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    onDelete?.();
                  }}
                  style={dangerButtonStyle}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

WebhookDetailPage.displayName = 'WebhookDetailPage';
