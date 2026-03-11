/**
 * Accordion -- Vertically collapsible content sections.
 *
 * @remarks
 * Compound component consisting of {@link Accordion}, {@link AccordionItem},
 * {@link AccordionTrigger}, and {@link AccordionContent}.
 *
 * - Supports `"single"` (one panel open at a time) and `"multiple"` modes.
 * - Controlled and uncontrolled open state.
 * - Animated expand/collapse via CSS `max-height` transitions.
 * - Keyboard-accessible trigger buttons with `aria-expanded` state.
 *
 * @module primitives/accordion
 * @example
 * ```tsx
 * <Accordion type="single" defaultValue="item-1">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section One</AccordionTrigger>
 *     <AccordionContent>Content for section one.</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Section Two</AccordionTrigger>
 *     <AccordionContent>Content for section two.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from 'react';
import type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
  AccordionContextValue,
  AccordionItemContextValue,
} from '@coexist/wisp-core/types/Accordion.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import {
  buildAccordionStyle,
  buildItemStyle,
  buildTriggerStyle,
  buildChevronStyle,
  buildContentStyle,
} from '@coexist/wisp-core/styles/Accordion.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const AccordionContext = createContext<AccordionContextValue | null>(null);

/**
 * Retrieves the nearest {@link AccordionContextValue} from the component tree.
 *
 * @returns The current accordion context value.
 * @throws If called outside of an `<Accordion>` provider.
 */
function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (ctx === null) {
    throw new Error('[Wisp] Accordion sub-components must be used within <Accordion>.');
  }
  return ctx;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

/**
 * Retrieves the nearest {@link AccordionItemContextValue} from the component tree.
 *
 * @returns The current accordion item context value.
 * @throws If called outside of an `<AccordionItem>` provider.
 */
function useAccordionItemContext(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (ctx === null) {
    throw new Error('[Wisp] AccordionTrigger / AccordionContent must be used within <AccordionItem>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Helper -- normalise value prop to string[]
// ---------------------------------------------------------------------------

/**
 * Normalises the controlled/default value prop into a consistent `string[]`.
 *
 * @param value - A single string, array of strings, or `undefined`.
 * @returns An array of currently-open item values.
 */
function normaliseValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// ---------------------------------------------------------------------------
// Accordion (root)
// ---------------------------------------------------------------------------

/**
 * Accordion -- Root container that manages which items are expanded.
 *
 * @remarks
 * Provides {@link AccordionContextValue} to descendant compound components.
 * Supports controlled and uncontrolled open state as well as `"single"` and
 * `"multiple"` expansion modes.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    type = 'single',
    value: controlledValue,
    defaultValue,
    onChange,
    collapsible = true,
    children,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const isControlled = controlledValue !== undefined;
  const [internalValues, setInternalValues] = useState<string[]>(() => normaliseValue(defaultValue));
  const openValues = isControlled ? normaliseValue(controlledValue) : internalValues;

  const toggle = useCallback(
    (itemValue: string) => {
      const isOpen = openValues.includes(itemValue);

      let next: string[];

      if (type === 'single') {
        if (isOpen) {
          next = collapsible ? [] : openValues;
        } else {
          next = [itemValue];
        }
      } else {
        // multiple
        if (isOpen) {
          next = collapsible || openValues.length > 1
            ? openValues.filter((v) => v !== itemValue)
            : openValues;
        } else {
          next = [...openValues, itemValue];
        }
      }

      if (!isControlled) setInternalValues(next);
      onChange?.(type === 'single' ? (next[0] ?? '') : next);
    },
    [openValues, type, collapsible, isControlled, onChange],
  );

  const contextValue = useMemo<AccordionContextValue>(
    () => ({ openValues, toggle, type, collapsible }),
    [openValues, toggle, type, collapsible],
  );

  const rootStyle = useMemo(
    () => ({
      ...buildAccordionStyle(theme, userStyle as CSSStyleObject),
      fontFamily: fontFamilyStacks.sans,
    }),
    [theme, userStyle],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div ref={ref} className={className} style={rootStyle} data-wisp-accordion="" {...rest}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});
Accordion.displayName = 'Accordion';

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------

/**
 * AccordionItem -- Wrapper for a single collapsible section.
 *
 * @remarks
 * Provides item-level context (value, open state, disabled) consumed by
 * {@link AccordionTrigger} and {@link AccordionContent}. Renders
 * `data-state` and `data-disabled` attributes for styling hooks.
 */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { value, disabled = false, children, className, style: userStyle, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { openValues } = useAccordionContext();
  const isOpen = openValues.includes(value);

  const itemContext = useMemo<AccordionItemContextValue>(
    () => ({ value, isOpen, disabled }),
    [value, isOpen, disabled],
  );

  const itemStyle = useMemo(
    () => ({ ...buildItemStyle(theme), ...userStyle }),
    [theme, userStyle],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div
        ref={ref}
        className={className}
        style={itemStyle}
        data-wisp-accordion-item=""
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = 'AccordionItem';

// ---------------------------------------------------------------------------
// AccordionTrigger
// ---------------------------------------------------------------------------

/**
 * AccordionTrigger -- Clickable button that toggles the parent item open or closed.
 *
 * @remarks
 * Renders as a `<button>` with `aria-expanded` reflecting the open state.
 * Includes a default chevron icon that rotates when expanded; a custom icon
 * can be supplied via the `icon` prop.
 */
export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ icon, children, className, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { toggle } = useAccordionContext();
    const { value, isOpen, disabled } = useAccordionItemContext();

    const [hovered, setHovered] = useState(false);
    const handleMouseEnter = useCallback(() => {
      if (!disabled) setHovered(true);
    }, [disabled]);
    const handleMouseLeave = useCallback(() => {
      setHovered(false);
    }, []);

    const handleClick = useCallback(() => {
      if (disabled) return;
      toggle(value);
    }, [disabled, toggle, value]);

    const triggerStyle = useMemo(
      () => buildTriggerStyle(isOpen, disabled, hovered, theme, userStyle as CSSStyleObject),
      [isOpen, disabled, hovered, theme, userStyle],
    );

    const chevronStyle = useMemo(() => buildChevronStyle(isOpen), [isOpen, theme]);

    const chevronIcon = icon ?? (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={chevronStyle}
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    );

    return (
      <button
        ref={ref}
        type="button"
        className={className}
        style={triggerStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
        {...rest}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{children}</span>
        {chevronIcon}
      </button>
    );
  },
);
AccordionTrigger.displayName = 'AccordionTrigger';

// ---------------------------------------------------------------------------
// AccordionContent
// ---------------------------------------------------------------------------

/**
 * AccordionContent -- Collapsible body panel for an accordion item.
 *
 * @remarks
 * Animates between 0 and its measured `scrollHeight` via a CSS `max-height`
 * transition. Sets `aria-hidden` when collapsed and `role="region"` for
 * accessibility.
 */
export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ children, className, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { isOpen } = useAccordionItemContext();

    const contentRef = useRef<HTMLDivElement | null>(null);
    const [measuredHeight, setMeasuredHeight] = useState(0);

    // Measure the content height whenever open state or children change
    useEffect(() => {
      const node = contentRef.current;
      if (!node) return;
      setMeasuredHeight(node.scrollHeight);
    }, [isOpen, children]);

    const wrapperStyle = useMemo(
      () => ({ ...buildContentStyle(isOpen, measuredHeight, theme), ...userStyle }),
      [isOpen, measuredHeight, theme, userStyle],
    );

    // Merge forwarded ref with internal ref
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    return (
      <div
        ref={setRefs}
        role="region"
        className={className}
        style={wrapperStyle}
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden={!isOpen}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
AccordionContent.displayName = 'AccordionContent';
