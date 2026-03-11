/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AutoModSettings } from './AutoModSettings';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleRules = [
  {
    id: 'r1',
    name: 'Bad Words Filter',
    type: 'keyword' as const,
    pattern: 'badword|spam',
    action: 'delete' as const,
    enabled: true,
  },
  {
    id: 'r2',
    name: 'Anti Spam',
    type: 'spam' as const,
    action: 'warn' as const,
    enabled: false,
  },
];

const sampleThresholds = [
  { warningCount: 3, action: 'timeout' as const, duration: 3600 },
  { warningCount: 5, action: 'ban' as const },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSettings(props: Record<string, unknown> = {}) {
  const defaultProps = {
    rules: sampleRules,
    escalationThresholds: sampleThresholds,
  };
  return render(
    <Dark>
      <AutoModSettings {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AutoModSettings -- rendering', () => {
  it('renders the panel title', () => {
    renderSettings();
    expect(screen.getByText('AutoMod Settings')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderSettings({ title: 'Mod Config' });
    expect(screen.getByText('Mod Config')).toBeInTheDocument();
  });

  it('renders rule names', () => {
    renderSettings();
    expect(screen.getByText('Bad Words Filter')).toBeInTheDocument();
    expect(screen.getByText('Anti Spam')).toBeInTheDocument();
  });

  it('renders section headers', () => {
    renderSettings();
    expect(screen.getByText('Filter Rules')).toBeInTheDocument();
    expect(screen.getByText('Escalation Thresholds')).toBeInTheDocument();
  });

  it('renders Enabled and Disabled badges', () => {
    renderSettings();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders escalation thresholds', () => {
    renderSettings();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('AutoModSettings -- empty state', () => {
  it('shows empty message when no rules', () => {
    renderSettings({ rules: [] });
    expect(screen.getByText('No rules configured.')).toBeInTheDocument();
  });

  it('shows empty message when no thresholds', () => {
    renderSettings({ escalationThresholds: [] });
    expect(screen.getByText('No escalation thresholds configured.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('AutoModSettings -- interactions', () => {
  it('calls onRuleCreate when Add Rule is clicked', () => {
    const onRuleCreate = vi.fn();
    renderSettings({ onRuleCreate });
    fireEvent.click(screen.getByText('Add Rule'));
    expect(onRuleCreate).toHaveBeenCalledTimes(1);
  });

  it('calls onRuleToggle when toggle is clicked', () => {
    const onRuleToggle = vi.fn();
    renderSettings({ onRuleToggle });
    fireEvent.click(screen.getByLabelText('Toggle Bad Words Filter'));
    expect(onRuleToggle).toHaveBeenCalledWith('r1', false);
  });

  it('calls onRuleDelete when delete is clicked', () => {
    const onRuleDelete = vi.fn();
    renderSettings({ onRuleDelete });
    // Use aria-label to target the delete buttons specifically (not select options)
    const deleteButtons = screen.getAllByLabelText(/^Delete /);
    fireEvent.click(deleteButtons[0]);
    expect(onRuleDelete).toHaveBeenCalledWith('r1');
  });
});
