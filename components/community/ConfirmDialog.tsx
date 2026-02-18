/**
 * @module ConfirmDialog
 * @description Themed confirmation dialog for destructive actions.
 *
 * Used for delete confirmations (space delete, channel delete, etc.).
 * Shows a danger-styled confirm button.
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Dialog, Button, Text, useTheme } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Dialog title. */
  title: string;
  /** Descriptive message explaining the action. */
  message: string;
  /** Text for the confirm button. @default "Delete" */
  confirmLabel?: string;
  /** Called when the user confirms. */
  onConfirm: () => void | Promise<void>;
  /** Whether a submission is in progress. */
  submitting?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  submitting = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [onConfirm]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onPress={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onPress={handleConfirm} disabled={submitting}>
            {submitting ? 'Deleting...' : confirmLabel}
          </Button>
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <Text size="sm" style={{ color: theme.colors.text.secondary }}>
          {message}
        </Text>
        {error && (
          <Text size="xs" style={{ color: theme.colors.status.danger }}>
            {error}
          </Text>
        )}
      </View>
    </Dialog>
  );
}
