/**
 * @module WebhookManagementPanel
 */
import React, { forwardRef, useMemo } from 'react';
import type { WebhookManagementPanelProps } from '@coexist/wisp-core/types/WebhookManagementPanel.types';
import {
  buildWebhookPanelContainerStyle,
  buildWebhookPanelHeaderStyle,
  buildWebhookPanelTitleStyle,
  buildWebhookPanelCountStyle,
  buildWebhookCardStyle,
  buildWebhookAvatarStyle,
  buildWebhookCardInfoStyle,
  buildWebhookCardNameStyle,
  buildWebhookCardMetaStyle,
  buildWebhookCreateButtonStyle,
  buildWebhookDeleteButtonStyle,
  buildWebhookPanelEmptyStyle,
} from '@coexist/wisp-core/styles/WebhookManagementPanel.styles';
import { useTheme } from '../../providers';

/**
 * WebhookManagementPanel — A panel listing all webhooks for a channel
 * with create, view, and delete actions.
 *
 * @remarks
 * Displays a scrollable list of webhook entries. Each entry shows an
 * avatar, name, channel, and last-used date. A create button allows
 * adding new webhooks up to a configurable maximum.
 *
 * @example
 * ```tsx
 * <WebhookManagementPanel
 *   webhooks={[
 *     { id: '1', name: 'GitHub', channelName: 'dev', channelId: 'c1', createdBy: 'Admin', createdAt: '2024-01-15' },
 *   ]}
 *   onCreateClick={() => console.log('Create')}
 *   onWebhookClick={(id) => console.log('View', id)}
 * />
 * ```
 */
export const WebhookManagementPanel = forwardRef<HTMLDivElement, WebhookManagementPanelProps>(
  function WebhookManagementPanel(
    {
      webhooks,
      onCreateClick,
      onWebhookClick,
      onDeleteWebhook,
      title = 'Webhooks',
      maxWebhooks = 10,
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(() => buildWebhookPanelContainerStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildWebhookPanelHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(() => buildWebhookPanelTitleStyle(theme), [theme]);
    const countStyle = useMemo(() => buildWebhookPanelCountStyle(theme), [theme]);
    const cardStyle = useMemo(() => buildWebhookCardStyle(theme), [theme]);
    const avatarStyle = useMemo(() => buildWebhookAvatarStyle(theme), [theme]);
    const cardInfoStyle = useMemo(() => buildWebhookCardInfoStyle(), []);
    const cardNameStyle = useMemo(() => buildWebhookCardNameStyle(theme), [theme]);
    const cardMetaStyle = useMemo(() => buildWebhookCardMetaStyle(theme), [theme]);
    const createButtonStyle = useMemo(() => buildWebhookCreateButtonStyle(theme), [theme]);
    const deleteButtonStyle = useMemo(() => buildWebhookDeleteButtonStyle(theme), [theme]);
    const emptyStyle = useMemo(() => buildWebhookPanelEmptyStyle(theme), [theme]);

    // Skeleton mode
    if (skeleton) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={className}
          style={{ ...containerStyle, minHeight: 200, ...userStyle }}
          {...rest}
        />
      );
    }

    const atMax = webhooks.length >= maxWebhooks;

    return (
      <div
        ref={ref}
        role="region"
        aria-label={title}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={titleStyle}>{title}</h3>
            <span style={countStyle}>
              {webhooks.length}/{maxWebhooks}
            </span>
          </div>
          {onCreateClick && (
            <button
              type="button"
              onClick={onCreateClick}
              disabled={atMax}
              aria-label="Create webhook"
              style={{
                ...createButtonStyle,
                ...(atMax ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
            >
              Create Webhook
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={emptyStyle} role="status">
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && webhooks.length === 0 && (
          <div style={emptyStyle}>No webhooks created yet</div>
        )}

        {/* Webhook list */}
        {!loading && webhooks.length > 0 && (
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                style={cardStyle}
                data-testid={`webhook-card-${webhook.id}`}
                role="button"
                tabIndex={0}
                onClick={() => onWebhookClick?.(webhook.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onWebhookClick?.(webhook.id);
                  }
                }}
              >
                {/* Avatar */}
                <div style={avatarStyle}>
                  {webhook.avatarUrl ? (
                    <img
                      src={webhook.avatarUrl}
                      alt={`${webhook.name} avatar`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.colors.text.muted,
                      }}
                    >
                      {webhook.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={cardInfoStyle}>
                  <p style={cardNameStyle}>{webhook.name}</p>
                  <p style={cardMetaStyle}>#{webhook.channelName}</p>
                  <p style={cardMetaStyle}>
                    Created by {webhook.createdBy} on {webhook.createdAt}
                    {webhook.lastUsedAt ? ` · Last used ${webhook.lastUsedAt}` : ''}
                  </p>
                </div>

                {/* Delete button */}
                {onDeleteWebhook && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWebhook(webhook.id);
                    }}
                    aria-label={`Delete ${webhook.name}`}
                    style={deleteButtonStyle}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

WebhookManagementPanel.displayName = 'WebhookManagementPanel';
