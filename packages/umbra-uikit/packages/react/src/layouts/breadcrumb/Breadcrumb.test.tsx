/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from './Breadcrumb';
import { breadcrumbSizes } from '@coexist/wisp-core/types/Breadcrumb.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ===========================================================================
// Breadcrumb (nav wrapper)
// ===========================================================================

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Breadcrumb — rendering', () => {
  it('renders a nav element', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('has aria-label="Breadcrumb"', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders an ordered list', () => {
    const { container } = render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(container.querySelector('ol')).toBeInTheDocument();
  });

  it('renders children items', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
          <BreadcrumbItem active>Current</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Separators
// ---------------------------------------------------------------------------

describe('Breadcrumb — separators', () => {
  it('inserts separators between items', () => {
    const { container } = render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    // Separator li elements have role="presentation"
    const separators = container.querySelectorAll('li[role="presentation"]');
    expect(separators.length).toBe(1);
  });

  it('marks separators as aria-hidden', () => {
    const { container } = render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    const separator = container.querySelector('li[role="presentation"]');
    expect(separator).toHaveAttribute('aria-hidden');
  });

  it('renders custom separator', () => {
    render(
      <Dark>
        <Breadcrumb separator={<span data-testid="custom-sep">/</span>}>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByTestId('custom-sep')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Breadcrumb — sizes', () => {
  breadcrumbSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <Breadcrumb size={size}>
            <BreadcrumbItem active>Page</BreadcrumbItem>
          </Breadcrumb>
        </Dark>,
      );
      expect(screen.getByText('Page')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('Breadcrumb — className and style', () => {
  it('passes className to nav', () => {
    render(
      <Dark>
        <Breadcrumb className="custom">
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByRole('navigation')).toHaveClass('custom');
  });

  it('merges user style', () => {
    render(
      <Dark>
        <Breadcrumb style={{ marginTop: 22 }}>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByRole('navigation').style.marginTop).toBe('22px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Breadcrumb — ref forwarding', () => {
  it('forwards ref to nav element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Breadcrumb ref={ref}>
          <BreadcrumbItem active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current!.tagName).toBe('NAV');
  });
});

// ===========================================================================
// BreadcrumbItem
// ===========================================================================

describe('BreadcrumbItem — link mode', () => {
  it('renders as an anchor when href is provided', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/home">Home</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    const link = screen.getByText('Home').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/home');
  });
});

describe('BreadcrumbItem — button mode', () => {
  it('renders as a button when onClick provided without href', () => {
    const onClick = vi.fn();
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem onClick={onClick}>Click Me</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('BreadcrumbItem — active mode', () => {
  it('renders as a span when active', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem active>Current</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    const span = screen.getByText('Current');
    expect(span.tagName).toBe('SPAN');
  });

  it('sets aria-current="page" when active', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem active>Current</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    // aria-current is on the li element
    const li = screen.getByText('Current').closest('li');
    expect(li).toHaveAttribute('aria-current', 'page');
  });
});

describe('BreadcrumbItem — icon', () => {
  it('renders icon when provided', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem href="/" icon={<svg data-testid="icon" />}>Home</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

describe('BreadcrumbItem — ref forwarding', () => {
  it('forwards ref to li element', () => {
    const ref = React.createRef<HTMLLIElement>();
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbItem ref={ref} active>Page</BreadcrumbItem>
        </Breadcrumb>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });
});

// ===========================================================================
// BreadcrumbSeparator
// ===========================================================================

describe('BreadcrumbSeparator — rendering', () => {
  it('renders default separator "/"', () => {
    const ref = React.createRef<HTMLLIElement>();
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbSeparator ref={ref} />
        </Breadcrumb>
      </Dark>,
    );
    expect(ref.current).toHaveTextContent('/');
  });

  it('renders custom children', () => {
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbSeparator>|</BreadcrumbSeparator>
        </Breadcrumb>
      </Dark>,
    );
    expect(screen.getByText('|')).toBeInTheDocument();
  });

  it('has role="presentation" and aria-hidden', () => {
    const ref = React.createRef<HTMLLIElement>();
    render(
      <Dark>
        <Breadcrumb>
          <BreadcrumbSeparator ref={ref} />
        </Breadcrumb>
      </Dark>,
    );
    expect(ref.current).toHaveAttribute('role', 'presentation');
    expect(ref.current).toHaveAttribute('aria-hidden');
  });
});
