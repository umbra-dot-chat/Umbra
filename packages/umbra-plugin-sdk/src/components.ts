/**
 * Base components for plugin authors.
 *
 * These provide standardised containers for plugin UI that
 * automatically pick up Umbra's theme tokens.
 */

import React from 'react';

// =============================================================================
// PluginPanel — Full-width panel container (for right-panel, settings-tab)
// =============================================================================

export interface PluginPanelProps {
  /** Panel title shown in the header */
  title: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Panel content */
  children: React.ReactNode;
}

/**
 * Standardised panel wrapper for right-panel and settings-tab slots.
 *
 * Provides consistent padding, header, and scrollable content area.
 * Intended to be used as the root element of a slot component.
 *
 * @example
 * ```tsx
 * import { PluginPanel } from '@umbra/plugin-sdk';
 *
 * export function KanbanPanel() {
 *   return (
 *     <PluginPanel title="Kanban Board" icon="📋">
 *       {/* board content *\/}
 *     </PluginPanel>
 *   );
 * }
 * ```
 */
export const PluginPanel: React.FC<PluginPanelProps> = ({ title, icon, children }) => {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        overflow: 'hidden',
      },
    },
    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid #27272A',
          flexShrink: 0,
        },
      },
      icon && React.createElement('span', { style: { fontSize: 16 } }, icon),
      React.createElement(
        'span',
        {
          style: {
            fontSize: 14,
            fontWeight: 600,
            color: '#FAFAFA',
          },
        },
        title
      )
    ),
    // Scrollable content
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          overflow: 'auto',
          padding: 16,
        },
      },
      children
    )
  );
};

// =============================================================================
// PluginAction — Action button for message-actions slot
// =============================================================================

export interface PluginActionProps {
  /** Action label */
  label: string;
  /** Optional icon element or emoji */
  icon?: React.ReactNode;
  /** Click handler */
  onPress: () => void;
  /** Whether the action is currently loading */
  loading?: boolean;
}

/**
 * Standardised action button for the message-actions slot.
 *
 * Renders a small chip-style button consistent with built-in actions
 * (reply, react, pin, etc.).
 *
 * @example
 * ```tsx
 * import { PluginAction } from '@umbra/plugin-sdk';
 *
 * export function TranslateAction() {
 *   return (
 *     <PluginAction
 *       label="Translate"
 *       icon="🌐"
 *       onPress={() => { /* ... *\/ }}
 *     />
 *   );
 * }
 * ```
 */
export const PluginAction: React.FC<PluginActionProps> = ({
  label,
  icon,
  onPress,
  loading = false,
}) => {
  return React.createElement(
    'button',
    {
      onClick: onPress,
      disabled: loading,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid #27272A',
        backgroundColor: '#18181B',
        color: '#A1A1AA',
        fontSize: 12,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'background-color 150ms',
      },
      onMouseEnter: (e: any) => {
        if (!loading) e.currentTarget.style.backgroundColor = '#27272A';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.backgroundColor = '#18181B';
      },
    },
    icon && React.createElement('span', { style: { fontSize: 12 } }, icon),
    label
  );
};
