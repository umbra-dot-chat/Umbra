/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper: default composed Tabs
// ---------------------------------------------------------------------------

function renderTabs(props: Record<string, unknown> = {}) {
  return render(
    <Dark>
      <Tabs defaultValue="one" {...props}>
        <TabList>
          <Tab value="one">First</Tab>
          <Tab value="two">Second</Tab>
          <Tab value="three">Third</Tab>
        </TabList>
        <TabPanel value="one">Content one</TabPanel>
        <TabPanel value="two">Content two</TabPanel>
        <TabPanel value="three">Content three</TabPanel>
      </Tabs>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Tabs — rendering', () => {
  it('renders tab buttons', () => {
    renderTabs();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('renders the active tab panel content', () => {
    renderTabs();
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('does not render inactive tab panel content', () => {
    renderTabs();
    expect(screen.queryByText('Content two')).not.toBeInTheDocument();
    expect(screen.queryByText('Content three')).not.toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const { container } = renderTabs();
    const root = container.querySelector('[data-orientation]');
    expect(root?.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled tab switching
// ---------------------------------------------------------------------------

describe('Tabs — uncontrolled switching', () => {
  it('switches tab panel content when clicking another tab', () => {
    renderTabs();
    fireEvent.click(screen.getByText('Second'));
    expect(screen.getByText('Content two')).toBeInTheDocument();
    expect(screen.queryByText('Content one')).not.toBeInTheDocument();
  });

  it('calls onChange callback on tab click', () => {
    const handleChange = vi.fn();
    renderTabs({ onChange: handleChange });
    fireEvent.click(screen.getByText('Second'));
    expect(handleChange).toHaveBeenCalledWith('two');
  });
});

// ---------------------------------------------------------------------------
// Controlled usage
// ---------------------------------------------------------------------------

describe('Tabs — controlled usage', () => {
  it('respects the controlled value prop', () => {
    render(
      <Dark>
        <Tabs value="two">
          <TabList>
            <Tab value="one">First</Tab>
            <Tab value="two">Second</Tab>
          </TabList>
          <TabPanel value="one">Content one</TabPanel>
          <TabPanel value="two">Content two</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(screen.getByText('Content two')).toBeInTheDocument();
    expect(screen.queryByText('Content one')).not.toBeInTheDocument();
  });

  it('does not change active tab internally when controlled', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <Tabs value="one" onChange={handleChange}>
          <TabList>
            <Tab value="one">First</Tab>
            <Tab value="two">Second</Tab>
          </TabList>
          <TabPanel value="one">Content one</TabPanel>
          <TabPanel value="two">Content two</TabPanel>
        </Tabs>
      </Dark>,
    );
    fireEvent.click(screen.getByText('Second'));
    expect(handleChange).toHaveBeenCalledWith('two');
    // Still shows panel one because value is controlled
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('Tabs — orientation', () => {
  it('defaults to horizontal orientation', () => {
    const { container } = renderTabs();
    const root = container.querySelector('[data-orientation]');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('supports vertical orientation', () => {
    const { container } = renderTabs({ orientation: 'vertical' });
    const root = container.querySelector('[data-orientation]');
    expect(root).toHaveAttribute('data-orientation', 'vertical');
  });

  it('sets aria-orientation on the tablist', () => {
    renderTabs({ orientation: 'vertical' });
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
  });
});

// ---------------------------------------------------------------------------
// Disabled tab
// ---------------------------------------------------------------------------

describe('Tabs — disabled tab', () => {
  it('does not switch to a disabled tab on click', () => {
    render(
      <Dark>
        <Tabs defaultValue="one">
          <TabList>
            <Tab value="one">First</Tab>
            <Tab value="two" disabled>Second</Tab>
          </TabList>
          <TabPanel value="one">Content one</TabPanel>
          <TabPanel value="two">Content two</TabPanel>
        </Tabs>
      </Dark>,
    );
    fireEvent.click(screen.getByText('Second'));
    expect(screen.getByText('Content one')).toBeInTheDocument();
    expect(screen.queryByText('Content two')).not.toBeInTheDocument();
  });

  it('sets aria-disabled on the disabled tab', () => {
    render(
      <Dark>
        <Tabs defaultValue="one">
          <TabList>
            <Tab value="one">First</Tab>
            <Tab value="two" disabled>Second</Tab>
          </TabList>
          <TabPanel value="one">Content one</TabPanel>
          <TabPanel value="two">Content two</TabPanel>
        </Tabs>
      </Dark>,
    );
    const disabledTab = screen.getByText('Second').closest('button')!;
    expect(disabledTab).toHaveAttribute('aria-disabled');
    expect(disabledTab).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation (horizontal)
// ---------------------------------------------------------------------------

describe('Tabs — keyboard navigation (horizontal)', () => {
  it('ArrowRight moves focus and activates next tab', () => {
    renderTabs();
    const firstTab = screen.getByText('First');
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('ArrowLeft moves focus and activates previous tab', () => {
    renderTabs();
    const secondTab = screen.getByText('Second');
    fireEvent.click(secondTab);
    fireEvent.keyDown(secondTab, { key: 'ArrowLeft' });
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('Home moves to the first tab', () => {
    renderTabs();
    fireEvent.click(screen.getByText('Third'));
    const thirdTab = screen.getByText('Third');
    fireEvent.keyDown(thirdTab, { key: 'Home' });
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('End moves to the last tab', () => {
    renderTabs();
    const firstTab = screen.getByText('First');
    fireEvent.keyDown(firstTab, { key: 'End' });
    expect(screen.getByText('Content three')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation (vertical)
// ---------------------------------------------------------------------------

describe('Tabs — keyboard navigation (vertical)', () => {
  it('ArrowDown moves to the next tab in vertical orientation', () => {
    renderTabs({ orientation: 'vertical' });
    const firstTab = screen.getByText('First');
    fireEvent.keyDown(firstTab, { key: 'ArrowDown' });
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('ArrowUp moves to the previous tab in vertical orientation', () => {
    renderTabs({ orientation: 'vertical' });
    fireEvent.click(screen.getByText('Second'));
    const secondTab = screen.getByText('Second');
    fireEvent.keyDown(secondTab, { key: 'ArrowUp' });
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Icon rendering
// ---------------------------------------------------------------------------

describe('Tabs — icon', () => {
  it('renders an icon inside the tab', () => {
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList>
            <Tab value="a" icon={<span data-testid="tab-icon">I</span>}>Label</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('Tabs — accessibility', () => {
  it('tabs have role="tab"', () => {
    renderTabs();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('tablist has role="tablist"', () => {
    renderTabs();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('active tab panel has role="tabpanel"', () => {
    renderTabs();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('active tab has aria-selected=true', () => {
    renderTabs();
    const firstTab = screen.getByText('First').closest('button')!;
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('inactive tab has aria-selected=false', () => {
    renderTabs();
    const secondTab = screen.getByText('Second').closest('button')!;
    expect(secondTab).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has tabIndex=0, inactive tabs have tabIndex=-1', () => {
    renderTabs();
    expect(screen.getByText('First').closest('button')!).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Second').closest('button')!).toHaveAttribute('tabindex', '-1');
  });

  it('tab aria-controls matches panel id', () => {
    renderTabs();
    const firstTab = screen.getByText('First').closest('button')!;
    const panelId = firstTab.getAttribute('aria-controls');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', panelId);
  });

  it('panel aria-labelledby matches tab id', () => {
    renderTabs();
    const firstTab = screen.getByText('First').closest('button')!;
    const tabId = firstTab.getAttribute('id');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tabId);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Tabs — className passthrough', () => {
  it('passes className to root Tabs div', () => {
    const { container } = renderTabs({ className: 'tabs-custom' });
    const root = container.querySelector('[data-orientation]');
    expect(root).toHaveClass('tabs-custom');
  });

  it('passes className to TabList', () => {
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList className="tablist-custom">
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(screen.getByRole('tablist')).toHaveClass('tablist-custom');
  });

  it('passes className to Tab', () => {
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList>
            <Tab value="a" className="tab-custom">A</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(screen.getByRole('tab')).toHaveClass('tab-custom');
  });

  it('passes className to TabPanel', () => {
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList>
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a" className="panel-custom">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(screen.getByRole('tabpanel')).toHaveClass('panel-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Tabs — style merge', () => {
  it('merges user style onto the root element', () => {
    const { container } = renderTabs({ style: { marginTop: 42 } });
    const root = container.querySelector('[data-orientation]');
    expect(root).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Tabs — ref forwarding', () => {
  it('forwards ref to the root Tabs div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Tabs defaultValue="a" ref={ref}>
          <TabList>
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to a Tab button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList>
            <Tab value="a" ref={ref}>A</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('forwards ref to a TabPanel div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList>
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a" ref={ref}>Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to TabList', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Tabs defaultValue="a">
          <TabList ref={ref}>
            <Tab value="a">A</Tab>
          </TabList>
          <TabPanel value="a">Panel</TabPanel>
        </Tabs>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
