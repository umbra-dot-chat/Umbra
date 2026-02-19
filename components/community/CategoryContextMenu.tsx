/**
 * @module CategoryContextMenu
 * @description Context menu for category actions.
 *
 * Opens on category long-press (right-click). Provides Create Channel,
 * Create Category, Edit, Move Up/Down, and Delete actions.
 */

import React from 'react';
import type { LayoutRectangle } from 'react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean;
  /** Called when visibility changes. */
  onOpenChange: (open: boolean) => void;
  /** The anchor layout (position from the long-press event). */
  anchorLayout: LayoutRectangle | null;
  /** The target category. */
  category: { id: string; name: string } | null;
  /** Called when "Create Channel" is selected. */
  onCreateChannel?: (categoryId: string) => void;
  /** Called when "Create Category" is selected. */
  onCreateCategory?: () => void;
  /** Called when "Edit" is selected. */
  onEdit?: (categoryId: string) => void;
  /** Called when "Move Up" is selected. */
  onMoveUp?: (categoryId: string) => void;
  /** Called when "Move Down" is selected. */
  onMoveDown?: (categoryId: string) => void;
  /** Whether this is the first category (hides Move Up). */
  isFirst?: boolean;
  /** Whether this is the last category (hides Move Down). */
  isLast?: boolean;
  /** Called when "Delete" is selected. */
  onDelete?: (categoryId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryContextMenu({
  open,
  onOpenChange,
  anchorLayout,
  category,
  onCreateChannel,
  onCreateCategory,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onDelete,
}: CategoryContextMenuProps) {
  if (!category) return null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} anchorLayout={anchorLayout}>
      <DropdownMenuContent>
        {onCreateChannel && (
          <DropdownMenuItem
            onSelect={() => {
              onCreateChannel(category.id);
              onOpenChange(false);
            }}
          >
            Create Channel
          </DropdownMenuItem>
        )}
        {onCreateCategory && (
          <DropdownMenuItem
            onSelect={() => {
              onCreateCategory();
              onOpenChange(false);
            }}
          >
            Create Category
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem
            onSelect={() => {
              onEdit(category.id);
              onOpenChange(false);
            }}
          >
            Edit Category
          </DropdownMenuItem>
        )}
        {onMoveUp && !isFirst && (
          <DropdownMenuItem
            onSelect={() => {
              onMoveUp(category.id);
              onOpenChange(false);
            }}
          >
            Move Up
          </DropdownMenuItem>
        )}
        {onMoveDown && !isLast && (
          <DropdownMenuItem
            onSelect={() => {
              onMoveDown(category.id);
              onOpenChange(false);
            }}
          >
            Move Down
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              danger
              onSelect={() => {
                onDelete(category.id);
                onOpenChange(false);
              }}
            >
              Delete Category
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
