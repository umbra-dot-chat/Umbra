/**
 * WarningDialog -- Dialog form for issuing a warning to a community member.
 *
 * @remarks
 * Composes Dialog, Input, Button, and optional Avatar to provide a
 * complete warning form with reason field, optional expiry date,
 * and cancel/submit buttons.
 *
 * @module components/warning-dialog
 * @example
 * ```tsx
 * <WarningDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   memberName="JaneDoe"
 *   onSubmit={(data) => issueWarning(data)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import type { WarningDialogProps } from '@coexist/wisp-core/types/WarningDialog.types';
import {
  buildDialogBodyStyle,
  buildMemberInfoStyle,
  buildFieldGroupStyle,
  buildErrorStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/WarningDialog.styles';
import { useTheme } from '../../providers';
import { Dialog } from '../dialog';
import { Input } from '../../primitives/input';
import { Button } from '../../primitives/button';

/**
 * WarningDialog -- Form dialog for issuing a warning to a member.
 *
 * @remarks
 * Manages internal form state for reason and optional expiry date.
 * Resets all fields when the dialog is closed.
 */
export const WarningDialog = forwardRef<HTMLDivElement, WarningDialogProps>(
  function WarningDialog(
    {
      open,
      onClose,
      memberName,
      memberAvatar,
      onSubmit,
      submitting = false,
      error,
      title = 'Issue Warning',
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
    const [reason, setReason] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    // Reset form state when the dialog closes
    useEffect(() => {
      if (!open) {
        setReason('');
        setExpiresAt('');
      }
    }, [open]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!reason.trim()) return;
      onSubmit?.({
        reason: reason.trim(),
        expiresAt: expiresAt || undefined,
      });
    }, [reason, expiresAt, onSubmit]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const bodyStyle = useMemo(() => buildDialogBodyStyle(theme), [theme]);
    const memberInfoStyle = useMemo(() => buildMemberInfoStyle(theme), [theme]);
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
              disabled={!reason.trim() || submitting}
              isLoading={submitting}
            >
              Submit Warning
            </Button>
          </div>
        }
        style={userStyle}
        className={className}
      >
        <div ref={ref} style={bodyStyle} {...rest}>
          {/* Member info */}
          <div style={memberInfoStyle}>
            {memberAvatar}
            <span>{memberName}</span>
          </div>

          {/* Reason (required) */}
          <div style={fieldGroupStyle}>
            <Input
              label="Reason"
              placeholder="Enter warning reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
              disabled={submitting}
              fullWidth
            />
          </div>

          {/* Expiry date (optional) */}
          <div style={fieldGroupStyle}>
            <Input
              label="Expires At (optional)"
              type="date"
              value={expiresAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
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

WarningDialog.displayName = 'WarningDialog';
