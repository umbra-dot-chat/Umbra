/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TagInput } from './TagInput';
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

describe('TagInput — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <TagInput />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders a text input for entering new tags', () => {
    render(
      <Wrapper>
        <TagInput />
      </Wrapper>,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Initial tags
// ---------------------------------------------------------------------------

describe('TagInput — initial tags', () => {
  it('renders tags from defaultValue', () => {
    render(
      <Wrapper>
        <TagInput defaultValue={['React', 'TypeScript', 'Vitest']} />
      </Wrapper>,
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Vitest')).toBeInTheDocument();
  });

  it('renders tags from controlled value', () => {
    render(
      <Wrapper>
        <TagInput value={['Alpha', 'Beta']} />
      </Wrapper>,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders remove buttons for each tag', () => {
    render(
      <Wrapper>
        <TagInput defaultValue={['One', 'Two']} />
      </Wrapper>,
    );
    const removeButtons = screen.getAllByLabelText(/^Remove /);
    expect(removeButtons).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('TagInput — disabled', () => {
  it('makes the text input read-only when disabled is true', () => {
    render(
      <Wrapper>
        <TagInput disabled />
      </Wrapper>,
    );
    // react-native-web translates editable={false} to the readonly attribute
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders label and hint when provided', () => {
    render(
      <Wrapper>
        <TagInput label="Tags" hint="Separate with commas" disabled />
      </Wrapper>,
    );
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Separate with commas')).toBeInTheDocument();
  });
});
