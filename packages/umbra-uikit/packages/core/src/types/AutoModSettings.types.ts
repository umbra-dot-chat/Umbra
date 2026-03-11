/**
 * @module types/AutoModSettings
 * @description Type definitions for the AutoModSettings component --
 * a configuration panel for automated moderation rules.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/** An automated moderation rule. */
export interface AutoModRule {
  id: string;
  name: string;
  type: 'keyword' | 'spam' | 'link' | 'caps';
  pattern?: string;
  action: 'delete' | 'warn' | 'timeout';
  enabled: boolean;
}

/** Warning escalation threshold configuration. */
export interface EscalationThreshold {
  warningCount: number;
  action: 'timeout' | 'ban';
  /** Duration in seconds (for timeout action). */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the AutoModSettings component.
 */
export interface AutoModSettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of active auto-moderation rules. */
  rules: AutoModRule[];

  /** List of escalation thresholds. */
  escalationThresholds: EscalationThreshold[];

  /** Called when a new rule should be created. */
  onRuleCreate?: () => void;

  /** Called when an existing rule is updated. */
  onRuleUpdate?: (ruleId: string, updates: Partial<AutoModRule>) => void;

  /** Called when a rule should be deleted. */
  onRuleDelete?: (ruleId: string) => void;

  /** Called when a rule is toggled on/off. */
  onRuleToggle?: (ruleId: string, enabled: boolean) => void;

  /** Called when escalation thresholds are updated. */
  onEscalationUpdate?: (thresholds: EscalationThreshold[]) => void;

  /** Panel title. @default 'AutoMod Settings' */
  title?: string;

  /** Whether data is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
