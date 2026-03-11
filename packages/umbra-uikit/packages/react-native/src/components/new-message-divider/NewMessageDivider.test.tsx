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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NewMessageDivider — rendering', () => {
  it('renders default "New" label', () => {
    render(<Wrapper><NewMessageDivider /></Wrapper>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<Wrapper><NewMessageDivider label="3 new messages" /></Wrapper>);
    expect(screen.getByText('3 new messages')).toBeInTheDocument();
  });

  it('renders with accessibility label', () => {
    render(<Wrapper><NewMessageDivider /></Wrapper>);
    expect(screen.getByLabelText('New messages')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

describe('NewMessageDivider — color', () => {
  it('renders with default color without crashing', () => {
    render(<Wrapper><NewMessageDivider /></Wrapper>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with custom color without crashing', () => {
    render(<Wrapper><NewMessageDivider color="#6366f1" /></Wrapper>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});
