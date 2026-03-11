/**
 * CommunityCreateDialog -- Dialog for creating a new community.
 *
 * @remarks
 * Composes Dialog, Input, FileUploader, and Button to provide a
 * complete community creation form with name, description, and
 * optional icon upload fields.
 *
 * @module components/community-create-dialog
 * @example
 * ```tsx
 * <CommunityCreateDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={(data) => createCommunity(data)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import type { CommunityCreateDialogProps, CommunityCreateData } from '@coexist/wisp-core/types/CommunityCreateDialog.types';
import {
  buildDialogBodyStyle,
  buildFieldGroupStyle,
  buildErrorStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/CommunityCreateDialog.styles';
import { useTheme } from '../../providers';
import { Dialog } from '../dialog';
import { Input } from '../../primitives/input';
import { Button } from '../../primitives/button';
import { FileUploader } from '../file-uploader';

/**
 * CommunityCreateDialog -- Form dialog for creating a new community.
 *
 * @remarks
 * Manages internal form state for name, description, and icon file.
 * Resets all fields when the dialog is closed.
 */
export const CommunityCreateDialog = forwardRef<HTMLDivElement, CommunityCreateDialogProps>(
  function CommunityCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      submitting = false,
      error,
      title = 'Create Community',
      maxNameLength = 100,
      maxDescriptionLength = 1000,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -----------------------------------------------------------------------
    // Internal form state
    // -----------------------------------------------------------------------
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconFile, setIconFile] = useState<File | undefined>(undefined);

    // Reset form state when the dialog closes
    useEffect(() => {
      if (!open) {
        setName('');
        setDescription('');
        setIconFile(undefined);
      }
    }, [open]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!name.trim()) return;
      const data: CommunityCreateData = {
        name: name.trim(),
        description: description.trim(),
        iconFile,
      };
      onSubmit?.(data);
    }, [name, description, iconFile, onSubmit]);

    const handleIconChange = useCallback((files: File[]) => {
      if (files.length > 0) {
        setIconFile(files[0]);
      }
    }, []);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const bodyStyle = useMemo(() => buildDialogBodyStyle(theme), [theme]);
    const fieldGroupStyle = useMemo(() => buildFieldGroupStyle(theme), [theme]);
    const errorStyle = useMemo(() => buildErrorStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={title}
        size="md"
        footer={
          <div style={footerStyle}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              isLoading={submitting}
            >
              Create
            </Button>
          </div>
        }
        style={userStyle}
        className={className}
      >
        <div ref={ref} style={bodyStyle} {...rest}>
          {/* Icon upload */}
          <div style={fieldGroupStyle}>
            <FileUploader
              accept="image/*"
              onChange={handleIconChange}
              title={iconFile ? iconFile.name : 'Upload community icon'}
              description="PNG, JPG or SVG"
              disabled={submitting}
            />
          </div>

          {/* Community name */}
          <div style={fieldGroupStyle}>
            <Input
              label="Name"
              placeholder="Enter community name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              maxLength={maxNameLength}
              disabled={submitting}
              fullWidth
            />
          </div>

          {/* Description */}
          <div style={fieldGroupStyle}>
            <Input
              label="Description"
              placeholder="What is this community about?"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              maxLength={maxDescriptionLength}
              disabled={submitting}
              fullWidth
            />
          </div>

          {/* Error message */}
          {error && (
            <p style={errorStyle} role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    );
  },
);

CommunityCreateDialog.displayName = 'CommunityCreateDialog';
