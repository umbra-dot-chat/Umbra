/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './FormField';
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

describe('FormField — rendering', () => {
  it('renders children', () => {
    render(
      <Wrapper>
        <FormField>
          <span>Input control</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Input control')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('FormField — label', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <FormField label="Email">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(
      <Wrapper>
        <FormField>
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('FormField — error', () => {
  it('renders error message', () => {
    render(
      <Wrapper>
        <FormField label="Email" error="This field is required">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays error instead of description when both are provided', () => {
    render(
      <Wrapper>
        <FormField label="Email" description="Enter your email" error="Invalid email">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

describe('FormField — description', () => {
  it('renders description text', () => {
    render(
      <Wrapper>
        <FormField label="Name" description="Your full name">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Your full name')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Required indicator
// ---------------------------------------------------------------------------

describe('FormField — required', () => {
  it('shows required indicator (*) when required is true', () => {
    render(
      <Wrapper>
        <FormField label="Password" required>
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText(/\*/)).toBeInTheDocument();
  });

  it('does not show required indicator when required is false', () => {
    const { container } = render(
      <Wrapper>
        <FormField label="Optional">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    // The label should render but without the asterisk marker
    expect(screen.getByText('Optional')).toBeInTheDocument();
    // Verify no asterisk text node exists
    expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('FormField — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders with size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <FormField label="Field" size={size}>
            <span>{size}</span>
          </FormField>
        </Wrapper>,
      );
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('FormField — orientation', () => {
  it('renders with vertical orientation (default) without crashing', () => {
    render(
      <Wrapper>
        <FormField label="Vertical" orientation="vertical">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Vertical')).toBeInTheDocument();
  });

  it('renders with horizontal orientation without crashing', () => {
    render(
      <Wrapper>
        <FormField label="Horizontal" orientation="horizontal">
          <span>input</span>
        </FormField>
      </Wrapper>,
    );
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
  });
});
