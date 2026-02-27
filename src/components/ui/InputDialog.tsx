/**
 * @module InputDialog
 * @description Themed modal dialog with a single text input field.
 *
 * Used for space create/rename, channel rename, and any other
 * simple single-field input flows.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput as RNTextInput } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Dialog, Input, Button, Text, useTheme } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Dialog title. */
  title: string;
  /** Label above the input field. */
  label?: string;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Initial value for the input. */
  defaultValue?: string;
  /** Text for the submit button. @default "Save" */
  submitLabel?: string;
  /** Called when the user submits. Receives trimmed input value. */
  onSubmit: (value: string) => void | Promise<void>;
  /** Whether a submission is in progress. */
  submitting?: boolean;
  /** Validation: minimum length (default 1). */
  minLength?: number;
  /** Validation: maximum length. */
  maxLength?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InputDialog({
  open,
  onClose,
  title,
  label,
  placeholder,
  defaultValue = '',
  submitLabel = 'Save',
  onSubmit,
  submitting = false,
  minLength = 1,
  maxLength,
}: InputDialogProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes or defaultValue changes
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
    }
  }, [open, defaultValue]);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      setError(`Must be at least ${minLength} character${minLength !== 1 ? 's' : ''}.`);
      return;
    }
    if (maxLength && trimmed.length > maxLength) {
      setError(`Must be at most ${maxLength} characters.`);
      return;
    }
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [value, minLength, maxLength, onSubmit]);

  const handleClose = useCallback(() => {
    setValue('');
    setError(null);
    onClose();
  }, [onClose]);

  const canSubmit = value.trim().length >= minLength && !submitting;

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
          <Button onPress={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </>
      }
    >
      <View style={{ gap: 8 }}>
        {label && (
          <Text
            size="sm"
            weight="medium"
            style={{ color: theme.colors.text.secondary }}
          >
            {label}
          </Text>
        )}
        <Input
          value={value}
          onChangeText={(text: string) => {
            setValue(text);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          autoFocus
          onSubmitEditing={canSubmit ? handleSubmit : undefined}
          maxLength={maxLength}
        />
        {error && (
          <Text size="xs" style={{ color: theme.colors.status.danger }}>
            {error}
          </Text>
        )}
      </View>
    </Dialog>
  );
}
