/**
 * @module WebhookCreateDialog
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { WebhookCreateDialogProps } from '@coexist/wisp-core/types/WebhookCreateDialog.types';
import {
  buildDialogOverlayStyle,
  buildDialogContainerStyle,
  buildDialogHeaderStyle,
  buildDialogTitleStyle,
  buildDialogBodyStyle,
  buildDialogLabelStyle,
  buildDialogInputStyle,
  buildDialogSelectStyle,
  buildDialogErrorStyle,
  buildDialogFooterStyle,
  buildDialogPrimaryButtonStyle,
  buildDialogSecondaryButtonStyle,
  buildDialogCloseButtonStyle,
} from '@coexist/wisp-core/styles/WebhookCreateDialog.styles';
import { useTheme } from '../../providers';

/**
 * WebhookCreateDialog — A dialog for creating a new webhook.
 *
 * @remarks
 * Provides a form with a name input, channel selector, optional avatar upload,
 * and cancel/create action buttons. Shows an optional error message.
 *
 * @example
 * ```tsx
 * <WebhookCreateDialog
 *   open={true}
 *   onClose={() => setOpen(false)}
 *   onSubmit={(data) => console.log(data)}
 *   channels={[{ id: 'c1', name: 'general' }]}
 * />
 * ```
 */
export const WebhookCreateDialog = forwardRef<HTMLDivElement, WebhookCreateDialogProps>(
  function WebhookCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      channels,
      submitting = false,
      error,
      title = 'Create Webhook',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const overlayStyle = useMemo(() => buildDialogOverlayStyle(), []);
    const containerStyle = useMemo(() => buildDialogContainerStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildDialogHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(() => buildDialogTitleStyle(theme), [theme]);
    const bodyStyle = useMemo(() => buildDialogBodyStyle(theme), [theme]);
    const labelStyle = useMemo(() => buildDialogLabelStyle(theme), [theme]);
    const inputStyle = useMemo(() => buildDialogInputStyle(theme), [theme]);
    const selectStyle = useMemo(() => buildDialogSelectStyle(theme), [theme]);
    const errorStyle = useMemo(() => buildDialogErrorStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildDialogFooterStyle(theme), [theme]);
    const primaryButtonStyle = useMemo(() => buildDialogPrimaryButtonStyle(theme), [theme]);
    const secondaryButtonStyle = useMemo(() => buildDialogSecondaryButtonStyle(theme), [theme]);
    const closeButtonStyle = useMemo(() => buildDialogCloseButtonStyle(theme), [theme]);

    const [name, setName] = useState('');
    const [channelId, setChannelId] = useState(channels[0]?.id ?? '');
    const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);

    const handleSubmit = useCallback(() => {
      if (!name.trim() || !channelId) return;
      onSubmit?.({ name: name.trim(), channelId, avatarFile });
    }, [name, channelId, avatarFile, onSubmit]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setAvatarFile(file);
    }, []);

    if (!open) return null;

    return (
      <div style={overlayStyle} onClick={onClose} role="presentation">
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={className}
          style={{ ...containerStyle, ...userStyle }}
          onClick={(e) => e.stopPropagation()}
          {...rest}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h3 style={titleStyle}>{title}</h3>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={bodyStyle}>
            {/* Name input */}
            <div>
              <label style={labelStyle} htmlFor="webhook-name">
                Name
              </label>
              <input
                id="webhook-name"
                type="text"
                placeholder="Enter webhook name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                aria-label="Webhook name"
              />
            </div>

            {/* Channel selector */}
            <div>
              <label style={labelStyle} htmlFor="webhook-channel">
                Channel
              </label>
              <select
                id="webhook-channel"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                style={selectStyle}
                aria-label="Webhook channel"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar upload */}
            <div>
              <label style={labelStyle} htmlFor="webhook-avatar">
                Avatar (optional)
              </label>
              <input
                id="webhook-avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Webhook avatar"
                style={{
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: theme.colors.text.secondary,
                }}
              />
            </div>

            {/* Error */}
            {error && <p style={errorStyle}>{error}</p>}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !channelId}
              aria-label="Create"
              style={{
                ...primaryButtonStyle,
                ...(submitting || !name.trim() || !channelId
                  ? { opacity: 0.5, cursor: 'not-allowed' }
                  : {}),
              }}
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

WebhookCreateDialog.displayName = 'WebhookCreateDialog';
