/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextArea } from './TextArea';
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

describe('TextArea — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <TextArea testID="textarea" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <TextArea label="Description" />
      </Wrapper>,
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(
      <Wrapper>
        <TextArea hint="Max 500 characters" />
      </Wrapper>,
    );
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument();
  });

  it('renders error message when error is a string', () => {
    render(
      <Wrapper>
        <TextArea error="This field is required" />
      </Wrapper>,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders warning message when warning is a string', () => {
    render(
      <Wrapper>
        <TextArea warning="Content may be too long" />
      </Wrapper>,
    );
    expect(screen.getByText('Content may be too long')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(TextArea.displayName).toBe('TextArea');
  });
});

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------

describe('TextArea — placeholder', () => {
  it('renders with placeholder text', () => {
    render(
      <Wrapper>
        <TextArea placeholder="Enter your text..." testID="textarea" />
      </Wrapper>,
    );
    // react-native-web renders TextInput as a <textarea> element with placeholder attribute
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter your text...');
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('TextArea — disabled', () => {
  it('is not editable when disabled', () => {
    render(
      <Wrapper>
        <TextArea testID="textarea" disabled />
      </Wrapper>,
    );
    // react-native-web sets readOnly or disabled on the element when editable=false
    const textarea = screen.getByTestId('textarea');
    // TextInput with editable=false renders as disabled in react-native-web
    expect(textarea).toHaveAttribute('disabled');
  });

  it('renders with reduced opacity when disabled', () => {
    const { container } = render(
      <Wrapper>
        <TextArea disabled />
      </Wrapper>,
    );
    // The container View wrapping the TextInput has opacity 0.5
    // We look for the element with the border (the container style)
    const root = container.firstChild as HTMLElement;
    // The wrapper is the root, the second child is the bordered container
    const borderedContainer = root.children[0] as HTMLElement;
    expect(borderedContainer.style.opacity).toBe('0.5');
  });
});

// ---------------------------------------------------------------------------
// onChangeText callback
// ---------------------------------------------------------------------------

describe('TextArea — onChangeText', () => {
  it('calls onChangeText when text is entered', () => {
    const handleChangeText = vi.fn();
    render(
      <Wrapper>
        <TextArea testID="textarea" onChangeText={handleChangeText} />
      </Wrapper>,
    );
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(handleChangeText).toHaveBeenCalled();
  });

  it('renders as a multiline textarea element', () => {
    render(
      <Wrapper>
        <TextArea testID="textarea" />
      </Wrapper>,
    );
    const el = screen.getByTestId('textarea');
    // react-native-web renders multiline TextInput as a <textarea> tag
    expect(el.tagName).toBe('TEXTAREA');
  });
});
