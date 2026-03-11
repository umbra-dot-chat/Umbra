/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SwitchGroup, CheckboxGroup } from './SwitchGroup';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const defaultOptions = [
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
  { value: 'sms', label: 'SMS' },
];

// ===========================================================================
// SwitchGroup
// ===========================================================================

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SwitchGroup — rendering', () => {
  it('renders a group element', () => {
    render(<Dark><SwitchGroup options={defaultOptions} /></Dark>);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders toggle switches for each option', () => {
    render(<Dark><SwitchGroup options={defaultOptions} /></Dark>);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
  });

  it('renders option labels', () => {
    render(<Dark><SwitchGroup options={defaultOptions} /></Dark>);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Group label and description
// ---------------------------------------------------------------------------

describe('SwitchGroup — label & description', () => {
  it('renders group label', () => {
    render(<Dark><SwitchGroup label="Notifications" options={defaultOptions} /></Dark>);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('sets aria-label on the group', () => {
    render(<Dark><SwitchGroup label="Notifications" options={defaultOptions} /></Dark>);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Notifications');
  });

  it('renders group description', () => {
    render(
      <Dark>
        <SwitchGroup label="Notifications" description="Choose channels" options={defaultOptions} />
      </Dark>,
    );
    expect(screen.getByText('Choose channels')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Option descriptions
// ---------------------------------------------------------------------------

describe('SwitchGroup — option descriptions', () => {
  it('renders option descriptions when provided', () => {
    const options = [
      { value: 'email', label: 'Email', description: 'Get email alerts' },
      { value: 'push', label: 'Push' },
    ];
    render(<Dark><SwitchGroup options={options} /></Dark>);
    expect(screen.getByText('Get email alerts')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Controlled vs Uncontrolled
// ---------------------------------------------------------------------------

describe('SwitchGroup — controlled / uncontrolled', () => {
  it('reflects controlled value', () => {
    render(<Dark><SwitchGroup options={defaultOptions} value={['email']} /></Dark>);
    const switches = screen.getAllByRole('switch');
    // First toggle (email) should be pressed
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects defaultValue in uncontrolled mode', () => {
    render(<Dark><SwitchGroup options={defaultOptions} defaultValue={['push']} /></Dark>);
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when a toggle is clicked', () => {
    const onChange = vi.fn();
    render(<Dark><SwitchGroup options={defaultOptions} value={[]} onChange={onChange} /></Dark>);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(onChange).toHaveBeenCalledWith(['email']);
  });

  it('removes value from array when toggling off', () => {
    const onChange = vi.fn();
    render(<Dark><SwitchGroup options={defaultOptions} value={['email']} onChange={onChange} /></Dark>);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('SwitchGroup — disabled', () => {
  it('disables all toggles when group is disabled', () => {
    render(<Dark><SwitchGroup options={defaultOptions} disabled /></Dark>);
    const switches = screen.getAllByRole('switch');
    switches.forEach((s) => expect(s).toBeDisabled());
  });

  it('disables individual option', () => {
    const options = [
      { value: 'email', label: 'Email', disabled: true },
      { value: 'push', label: 'Push' },
    ];
    render(<Dark><SwitchGroup options={options} /></Dark>);
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeDisabled();
    expect(switches[1]).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('SwitchGroup — error', () => {
  it('renders error message', () => {
    render(<Dark><SwitchGroup options={defaultOptions} error="Select at least one" /></Dark>);
    expect(screen.getByText('Select at least one')).toBeInTheDocument();
  });

  it('does not render error when not provided', () => {
    const { container } = render(<Dark><SwitchGroup options={defaultOptions} /></Dark>);
    // No error paragraph
    expect(container.querySelectorAll('p').length).toBeLessThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('SwitchGroup — className and style', () => {
  it('passes className to wrapper', () => {
    render(<Dark><SwitchGroup options={defaultOptions} className="custom" /></Dark>);
    expect(screen.getByRole('group')).toHaveClass('custom');
  });

  it('merges user style', () => {
    render(<Dark><SwitchGroup options={defaultOptions} style={{ marginTop: 42 }} /></Dark>);
    expect(screen.getByRole('group').style.marginTop).toBe('42px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('SwitchGroup — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><SwitchGroup ref={ref} options={defaultOptions} /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ===========================================================================
// CheckboxGroup
// ===========================================================================

describe('CheckboxGroup — rendering', () => {
  it('renders a group element', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} /></Dark>);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders checkboxes for each option', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} /></Dark>);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('renders option labels', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} /></Dark>);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});

describe('CheckboxGroup — controlled / uncontrolled', () => {
  it('reflects controlled value', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} value={['email']} /></Dark>);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('calls onChange when checkbox clicked', () => {
    const onChange = vi.fn();
    render(<Dark><CheckboxGroup options={defaultOptions} value={[]} onChange={onChange} /></Dark>);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith(['email']);
  });
});

describe('CheckboxGroup — disabled', () => {
  it('marks all checkboxes as aria-disabled when group is disabled', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} disabled /></Dark>);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((c) => expect(c).toHaveAttribute('aria-disabled', 'true'));
  });
});

describe('CheckboxGroup — error', () => {
  it('renders error message', () => {
    render(<Dark><CheckboxGroup options={defaultOptions} error="Required" /></Dark>);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});

describe('CheckboxGroup — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><CheckboxGroup ref={ref} options={defaultOptions} /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
