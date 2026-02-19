/**
 * @module ChannelContextMenu
 * @description Context menu dropdown for community channels.
 *
 * Appears on long-press / right-click of a channel in the sidebar.
 * Shows Move to Category, edit, and delete options.
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean;
  /** Called when the menu should open/close. */
  onOpenChange: (open: boolean) => void;
  /** Explicit anchor position (x, y, width, height in window coordinates). */
  anchorLayout: { x: number; y: number; width: number; height: number } | null;
  /** The channel being acted on. */
  channel: { id: string; name: string } | null;
  /** Called when "Edit Channel" is selected. */
  onEdit?: (channelId: string) => void;
  /** Called when "Delete Channel" is selected. */
  onDelete?: (channelId: string) => void;
  /** Called when "Move to Category" is selected — opens category picker. */
  onMoveToCategory?: (channelId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelContextMenu({
  open,
  onOpenChange,
  anchorLayout,
  channel,
  onEdit,
  onDelete,
  onMoveToCategory,
}: ChannelContextMenuProps) {
  if (!channel) return null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} anchorLayout={anchorLayout}>
      <DropdownMenuContent>
        {onMoveToCategory && (
          <DropdownMenuItem onSelect={() => onMoveToCategory(channel.id)}>
            Move to Category
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(channel.id)}>
            Edit Channel
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onSelect={() => onDelete(channel.id)}>
              Delete Channel
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
