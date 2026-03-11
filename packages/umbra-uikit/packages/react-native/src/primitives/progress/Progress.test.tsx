/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from './Progress';
import { componentSizes } from '@coexist/wisp-core/tokens/shared';
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

describe('Progress — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Progress /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('has progressbar accessibility role', () => {
    render(
      <Wrapper><Progress value={50} /></Wrapper>,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value prop
// ---------------------------------------------------------------------------

describe('Progress — value', () => {
  it('renders with value=0', () => {
    const { container } = render(
      <Wrapper><Progress value={0} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with value=50', () => {
    const { container } = render(
      <Wrapper><Progress value={50} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with value=100', () => {
    const { container } = render(
      <Wrapper><Progress value={100} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('displays formatted value when showValue is true', () => {
    render(
      <Wrapper><Progress value={75} showValue /></Wrapper>,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(
      <Wrapper><Progress value={50} label="Upload progress" /></Wrapper>,
    );
    expect(screen.getByText('Upload progress')).toBeInTheDocument();
  });

  it('renders indeterminate mode without crashing', () => {
    const { container } = render(
      <Wrapper><Progress indeterminate /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Progress — sizes', () => {
  componentSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Progress value={50} size={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
