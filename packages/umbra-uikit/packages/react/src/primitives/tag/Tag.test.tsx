/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tag } from './Tag';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveTagColors } from '@coexist/wisp-core/styles/Tag.styles';
import { createTheme } from '@coexist/wisp-core/theme/create-theme';

const darkTheme = createTheme({ mode: 'dark' });
const lightTheme = createTheme({ mode: 'light' });

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Tag — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Tag>Hello</Tag></Dark>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders as a span with role="option"', () => {
    render(<Dark><Tag>Test</Tag></Dark>);
    expect(screen.getByRole('option')).toBeInTheDocument();
    expect(screen.getByRole('option').tagName).toBe('SPAN');
  });

  it('passes className through', () => {
    render(<Dark><Tag className="custom">Test</Tag></Dark>);
    expect(screen.getByRole('option')).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Tag — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Tag size={size}>Size {size}</Tag></Dark>);
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Close / Remove button
// ---------------------------------------------------------------------------

describe('Tag — onRemove', () => {
  it('renders close button when onRemove is provided', () => {
    render(<Dark><Tag onRemove={() => {}}>Removable</Tag></Dark>);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('does not render close button when onRemove is not provided', () => {
    render(<Dark><Tag>No close</Tag></Dark>);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('calls onRemove when close button is clicked', () => {
    const onRemove = vi.fn();
    render(<Dark><Tag onRemove={onRemove}>Removable</Tag></Dark>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('stops propagation when close button is clicked (onClick on tag not called)', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <Dark>
        <Tag onClick={onClick} onRemove={onRemove}>Removable</Tag>
      </Dark>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe('Tag — selected', () => {
  it('sets aria-selected="true" when selected', () => {
    render(<Dark><Tag selected>Selected</Tag></Dark>);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });

  it('sets aria-selected="false" when not selected', () => {
    render(<Dark><Tag>Not Selected</Tag></Dark>);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('Tag — disabled', () => {
  it('sets aria-disabled when disabled', () => {
    render(<Dark><Tag disabled>Disabled</Tag></Dark>);
    expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onRemove when disabled', () => {
    const onRemove = vi.fn();
    render(<Dark><Tag disabled onRemove={onRemove}>Disabled</Tag></Dark>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Leading icon
// ---------------------------------------------------------------------------

describe('Tag — icon', () => {
  it('renders leading icon when provided', () => {
    const MockIcon = ({ size, color, strokeWidth }: { size?: number | string; color?: string; strokeWidth?: number }) => (
      <svg data-testid="mock-icon" width={size} height={size}>
        <circle r="10" />
      </svg>
    );
    render(<Dark><Tag icon={MockIcon}>With Icon</Tag></Dark>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Tag — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Tag skeleton>Skeleton</Tag></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render option element when skeleton', () => {
    render(<Dark><Tag skeleton>Skeleton</Tag></Dark>);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — selected tag text on accent
// ---------------------------------------------------------------------------

describe('Tag — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('selected text on accent passes AA-large (3:1)', () => {
      const colors = resolveTagColors(true, false, darkTheme);
      if (!isHex(colors.text) || !isHex(colors.bg)) return;
      const ratio = contrastRatio(colors.text, colors.bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTagColors(false, false, darkTheme);
      if (!isHex(colors.text) || !isHex(darkTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.text, darkTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('light mode', () => {
    it('selected text on accent passes AA-large (3:1)', () => {
      const colors = resolveTagColors(true, false, lightTheme);
      if (!isHex(colors.text) || !isHex(colors.bg)) return;
      const ratio = contrastRatio(colors.text, colors.bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTagColors(false, false, lightTheme);
      if (!isHex(colors.text) || !isHex(lightTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.text, lightTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
