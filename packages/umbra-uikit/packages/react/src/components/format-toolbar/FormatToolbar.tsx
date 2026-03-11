/**
 * @module FormatToolbar
 * @description Inline formatting toolbar for rich text editing.
 *
 * Composes the Toolbar layout primitive with format-specific action buttons.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { FormatToolbarProps, FormatAction } from '@coexist/wisp-core/types/FormatToolbar.types';
import { formatActions } from '@coexist/wisp-core/types/FormatToolbar.types';
import {
  resolveFormatToolbarColors,
  buildFormatButtonStyle,
  getFormatButtonIconSize,
} from '@coexist/wisp-core/styles/FormatToolbar.styles';
import { useTheme } from '../../providers';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '../toolbar';

// ---------------------------------------------------------------------------
// SVG Icons for each format action
// ---------------------------------------------------------------------------

function BoldIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </svg>
  );
}

function ItalicIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function StrikethroughIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CodeIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CodeBlockIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 9.5 8 12l2 2.5" />
      <path d="m14 9.5 2 2.5-2 2.5" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  );
}

function QuoteIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 6H3" />
      <path d="M21 12H8" />
      <path d="M21 18H8" />
      <path d="M3 12v6" />
    </svg>
  );
}

function OrderedListIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function UnorderedListIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function LinkIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const iconMap: Record<FormatAction, React.FC<{ size?: number; color?: string }>> = {
  bold: BoldIcon,
  italic: ItalicIcon,
  strikethrough: StrikethroughIcon,
  code: CodeIcon,
  codeBlock: CodeBlockIcon,
  quote: QuoteIcon,
  orderedList: OrderedListIcon,
  unorderedList: UnorderedListIcon,
  link: LinkIcon,
};

const labelMap: Record<FormatAction, string> = {
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  code: 'Code',
  codeBlock: 'Code Block',
  quote: 'Quote',
  orderedList: 'Ordered List',
  unorderedList: 'Bulleted List',
  link: 'Link',
};

// ---------------------------------------------------------------------------
// Action grouping — split actions by separator boundaries
// ---------------------------------------------------------------------------

/** Actions grouped by separator: [bold,italic,strikethrough] | [code,codeBlock] | [quote] | [orderedList,unorderedList,link] */
const separatorAfter = new Set<FormatAction>(['strikethrough', 'codeBlock', 'quote']);

function groupActions(actions: FormatAction[]): FormatAction[][] {
  const groups: FormatAction[][] = [];
  let current: FormatAction[] = [];

  for (const action of actions) {
    current.push(action);
    if (separatorAfter.has(action)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    groups.push(current);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// FormatToolbar
// ---------------------------------------------------------------------------

/**
 * FormatToolbar — Inline formatting bar for message inputs.
 *
 * @remarks
 * Composes the {@link Toolbar} layout primitive (pill variant) with
 * format-specific action buttons. Renders bold, italic, strikethrough,
 * code, and more — similar to Slack and Discord formatting bars.
 *
 * @example
 * ```tsx
 * <FormatToolbar
 *   onAction={(action) => applyFormat(action)}
 *   activeFormats={new Set(['bold'])}
 * />
 * ```
 */
export const FormatToolbar = forwardRef<HTMLDivElement, FormatToolbarProps>(
  function FormatToolbar(
    {
      onAction,
      activeFormats = new Set(),
      visibleActions,
      disabledActions = new Set(),
      size = 'md',
      disabled = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFormatToolbarColors(theme),
      [theme],
    );

    // Override Toolbar's default pill colors with FormatToolbar's dark-surface colors
    const toolbarOverrideStyle = useMemo(
      () => ({
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }),
      [colors],
    );

    // Override separator color to match FormatToolbar's theme
    const separatorOverrideStyle = useMemo(
      () => ({
        backgroundColor: colors.separatorColor,
      }),
      [colors],
    );

    const iconSize = useMemo(
      () => getFormatButtonIconSize(size),
      [size],
    );

    const actions = visibleActions ?? [...formatActions];
    const groups = useMemo(() => groupActions(actions), [actions]);

    const handleAction = useCallback(
      (action: FormatAction) => {
        if (!disabled && !disabledActions.has(action)) {
          onAction(action);
        }
      },
      [onAction, disabled, disabledActions],
    );

    return (
      <Toolbar
        ref={ref}
        size="sm"
        variant="pill"
        aria-label="Formatting options"
        className={className}
        style={{ ...toolbarOverrideStyle, ...userStyle }}
        {...rest}
      >
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <ToolbarSeparator style={separatorOverrideStyle} />}
            <ToolbarGroup gap="xs">
              {group.map((action) => {
                const isActive = activeFormats.has(action);
                const isDisabled = disabled || disabledActions.has(action);
                const Icon = iconMap[action];
                const label = labelMap[action];
                const btnStyle = buildFormatButtonStyle(colors, isActive, isDisabled, size, theme);

                return (
                  <button
                    key={action}
                    type="button"
                    aria-label={label}
                    aria-pressed={isActive}
                    disabled={isDisabled}
                    title={label}
                    style={btnStyle}
                    onClick={() => handleAction(action)}
                  >
                    <Icon size={iconSize} />
                  </button>
                );
              })}
            </ToolbarGroup>
          </React.Fragment>
        ))}
      </Toolbar>
    );
  },
);

FormatToolbar.displayName = 'FormatToolbar';
