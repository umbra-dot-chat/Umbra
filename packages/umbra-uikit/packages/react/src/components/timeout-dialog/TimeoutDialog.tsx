/**
 * TimeoutDialog -- Dialog for temporarily timing out (muting) a community member.
 *
 * @remarks
 * Composes Dialog, Select-like dropdowns, Input, and Button to provide
 * a timeout form with duration presets, type selection, reason field,
 * and cancel/submit buttons.
 *
 * @module components/timeout-dialog
 * @example
 * ```tsx
 * <TimeoutDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   memberName="JaneDoe"
 *   onSubmit={(data) => applyTimeout(data)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import type { TimeoutDialogProps, TimeoutType } from '@coexist/wisp-core/types/TimeoutDialog.types';
import {
  buildDialogBodyStyle,
  buildMemberInfoStyle,
  buildFieldGroupStyle,
  buildLabelStyle,
  buildErrorStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/TimeoutDialog.styles';
import { useTheme } from '../../providers';
import { Dialog } from '../dialog';
import { Input } from '../../primitives/input';
import { Button } from '../../primitives/button';

const DEFAULT_DURATION_PRESETS = [
  { label: '60 seconds', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
  { label: '1 hour', value: 3600 },
  { label: '1 day', value: 86400 },
  { label: '1 week', value: 604800 },
];

/**
 * TimeoutDialog -- Form dialog for timing out a community member.
 *
 * @remarks
 * Manages internal form state for duration, type, and optional reason.
 * Resets all fields when the dialog is closed.
 */
export const TimeoutDialog = forwardRef<HTMLDivElement, TimeoutDialogProps>(
  function TimeoutDialog(
    {
      open,
      onClose,
      memberName,
      memberAvatar,
      onSubmit,
      submitting = false,
      error,
      title = 'Timeout Member',
      durationPresets = DEFAULT_DURATION_PRESETS,
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
    const [duration, setDuration] = useState<number>(
      durationPresets.length > 0 ? durationPresets[0].value : 300,
    );
    const [type, setType] = useState<TimeoutType>('mute');
    const [reason, setReason] = useState('');

    // Reset form state when the dialog closes
    useEffect(() => {
      if (!open) {
        setDuration(durationPresets.length > 0 ? durationPresets[0].value : 300);
        setType('mute');
        setReason('');
      }
    }, [open, durationPresets]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      onSubmit?.({
        duration,
        reason: reason.trim() || undefined,
        type,
      });
    }, [duration, reason, type, onSubmit]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const bodyStyle = useMemo(() => buildDialogBodyStyle(theme), [theme]);
    const memberInfoStyle = useMemo(() => buildMemberInfoStyle(theme), [theme]);
    const fieldGroupStyle = useMemo(() => buildFieldGroupStyle(theme), [theme]);
    const labelStyle = useMemo(() => buildLabelStyle(theme), [theme]);
    const errorStyle = useMemo(() => buildErrorStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);

    const selectStyle = useMemo(
      () => ({
        height: 34,
        width: '100%',
        padding: `0 ${theme.spacing.sm}px`,
        borderRadius: theme.radii.md,
        border: `1px solid ${theme.colors.border.subtle}`,
        backgroundColor: theme.colors.background.sunken,
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.sm.fontSize,
        lineHeight: 1,
        outline: 'none' as const,
        cursor: 'pointer' as const,
        boxSizing: 'border-box' as const,
      }),
      [theme],
    );

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
              disabled={submitting}
              isLoading={submitting}
            >
              Apply Timeout
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

          {/* Duration select */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Duration</label>
            <select
              style={selectStyle}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={submitting}
              aria-label="Timeout duration"
            >
              {durationPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type select */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Type</label>
            <select
              style={selectStyle}
              value={type}
              onChange={(e) => setType(e.target.value as TimeoutType)}
              disabled={submitting}
              aria-label="Timeout type"
            >
              <option value="mute">Mute</option>
              <option value="restrict">Restrict</option>
            </select>
          </div>

          {/* Reason (optional) */}
          <div style={fieldGroupStyle}>
            <Input
              label="Reason (optional)"
              placeholder="Enter timeout reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
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

TimeoutDialog.displayName = 'TimeoutDialog';
