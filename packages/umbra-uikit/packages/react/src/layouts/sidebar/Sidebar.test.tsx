/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar, SidebarSection, SidebarItem } from './Sidebar';
import { sidebarWidths, sidebarPositions } from '@coexist/wisp-core/types/Sidebar.types';
import type { SidebarWidth, SidebarPosition } from '@coexist/wisp-core/types/Sidebar.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSidebar(props: Record<string, unknown> = {}) {
  return render(
    <Dark>
      <Sidebar {...props}>
        <SidebarSection title="Main">
          <SidebarItem icon={<span data-testid="home-icon">H</span>} label="Dashboard" active />
          <SidebarItem icon={<span data-testid="team-icon">T</span>} label="Team" />
        </SidebarSection>
        <SidebarSection title="Settings">
          <SidebarItem label="Preferences" />
        </SidebarSection>
      </Sidebar>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Sidebar — rendering', () => {
  it('renders navigation element', () => {
    renderSidebar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders section titles', () => {
    renderSidebar();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders item labels', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('renders item icons', () => {
    renderSidebar();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('team-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Width presets
// ---------------------------------------------------------------------------

describe('Sidebar — width presets', () => {
  (sidebarWidths as readonly SidebarWidth[]).forEach((width) => {
    it(`renders width="${width}" without crashing`, () => {
      renderSidebar({ width });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('data-sidebar-width', width);
    });
  });
});

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

describe('Sidebar — position', () => {
  (sidebarPositions as readonly SidebarPosition[]).forEach((pos) => {
    it(`renders position="${pos}" without crashing`, () => {
      renderSidebar({ position: pos });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('data-sidebar-position', pos);
    });
  });

  it('defaults to position="left"', () => {
    renderSidebar();
    expect(screen.getByRole('navigation')).toHaveAttribute('data-sidebar-position', 'left');
  });
});

// ---------------------------------------------------------------------------
// Collapsible (uncontrolled)
// ---------------------------------------------------------------------------

describe('Sidebar — collapsible (uncontrolled)', () => {
  it('renders collapse toggle when collapsible=true', () => {
    renderSidebar({ collapsible: true });
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('does not render collapse toggle when collapsible=false', () => {
    renderSidebar({ collapsible: false });
    expect(screen.queryByLabelText('Collapse sidebar')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Expand sidebar')).not.toBeInTheDocument();
  });

  it('toggles collapsed state on button click', () => {
    renderSidebar({ collapsible: true });
    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseBtn);
    // After collapse, the toggle label changes
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toHaveAttribute('data-sidebar-width', 'collapsed');
  });

  it('calls onCollapsedChange when toggling', () => {
    const handleChange = vi.fn();
    renderSidebar({ collapsible: true, onCollapsedChange: handleChange });
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Collapsible (controlled)
// ---------------------------------------------------------------------------

describe('Sidebar — collapsible (controlled)', () => {
  it('respects controlled collapsed=true', () => {
    renderSidebar({ collapsible: true, collapsed: true });
    expect(screen.getByRole('navigation')).toHaveAttribute('data-sidebar-width', 'collapsed');
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('respects controlled collapsed=false', () => {
    renderSidebar({ collapsible: true, collapsed: false });
    expect(screen.getByRole('navigation')).toHaveAttribute('data-sidebar-width', 'default');
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SidebarItem — active state
// ---------------------------------------------------------------------------

describe('SidebarItem — active state', () => {
  it('sets aria-current="page" on active item', () => {
    renderSidebar();
    const dashboardItem = screen.getByText('Dashboard').closest('[role="button"], a');
    expect(dashboardItem).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive item', () => {
    renderSidebar();
    const teamItem = screen.getByText('Team').closest('[role="button"], a');
    expect(teamItem).not.toHaveAttribute('aria-current');
  });
});

// ---------------------------------------------------------------------------
// SidebarItem — disabled
// ---------------------------------------------------------------------------

describe('SidebarItem — disabled', () => {
  it('sets aria-disabled on disabled item', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Disabled Item" disabled />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const item = screen.getByText('Disabled Item').closest('[role="button"]');
    expect(item).toHaveAttribute('aria-disabled');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Disabled" disabled onClick={handleClick} />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const item = screen.getByText('Disabled').closest('[role="button"]')!;
    fireEvent.click(item);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SidebarItem — onClick
// ---------------------------------------------------------------------------

describe('SidebarItem — onClick', () => {
  it('calls onClick handler on click', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Clickable" onClick={handleClick} />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const item = screen.getByText('Clickable').closest('[role="button"]')!;
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// SidebarItem — href (renders as anchor)
// ---------------------------------------------------------------------------

describe('SidebarItem — href', () => {
  it('renders as an anchor when href is provided', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Link" href="/dashboard" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const link = screen.getByText('Link').closest('a');
    expect(link).toBeTruthy();
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});

// ---------------------------------------------------------------------------
// SidebarItem — badge
// ---------------------------------------------------------------------------

describe('SidebarItem — badge', () => {
  it('renders badge content', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Alerts" badge={<span data-testid="badge">3</span>} />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SidebarSection — collapsible
// ---------------------------------------------------------------------------

describe('SidebarSection — collapsible', () => {
  it('toggles section content when collapsible title is clicked', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection title="Collapsible" collapsible>
            <SidebarItem label="Inside" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const titleButton = screen.getByText('Collapsible').closest('button')!;
    expect(titleButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(titleButton);
    expect(titleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts collapsed when defaultCollapsed=true', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection title="StartClosed" collapsible defaultCollapsed>
            <SidebarItem label="Hidden" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const titleButton = screen.getByText('StartClosed').closest('button')!;
    expect(titleButton).toHaveAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Sidebar — accessibility', () => {
  it('has role="navigation"', () => {
    renderSidebar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('sections have role="group"', () => {
    renderSidebar();
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
  });

  it('non-link items have role="button"', () => {
    renderSidebar();
    const buttons = screen.getAllByRole('button');
    // Sidebar items without href render as role="button"
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Sidebar — className passthrough', () => {
  it('passes className to root nav', () => {
    renderSidebar({ className: 'sidebar-custom' });
    expect(screen.getByRole('navigation')).toHaveClass('sidebar-custom');
  });

  it('passes className to SidebarSection', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection title="Sec" className="section-custom">
            <SidebarItem label="Item" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('section-custom');
  });

  it('passes className to SidebarItem', () => {
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Item" className="item-custom" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    const item = screen.getByText('Item').closest('[role="button"]');
    expect(item).toHaveClass('item-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Sidebar — style merge', () => {
  it('merges user style onto root nav', () => {
    renderSidebar({ style: { marginTop: 42 } });
    expect(screen.getByRole('navigation')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Sidebar — ref forwarding', () => {
  it('forwards ref to root nav element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sidebar ref={ref}>
          <SidebarSection>
            <SidebarItem label="Item" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });

  it('forwards ref to SidebarSection', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Sidebar>
          <SidebarSection ref={ref}>
            <SidebarItem label="Item" />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to SidebarItem', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Item" ref={ref} />
          </SidebarSection>
        </Sidebar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
