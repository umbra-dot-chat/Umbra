/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NewMessageDivider } from './NewMessageDivider';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NewMessageDivider — rendering', () => {
  it('renders with role="separator"', () => {
    render(
      <Dark>
        <NewMessageDivider />
      </Dark>,
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders default "New" label', () => {
    render(
      <Dark>
        <NewMessageDivider />
      </Dark>,
    );
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(
      <Dark>
        <NewMessageDivider label="3 new messages" />
      </Dark>,
    );
    expect(screen.getByText('3 new messages')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Line color
// ---------------------------------------------------------------------------

describe('NewMessageDivider — color', () => {
  it('uses custom color when provided', () => {
    render(
      <Dark>
        <NewMessageDivider color="#6366f1" />
      </Dark>,
    );
    // The label span should have the custom color (jsdom normalizes hex to rgb)
    const label = screen.getByText('New');
    expect(label.style.color).toBe('rgb(99, 102, 241)');
  });

  it('uses theme danger color by default', () => {
    const { container } = render(
      <Dark>
        <NewMessageDivider />
      </Dark>,
    );
    const label = screen.getByText('New');
    // Should have some color set (the exact value depends on the dark theme)
    expect(label.style.color).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('NewMessageDivider — structure', () => {
  it('renders two line segments flanking the label', () => {
    render(
      <Dark>
        <NewMessageDivider />
      </Dark>,
    );
    const separator = screen.getByRole('separator');
    // Should have 3 children: line, label, line
    expect(separator.children).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('NewMessageDivider — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <NewMessageDivider ref={ref} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('NewMessageDivider — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <NewMessageDivider className="custom-divider" />
      </Dark>,
    );
    expect(container.querySelector('.custom-divider')).toBeInTheDocument();
  });
});
