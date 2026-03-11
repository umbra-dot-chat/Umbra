/**
 * @module MemberStatusPicker
 * @description Picker for setting custom member status (text + emoji + expiry).
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import type { MemberStatusPickerProps, MemberStatusData } from '@coexist/wisp-core/types/MemberStatusPicker.types';
import {
  resolveMemberStatusPickerColors,
  buildMemberStatusPickerOverlayStyle,
  buildMemberStatusPickerDialogStyle,
  buildMemberStatusPickerTitleStyle,
  buildMemberStatusPickerEmojiRowStyle,
  buildMemberStatusPickerEmojiButtonStyle,
  buildMemberStatusPickerInputStyle,
  buildMemberStatusPickerExpiryRowStyle,
  buildMemberStatusPickerExpiryLabelStyle,
  buildMemberStatusPickerSelectStyle,
  buildMemberStatusPickerActionsStyle,
  buildMemberStatusPickerButtonStyle,
  buildMemberStatusPickerEmojiGridStyle,
  buildMemberStatusPickerEmojiItemStyle,
} from '@coexist/wisp-core/styles/MemberStatusPicker.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Default emoji presets
// ---------------------------------------------------------------------------

const DEFAULT_EMOJIS = [
  '\u{1F600}', '\u{1F60A}', '\u{1F60E}', '\u{1F914}', '\u{1F634}',
  '\u{1F3AE}', '\u{1F4BB}', '\u{1F4DA}', '\u{2615}', '\u{1F3B5}',
  '\u{1F3C3}', '\u{1F4AA}', '\u{1F389}', '\u{2764}\u{FE0F}', '\u{1F525}',
  '\u{1F31F}', '\u{1F308}', '\u{1F4A1}', '\u{1F680}', '\u{1F37B}',
  '\u{1F3B8}', '\u{1F4F7}', '\u{1F30D}', '\u{26A1}',
];

const DEFAULT_EXPIRY_PRESETS: Array<{ label: string; value: string | null }> = [
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '4 hours', value: '4h' },
  { label: 'Today', value: 'today' },
  { label: 'Never', value: null },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MemberStatusPicker -- A picker for setting custom status.
 *
 * @remarks
 * Renders as a dialog overlay with emoji selection, text input,
 * expiry dropdown, and action buttons (save, cancel, clear).
 *
 * @example
 * ```tsx
 * <MemberStatusPicker
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSubmit={(data) => saveStatus(data)}
 *   onClear={() => clearStatus()}
 *   currentStatus={{ text: 'In a meeting', emoji: '\u{1F4BB}' }}
 * />
 * ```
 */
export const MemberStatusPicker = forwardRef<HTMLDivElement, MemberStatusPickerProps>(
  function MemberStatusPicker(
    {
      open,
      onClose,
      onSubmit,
      onClear,
      currentStatus,
      submitting = false,
      title = 'Set Status',
      expiryPresets = DEFAULT_EXPIRY_PRESETS,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const [text, setText] = useState(currentStatus?.text ?? '');
    const [emoji, setEmoji] = useState(currentStatus?.emoji ?? '');
    const [expiresAt, setExpiresAt] = useState<string | null>(
      currentStatus?.expiresAt ?? null,
    );
    const [showEmojiGrid, setShowEmojiGrid] = useState(false);

    // Sync with currentStatus when it changes
    useEffect(() => {
      setText(currentStatus?.text ?? '');
      setEmoji(currentStatus?.emoji ?? '');
      setExpiresAt(currentStatus?.expiresAt ?? null);
    }, [currentStatus]);

    const colors = useMemo(
      () => resolveMemberStatusPickerColors(theme),
      [theme],
    );

    const overlayStyle = useMemo(
      () => buildMemberStatusPickerOverlayStyle(colors),
      [colors],
    );

    const dialogStyle = useMemo(
      () => buildMemberStatusPickerDialogStyle(colors, theme),
      [colors, theme],
    );

    const titleStyle = useMemo(
      () => buildMemberStatusPickerTitleStyle(colors, theme),
      [colors, theme],
    );

    const emojiRowStyle = useMemo(
      () => buildMemberStatusPickerEmojiRowStyle(theme),
      [theme],
    );

    const emojiButtonStyle = useMemo(
      () => buildMemberStatusPickerEmojiButtonStyle(colors, theme),
      [colors, theme],
    );

    const inputStyle = useMemo(
      () => buildMemberStatusPickerInputStyle(colors, theme),
      [colors, theme],
    );

    const expiryRowStyle = useMemo(
      () => buildMemberStatusPickerExpiryRowStyle(theme),
      [theme],
    );

    const expiryLabelStyle = useMemo(
      () => buildMemberStatusPickerExpiryLabelStyle(colors),
      [colors],
    );

    const selectStyle = useMemo(
      () => buildMemberStatusPickerSelectStyle(colors, theme),
      [colors, theme],
    );

    const actionsStyle = useMemo(
      () => buildMemberStatusPickerActionsStyle(theme),
      [theme],
    );

    const primaryBtnStyle = useMemo(
      () => buildMemberStatusPickerButtonStyle(colors, 'primary', theme),
      [colors, theme],
    );

    const secondaryBtnStyle = useMemo(
      () => buildMemberStatusPickerButtonStyle(colors, 'secondary', theme),
      [colors, theme],
    );

    const dangerBtnStyle = useMemo(
      () => buildMemberStatusPickerButtonStyle(colors, 'danger', theme),
      [colors, theme],
    );

    const emojiGridStyle = useMemo(
      () => buildMemberStatusPickerEmojiGridStyle(colors, theme),
      [colors, theme],
    );

    const emojiItemStyle = useMemo(
      () => buildMemberStatusPickerEmojiItemStyle(),
      [],
    );

    const handleSubmit = useCallback(() => {
      const data: MemberStatusData = {
        text: text || undefined,
        emoji: emoji || undefined,
        expiresAt,
      };
      onSubmit?.(data);
    }, [text, emoji, expiresAt, onSubmit]);

    const handleClear = useCallback(() => {
      setText('');
      setEmoji('');
      setExpiresAt(null);
      onClear?.();
    }, [onClear]);

    const handleEmojiSelect = useCallback((e: string) => {
      setEmoji(e);
      setShowEmojiGrid(false);
    }, []);

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      },
      [onClose],
    );

    if (!open) return null;

    return (
      <div
        style={overlayStyle}
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          ref={ref}
          role="dialog"
          aria-label={title}
          className={className}
          style={{ ...dialogStyle, ...userStyle }}
          {...rest}
        >
          {/* Title */}
          <h3 style={titleStyle}>{title}</h3>

          {/* Emoji + Text row */}
          <div style={emojiRowStyle}>
            <button
              type="button"
              style={emojiButtonStyle}
              onClick={() => setShowEmojiGrid((prev) => !prev)}
              aria-label="Select emoji"
            >
              {emoji || '\u{1F642}'}
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's your status?"
              style={inputStyle}
              aria-label="Status text"
              maxLength={128}
            />
          </div>

          {/* Emoji grid */}
          {showEmojiGrid && (
            <div style={emojiGridStyle} role="listbox" aria-label="Emoji picker">
              {DEFAULT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  style={emojiItemStyle}
                  onClick={() => handleEmojiSelect(e)}
                  role="option"
                  aria-label={e}
                  aria-selected={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Expiry row */}
          <div style={expiryRowStyle}>
            <span style={expiryLabelStyle}>Clear after</span>
            <select
              value={expiresAt ?? '__null__'}
              onChange={(e) =>
                setExpiresAt(e.target.value === '__null__' ? null : e.target.value)
              }
              style={selectStyle}
              aria-label="Status expiry"
            >
              {expiryPresets.map((preset) => (
                <option
                  key={preset.value ?? '__null__'}
                  value={preset.value ?? '__null__'}
                >
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={actionsStyle}>
            {(currentStatus?.text || currentStatus?.emoji) && (
              <button
                type="button"
                style={dangerBtnStyle}
                onClick={handleClear}
                aria-label="Clear status"
              >
                Clear Status
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{
                ...primaryBtnStyle,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

MemberStatusPicker.displayName = 'MemberStatusPicker';
