/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Collapse } from './Collapse';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Collapse — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Collapse>
          <span>Collapse content</span>
        </Collapse>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children when open', () => {
    render(
      <Wrapper>
        <Collapse open>
          <span>Expanded content</span>
        </Collapse>
      </Wrapper>,
    );
    expect(screen.getByText('Expanded content')).toBeInTheDocument();
  });

  it('renders children in DOM when closed (unless unmountOnClose)', () => {
    render(
      <Wrapper>
        <Collapse open={false}>
          <span>Hidden content</span>
        </Collapse>
      </Wrapper>,
    );
    // Content is still in the DOM, just visually collapsed via maxHeight: 0
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('unmounts children when closed with unmountOnClose', () => {
    const { queryByText } = render(
      <Wrapper>
        <Collapse open={false} unmountOnClose>
          <span>Unmounted content</span>
        </Collapse>
      </Wrapper>,
    );
    expect(queryByText('Unmounted content')).not.toBeInTheDocument();
  });
});
