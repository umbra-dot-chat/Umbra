/**
 * @module SpaceContextMenu
 * @description Context menu dropdown for community spaces.
 *
 * Appears on long-press / right-click of a space tab in the sidebar.
 * Shows create channel, create category, edit, and delete options.
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

export interface SpaceContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean;
  /** Called when the menu should open/close. */
  onOpenChange: (open: boolean) => void;
  /** Explicit anchor position (x, y, width, height in window coordinates). */
  anchorLayout: { x: number; y: number; width: number; height: number } | null;
  /** The space being acted on. */
  space: { id: string; name: string } | null;
  /** Called when "Edit Space" is selected. */
  onEdit?: (spaceId: string) => void;
  /** Called when "Delete Space" is selected. */
  onDelete?: (spaceId: string) => void;
  /** Called when "Create Channel" is selected. */
  onCreateChannel?: (spaceId: string) => void;
  /** Called when "Create Category" is selected. */
  onCreateCategory?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceContextMenu({
  open,
  onOpenChange,
  anchorLayout,
  space,
  onEdit,
  onDelete,
  onCreateChannel,
  onCreateCategory,
}: SpaceContextMenuProps) {
  if (!space) return null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} anchorLayout={anchorLayout}>
      <DropdownMenuContent>
        {onCreateChannel && (
          <DropdownMenuItem onSelect={() => onCreateChannel(space.id)}>
            Create Channel
          </DropdownMenuItem>
        )}
        {onCreateCategory && (
          <DropdownMenuItem onSelect={() => onCreateCategory()}>
            Create Category
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(space.id)}>
            Edit Space
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onSelect={() => onDelete(space.id)}>
              Delete Space
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
