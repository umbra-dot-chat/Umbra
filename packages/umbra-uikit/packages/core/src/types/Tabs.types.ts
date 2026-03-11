import type React from 'react';

/** Layout direction for the tab strip. */
export type TabsOrientation = 'horizontal' | 'vertical';

/**
 * Internal context value shared between {@link Tabs}, {@link TabList},
 * {@link Tab}, and {@link TabPanel}.
 */
export interface TabsContextValue {
  /** The `value` string of the currently active tab. */
  activeValue: string;
  /** Callback invoked when the active tab changes. */
  onChange: (value: string) => void;
  /** Current layout orientation of the tab strip. */
  orientation: TabsOrientation;
  /** Auto-generated base ID used to derive ARIA ids for tabs and panels. */
  baseId: string;
}

/**
 * Props for the root {@link Tabs} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) usage patterns.
 */
export interface TabsProps {
  /** Controlled active tab value. When provided the component is controlled. */
  value?: string;
  /**
   * Initial active tab value for uncontrolled mode.
   * @default ''
   */
  defaultValue?: string;
  /** Callback fired when the active tab changes. Receives the new value string. */
  onChange?: (value: string) => void;
  /**
   * Layout orientation of the tab strip.
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
  /** Tab-related children ({@link TabList}, {@link TabPanel}, etc.). */
  children: React.ReactNode;
  /** Optional CSS class applied to the root wrapper `div`. */
  className?: string;
  /** Optional inline styles merged onto the root wrapper `div`. */
  style?: React.CSSProperties;
}

/** Props for the {@link TabList} container that holds tab buttons. */
export interface TabListProps {
  /** One or more {@link Tab} elements. */
  children: React.ReactNode;
  /** Optional CSS class applied to the tab-list `div`. */
  className?: string;
  /** Optional inline styles merged onto the tab-list `div`. */
  style?: React.CSSProperties;
}

/** Props for an individual {@link Tab} button. */
export interface TabProps {
  /** Unique value that associates this tab with its corresponding {@link TabPanel}. */
  value: string;
  /**
   * Whether the tab is disabled.
   * @default false
   */
  disabled?: boolean;
  /** Optional icon rendered before the tab label. */
  icon?: React.ReactNode;
  /** Tab label content. */
  children?: React.ReactNode;
  /** Notification badge count. Renders a small count indicator next to the label. */
  badge?: number;
  /** Optional CSS class applied to the `button` element. */
  className?: string;
  /** Optional inline styles merged onto the `button` element. */
  style?: React.CSSProperties;
}

/** Props for the {@link TabPanel} content area associated with a tab. */
export interface TabPanelProps {
  /** Value that links this panel to its corresponding {@link Tab}. */
  value: string;
  /** Panel content rendered when the matching tab is active. */
  children?: React.ReactNode;
  /** Optional CSS class applied to the panel `div`. */
  className?: string;
  /** Optional inline styles merged onto the panel `div`. */
  style?: React.CSSProperties;
}
