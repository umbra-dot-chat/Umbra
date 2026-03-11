/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Text } from 'react-native';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper — standard tabs with three panels
// ---------------------------------------------------------------------------

function TestTabs(props: Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Wrapper>
      <Tabs defaultValue="tab1" {...props}>
        <TabList>
          <Tab value="tab1">Account</Tab>
          <Tab value="tab2">Security</Tab>
          <Tab value="tab3">Billing</Tab>
        </TabList>
        <TabPanel value="tab1">
          <Text>Account panel content</Text>
        </TabPanel>
        <TabPanel value="tab2">
          <Text>Security panel content</Text>
        </TabPanel>
        <TabPanel value="tab3">
          <Text>Billing panel content</Text>
        </TabPanel>
      </Tabs>
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Tabs — rendering', () => {
  it('renders all tab labels', () => {
    render(<TestTabs />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('tabs have tab accessibility role', () => {
    const { container } = render(<TestTabs />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
  });

  it('has correct displayNames', () => {
    expect(Tabs.displayName).toBe('Tabs');
    expect(TabList.displayName).toBe('TabList');
    expect(Tab.displayName).toBe('Tab');
    expect(TabPanel.displayName).toBe('TabPanel');
  });
});

// ---------------------------------------------------------------------------
// Active panel
// ---------------------------------------------------------------------------

describe('Tabs — active panel', () => {
  it('shows the panel for the default active tab', () => {
    render(<TestTabs defaultValue="tab1" />);
    expect(screen.getByText('Account panel content')).toBeInTheDocument();
    expect(screen.queryByText('Security panel content')).toBeNull();
    expect(screen.queryByText('Billing panel content')).toBeNull();
  });

  it('marks the active tab as selected', () => {
    const { container } = render(<TestTabs defaultValue="tab1" />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches panel when a different tab is clicked', () => {
    render(<TestTabs defaultValue="tab1" />);
    // Click the Security tab
    fireEvent.click(screen.getByText('Security'));
    expect(screen.queryByText('Account panel content')).toBeNull();
    expect(screen.getByText('Security panel content')).toBeInTheDocument();
  });

  it('updates aria-selected when switching tabs', () => {
    const { container } = render(<TestTabs defaultValue="tab1" />);
    fireEvent.click(screen.getByText('Billing'));
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('Tabs — onChange', () => {
  it('calls onChange with the selected tab value', () => {
    const onChange = vi.fn();
    render(<TestTabs onChange={onChange} />);
    fireEvent.click(screen.getByText('Security'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('tab2');
  });
});

// ---------------------------------------------------------------------------
// Controlled value
// ---------------------------------------------------------------------------

describe('Tabs — controlled', () => {
  it('respects controlled value prop', () => {
    render(<TestTabs value="tab3" />);
    expect(screen.getByText('Billing panel content')).toBeInTheDocument();
    expect(screen.queryByText('Account panel content')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Disabled tab
// ---------------------------------------------------------------------------

describe('Tabs — disabled', () => {
  it('does not switch to a disabled tab when clicked', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Tabs defaultValue="tab1" onChange={onChange}>
          <TabList>
            <Tab value="tab1">Active</Tab>
            <Tab value="tab2" disabled>Disabled</Tab>
          </TabList>
          <TabPanel value="tab1">
            <Text>Active content</Text>
          </TabPanel>
          <TabPanel value="tab2">
            <Text>Disabled content</Text>
          </TabPanel>
        </Tabs>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Active content')).toBeInTheDocument();
    expect(screen.queryByText('Disabled content')).toBeNull();
  });
});
