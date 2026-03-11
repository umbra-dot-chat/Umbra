/**
 * @module FileTransferList
 */
import React, { forwardRef, useMemo } from 'react';
import type { FileTransferListProps } from '@coexist/wisp-core/types/FileTransferList.types';
import {
  buildTransferListRootStyle,
  buildTransferListHeaderStyle,
  buildTransferListTitleStyle,
  buildTransferListSummaryStyle,
  buildTransferListBadgeStyle,
  buildTransferListItemsStyle,
  buildTransferListEmptyStyle,
} from '@coexist/wisp-core/styles/FileTransferList.styles';
import { useTheme } from '../../providers';
import { FileTransferProgress } from '../file-transfer-progress';

// ---------------------------------------------------------------------------
// FileTransferList
// ---------------------------------------------------------------------------

/**
 * FileTransferList — renders a scrollable list of file transfers with summary badges.
 *
 * @example
 * ```tsx
 * <FileTransferList transfers={activeTransfers} onClearCompleted={clearDone} />
 * ```
 */
export const FileTransferList = forwardRef<HTMLDivElement, FileTransferListProps>(
  function FileTransferList(
    {
      transfers,
      onClearCompleted,
      emptyText = 'No active transfers',
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const rootStyle = useMemo(() => buildTransferListRootStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildTransferListHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(() => buildTransferListTitleStyle(theme), [theme]);
    const summaryStyle = useMemo(() => buildTransferListSummaryStyle(theme), [theme]);
    const itemsStyle = useMemo(() => buildTransferListItemsStyle(theme), [theme]);
    const emptyStyle = useMemo(() => buildTransferListEmptyStyle(theme), [theme]);

    const uploads = transfers.filter(t => t.direction === 'upload' && t.state !== 'complete');
    const downloads = transfers.filter(t => t.direction === 'download' && t.state !== 'complete');
    const completed = transfers.filter(t => t.state === 'complete');
    const errors = transfers.filter(t => t.state === 'error');

    return (
      <div ref={ref} className={className} style={{ ...rootStyle, ...userStyle }} data-testid="file-transfer-list" {...rest}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>Transfers</div>
          <div style={summaryStyle}>
            {uploads.length > 0 && (
              <span style={buildTransferListBadgeStyle(theme, 'upload')}>{'\u2191'} {uploads.length}</span>
            )}
            {downloads.length > 0 && (
              <span style={buildTransferListBadgeStyle(theme, 'download')}>{'\u2193'} {downloads.length}</span>
            )}
            {errors.length > 0 && (
              <span style={buildTransferListBadgeStyle(theme, 'error')}>{'\u26A0'} {errors.length}</span>
            )}
          </div>
          {completed.length > 0 && onClearCompleted && (
            <button
              type="button"
              onClick={onClearCompleted}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.accent.primary, fontSize: 12 }}
            >
              Clear completed
            </button>
          )}
        </div>

        {/* Items */}
        {transfers.length === 0 ? (
          <div style={emptyStyle}>{emptyText}</div>
        ) : (
          <div style={itemsStyle}>
            {transfers.map((transfer, i) => (
              <FileTransferProgress key={transfer.filename + i} {...transfer} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

FileTransferList.displayName = 'FileTransferList';
