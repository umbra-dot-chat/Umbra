import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import type { TagInputProps } from '@coexist/wisp-core/types/TagInput.types';
import { tagInputSizeMap } from '@coexist/wisp-core/types/TagInput.types';
import {
  resolveTagInputColors,
  buildWrapperStyle,
  buildContainerStyle,
  buildTagStyle,
  buildTagRemoveStyle,
  getTagRemoveHoverBg,
  buildInputStyle,
  buildLabelStyle,
  buildHintStyle,
  buildSkeletonStyle,
} from '@coexist/wisp-core/styles/TagInput.styles';
import { useControllable } from '../../hooks/use-controllable';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * TagInput — A multi-value input that renders tags as removable chips,
 * supporting keyboard navigation, paste, and custom separators.
 *
 * @remarks
 * Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`)
 * patterns. Tags are added via Enter or configurable separator characters
 * (default: comma). Backspace removes the last tag when the input is empty.
 *
 * Uses the same visual language as the Input primitive (border, focus ring,
 * error/warning states, label/hint, skeleton) and renders tags using a
 * chip-like appearance consistent with the Chip primitive.
 *
 * @module primitives/tag-input
 * @example
 * ```tsx
 * import { TagInput } from 'wisp';
 *
 * // Uncontrolled
 * <TagInput label="Tags" placeholder="Add tags..." />
 *
 * // Controlled
 * <TagInput value={tags} onChange={setTags} onTagAdd={handleAdd} />
 *
 * // With max and no duplicates
 * <TagInput max={5} allowDuplicates={false} />
 * ```
 */
export const TagInput = forwardRef<HTMLDivElement, TagInputProps>(function TagInput(
  {
    size = 'md',
    value,
    defaultValue = [],
    onChange,
    onTagAdd,
    onTagRemove,
    label,
    hint,
    error,
    warning,
    placeholder = '',
    icon: LeadingIcon,
    max = Infinity,
    allowDuplicates = false,
    separators = [','],
    fullWidth = false,
    disabled = false,
    skeleton = false,
    renderTag,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = tagInputSizeMap[size];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [tags, setTags] = useControllable<string[]>({
    value,
    defaultValue,
    onChange,
  });

  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const warningMessage = typeof warning === 'string' ? warning : undefined;
  const bottomText = errorMessage || warningMessage || hint;
  const isStatusText = Boolean(errorMessage || warningMessage);
  const atMax = tags.length >= max;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (!allowDuplicates && tags.includes(tag)) return;
      if (tags.length >= max) return;

      const next = [...tags, tag];
      setTags(next);
      onTagAdd?.(tag);
    },
    [tags, allowDuplicates, max, setTags, onTagAdd],
  );

  const removeTag = useCallback(
    (index: number) => {
      const removed = tags[index];
      const next = tags.filter((_, i) => i !== index);
      setTags(next);
      if (removed) onTagRemove?.(removed);
    },
    [tags, setTags, onTagRemove],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      // Check if the last character is a separator
      if (separators.some((sep) => val.endsWith(sep))) {
        const raw = val.slice(0, -1);
        if (raw.trim()) {
          addTag(raw);
        }
        setInputValue('');
        return;
      }

      setInputValue(val);
    },
    [separators, addTag],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue);
          setInputValue('');
        }
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [inputValue, tags, addTag, removeTag],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text/plain');
      if (!pasted) return;

      // If the pasted text contains separators, split and add all at once
      const hasSep = separators.some((sep) => pasted.includes(sep));
      if (hasSep) {
        e.preventDefault();
        const regex = new RegExp(`[${separators.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')}]`);
        const parts = pasted.split(regex);
        const newTags: string[] = [];
        for (const part of parts) {
          const tag = part.trim();
          if (!tag) continue;
          if (!allowDuplicates && (tags.includes(tag) || newTags.includes(tag))) continue;
          if (tags.length + newTags.length >= max) break;
          newTags.push(tag);
        }
        if (newTags.length > 0) {
          const next = [...tags, ...newTags];
          setTags(next);
          for (const tag of newTags) {
            onTagAdd?.(tag);
          }
        }
      }
    },
    [separators, tags, allowDuplicates, max, setTags, onTagAdd],
  );

  const handleContainerClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleFocus = useCallback(() => {
    if (!disabled) setFocused(true);
  }, [disabled]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (containerRef.current?.contains(related)) return;
      setFocused(false);

      // Auto-add the current input as a tag on blur
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    },
    [inputValue, addTag],
  );

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const colors = useMemo(
    () => resolveTagInputColors(focused, hasError, hasWarning, disabled, theme),
    [focused, hasError, hasWarning, disabled, theme],
  );

  const wrapperStyle = useMemo(() => buildWrapperStyle(sizeConfig, fullWidth), [sizeConfig, fullWidth, theme]);
  const contStyle = useMemo(() => buildContainerStyle(sizeConfig, colors, disabled, theme), [sizeConfig, colors, disabled, theme]);
  const tagStyle = useMemo(() => buildTagStyle(sizeConfig, colors, disabled, theme), [sizeConfig, colors, disabled, theme]);
  const tagRemoveBaseStyle = useMemo(() => buildTagRemoveStyle(sizeConfig, colors), [sizeConfig, colors]);
  const inputStyle = useMemo(() => buildInputStyle(sizeConfig, colors), [sizeConfig, colors]);
  const labelStyleObj = useMemo(() => buildLabelStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);
  const hintStyleObj = useMemo(() => buildHintStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);

  const mergedStyle = useMemo(
    () => (userStyle ? { ...wrapperStyle, ...userStyle } : wrapperStyle),
    [wrapperStyle, userStyle],
  );

  const removeHoverBg = useMemo(() => getTagRemoveHoverBg(theme), [theme]);

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  if (skeleton) {
    const skeletonStyle = buildSkeletonStyle(sizeConfig, theme);
    return (
      <div ref={ref} aria-hidden className={className} style={mergedStyle} {...rest}>
        {label && <Text as="label" style={labelStyleObj}>{label}</Text>}
        <div style={skeletonStyle} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tag chip renderer
  // ---------------------------------------------------------------------------

  const renderTagChip = (tag: string, index: number) => {
    const handleRemove = () => removeTag(index);

    if (renderTag) {
      return <React.Fragment key={`${tag}-${index}`}>{renderTag(tag, index, handleRemove)}</React.Fragment>;
    }

    return (
      <TagChip
        key={`${tag}-${index}`}
        label={tag}
        style={tagStyle}
        removeStyle={tagRemoveBaseStyle}
        removeHoverBg={removeHoverBg}
        removeSize={sizeConfig.tagRemoveSize}
        disabled={disabled}
        onRemove={handleRemove}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={ref} className={className} style={mergedStyle} {...rest}>
      {label && <Text as="label" style={labelStyleObj}>{label}</Text>}

      <div
        ref={containerRef}
        style={contStyle}
        onClick={handleContainerClick}
        role="group"
        aria-label={label || 'Tag input'}
      >
        {LeadingIcon && (
          <LeadingIcon
            size={sizeConfig.iconSize}
            color={colors.icon}
            strokeWidth={1.75}
          />
        )}

        {tags.map(renderTagChip)}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={tags.length === 0 ? placeholder : atMax ? '' : placeholder}
          disabled={disabled || atMax}
          style={inputStyle}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={`${label || 'Tag'} input`}
          aria-invalid={hasError || undefined}
        />
      </div>

      {bottomText && (
        <p
          style={hintStyleObj}
          role={isStatusText ? 'alert' : undefined}
        >
          {bottomText}
        </p>
      )}
    </div>
  );
});

TagInput.displayName = 'TagInput';

// ---------------------------------------------------------------------------
// Internal: TagChip sub-component
// ---------------------------------------------------------------------------

interface TagChipProps {
  label: string;
  style: React.CSSProperties;
  removeStyle: React.CSSProperties;
  removeHoverBg: string;
  removeSize: number;
  disabled: boolean;
  onRemove: () => void;
}

function TagChip({
  label,
  style,
  removeStyle,
  removeHoverBg,
  removeSize,
  disabled,
  onRemove,
}: TagChipProps) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) onRemove();
    },
    [disabled, onRemove],
  );

  return (
    <span style={style} data-testid="tag-chip">
      <Text color="inherit">{label}</Text>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        disabled={disabled}
        style={{
          ...removeStyle,
          backgroundColor: hovered && !disabled ? removeHoverBg : 'transparent',
          opacity: hovered && !disabled ? 1 : 0.6,
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <X size={removeSize} strokeWidth={2} />
      </button>
    </span>
  );
}
