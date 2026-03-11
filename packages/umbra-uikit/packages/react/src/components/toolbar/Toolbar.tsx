import React, { forwardRef, useMemo, createContext, useContext } from 'react';
import type { ToolbarProps, ToolbarGroupProps, ToolbarSeparatorProps, ToolbarSizeConfig } from '@coexist/wisp-core/types/Toolbar.types';
import { toolbarSizeMap } from '@coexist/wisp-core/types/Toolbar.types';
import { buildToolbarStyle, buildGroupStyle, buildSeparatorStyle } from '@coexist/wisp-core/styles/Toolbar.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context — shares size config with child components
// ---------------------------------------------------------------------------

/** Internal context value providing size configuration to toolbar descendants. */
interface ToolbarContextValue {
  /** The active {@link ToolbarSizeConfig} determined by the parent Toolbar's `size` prop. */
  sizeConfig: ToolbarSizeConfig;
}

/** @internal React context that propagates toolbar size configuration to child components. */
const ToolbarContext = createContext<ToolbarContextValue>({
  sizeConfig: toolbarSizeMap.md,
});

/**
 * Reads the current {@link ToolbarSizeConfig} from the nearest Toolbar ancestor.
 *
 * @returns The toolbar context value containing `sizeConfig`.
 */
function useToolbarContext(): ToolbarContextValue {
  return useContext(ToolbarContext);
}

// ---------------------------------------------------------------------------
// Toolbar — Root container
// ---------------------------------------------------------------------------

/**
 * Toolbar -- Horizontal action bar for the Wisp design system.
 *
 * @remarks
 * Renders a flex row that hosts groups, separators, and action items.
 * Provides its size configuration to descendants via React context so
 * that {@link ToolbarSeparator} and other children can adapt automatically.
 *
 * - Three size presets: `sm`, `md`, `lg`.
 * - Three visual variants: `elevated`, `transparent`, `pill`.
 * - Exposes `role="toolbar"` for accessibility.
 *
 * @module primitives/toolbar
 * @example
 * ```tsx
 * <Toolbar size="md" variant="elevated">
 *   <ToolbarGroup gap="xs">
 *     <Button size="sm" variant="ghost">Bold</Button>
 *     <Button size="sm" variant="ghost">Italic</Button>
 *   </ToolbarGroup>
 *   <ToolbarSeparator />
 *   <ToolbarGroup gap="xs">
 *     <Button size="sm" variant="ghost">Save</Button>
 *   </ToolbarGroup>
 * </Toolbar>
 * ```
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    children,
    size = 'md',
    variant = 'elevated',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = toolbarSizeMap[size];

  const toolbarStyle = useMemo(
    () => buildToolbarStyle(sizeConfig, variant, theme),
    [sizeConfig, variant, theme],
  );

  const mergedStyle = useMemo(
    () => ({ ...toolbarStyle, ...userStyle }),
    [toolbarStyle, userStyle],
  );

  const ctxValue = useMemo<ToolbarContextValue>(
    () => ({ sizeConfig }),
    [sizeConfig],
  );

  return (
    <ToolbarContext.Provider value={ctxValue}>
      <div ref={ref} role="toolbar" style={mergedStyle} {...rest}>
        {children}
      </div>
    </ToolbarContext.Provider>
  );
});

Toolbar.displayName = 'Toolbar';

// ---------------------------------------------------------------------------
// ToolbarGroup — Groups related items
// ---------------------------------------------------------------------------

/**
 * ToolbarGroup -- Groups related toolbar items with a configurable gap.
 *
 * @remarks
 * Renders a horizontal flex container with `role="group"`.
 * The gap between children is resolved from the active theme's spacing scale.
 *
 * @example
 * ```tsx
 * <ToolbarGroup gap="xs">
 *   <Button size="sm" variant="ghost">Cut</Button>
 *   <Button size="sm" variant="ghost">Copy</Button>
 *   <Button size="sm" variant="ghost">Paste</Button>
 * </ToolbarGroup>
 * ```
 */
export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup(
  {
    children,
    gap = 'xs',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const groupStyle = useMemo(
    () => buildGroupStyle(gap, theme.spacing),
    [gap, theme.spacing],
  );

  const mergedStyle = useMemo(
    () => ({ ...groupStyle, ...userStyle }),
    [groupStyle, userStyle],
  );

  return (
    <div ref={ref} role="group" style={mergedStyle} {...rest}>
      {children}
    </div>
  );
});

ToolbarGroup.displayName = 'ToolbarGroup';

// ---------------------------------------------------------------------------
// ToolbarSeparator — Vertical divider between groups
// ---------------------------------------------------------------------------

/**
 * ToolbarSeparator -- Vertical divider between toolbar groups.
 *
 * @remarks
 * Reads the current toolbar size from context to determine its height.
 * Renders `role="separator"` with `aria-orientation="vertical"` for
 * screen-reader compatibility.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <ToolbarGroup>...</ToolbarGroup>
 *   <ToolbarSeparator />
 *   <ToolbarGroup>...</ToolbarGroup>
 * </Toolbar>
 * ```
 */
export const ToolbarSeparator = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(
  function ToolbarSeparator({ style: userStyle, ...rest }, ref) {
    const { sizeConfig } = useToolbarContext();
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const separatorStyle = useMemo(
      () => buildSeparatorStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    const mergedStyle = useMemo(
      () => ({ ...separatorStyle, ...userStyle }),
      [separatorStyle, userStyle],
    );

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        style={mergedStyle}
        {...rest}
      />
    );
  },
);

ToolbarSeparator.displayName = 'ToolbarSeparator';
