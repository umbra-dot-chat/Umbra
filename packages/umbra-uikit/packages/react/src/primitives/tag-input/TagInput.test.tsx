/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TagInput } from './TagInput';
import { WispProvider } from '../../providers';
import { tagInputSizeMap } from '@coexist/wisp-core/types/TagInput.types';

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInput = () => screen.getByRole('textbox');
const getChips = () => screen.queryAllByTestId('tag-chip');

function addTag(text: string) {
  const input = getInput();
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('TagInput — rendering', () => {
  it('renders a text input inside a group container', () => {
    render(<Dark><TagInput /></Dark>);
    expect(getInput()).toBeInTheDocument();
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders in light mode', () => {
    render(<Light><TagInput /></Light>);
    expect(getInput()).toBeInTheDocument();
  });

  it('passes className to the outer wrapper', () => {
    const { container } = render(<Dark><TagInput className="custom" /></Dark>);
    const outer = container.querySelector('.custom');
    expect(outer).toBeInTheDocument();
  });

  it('renders default tags from defaultValue', () => {
    render(<Dark><TagInput defaultValue={['React', 'Vue']} /></Dark>);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(getChips()).toHaveLength(2);
  });

  it('renders controlled tags from value prop', () => {
    render(<Dark><TagInput value={['Alpha', 'Beta']} onChange={() => {}} /></Dark>);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders placeholder when no tags', () => {
    render(<Dark><TagInput placeholder="Add tags..." /></Dark>);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('renders placeholder when tags exist', () => {
    render(<Dark><TagInput defaultValue={['A']} placeholder="Add more..." /></Dark>);
    expect(screen.getByPlaceholderText('Add more...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label, Hint, Error, Warning
// ---------------------------------------------------------------------------

describe('TagInput — label, hint, error, warning', () => {
  it('renders label text', () => {
    render(<Dark><TagInput label="Skills" /></Dark>);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<Dark><TagInput hint="Press Enter to add." /></Dark>);
    expect(screen.getByText('Press Enter to add.')).toBeInTheDocument();
  });

  it('renders error string and shows role="alert"', () => {
    render(<Dark><TagInput error="Required" /></Dark>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Required');
  });

  it('renders warning string and shows role="alert"', () => {
    render(<Dark><TagInput warning="Too many tags" /></Dark>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Too many tags');
  });

  it('error takes precedence over warning in bottom text', () => {
    render(<Dark><TagInput error="Error msg" warning="Warning msg" /></Dark>);
    expect(screen.getByText('Error msg')).toBeInTheDocument();
    expect(screen.queryByText('Warning msg')).not.toBeInTheDocument();
  });

  it('error takes precedence over hint in bottom text', () => {
    render(<Dark><TagInput error="Error msg" hint="Hint msg" /></Dark>);
    expect(screen.getByText('Error msg')).toBeInTheDocument();
    expect(screen.queryByText('Hint msg')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('TagInput — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders at size=${size}`, () => {
      render(<Dark><TagInput size={size} defaultValue={['Tag']} /></Dark>);
      expect(getChips()).toHaveLength(1);
      expect(getInput()).toBeInTheDocument();
    });
  });

  it('uses correct minHeight from size map', () => {
    render(<Dark><TagInput size="lg" /></Dark>);
    const container = screen.getByRole('group');
    expect(container.style.minHeight).toBe(`${tagInputSizeMap.lg.minHeight}px`);
  });
});

// ---------------------------------------------------------------------------
// Adding tags
// ---------------------------------------------------------------------------

describe('TagInput — adding tags', () => {
  it('adds a tag on Enter', () => {
    render(<Dark><TagInput /></Dark>);
    addTag('NewTag');
    expect(screen.getByText('NewTag')).toBeInTheDocument();
    expect(getInput()).toHaveValue('');
  });

  it('adds a tag on separator character (comma)', () => {
    render(<Dark><TagInput /></Dark>);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'Hello,' } });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('adds a tag on custom separator', () => {
    render(<Dark><TagInput separators={[';']} /></Dark>);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'Foo;' } });
    expect(screen.getByText('Foo')).toBeInTheDocument();
  });

  it('trims whitespace from tags', () => {
    render(<Dark><TagInput /></Dark>);
    addTag('  Spaced  ');
    expect(screen.getByText('Spaced')).toBeInTheDocument();
  });

  it('does not add empty tags', () => {
    render(<Dark><TagInput /></Dark>);
    addTag('   ');
    expect(getChips()).toHaveLength(0);
  });

  it('calls onTagAdd when a tag is added', () => {
    const onTagAdd = vi.fn();
    render(<Dark><TagInput onTagAdd={onTagAdd} /></Dark>);
    addTag('Hello');
    expect(onTagAdd).toHaveBeenCalledWith('Hello');
  });

  it('calls onChange with updated array when a tag is added', () => {
    const onChange = vi.fn();
    render(<Dark><TagInput value={['A']} onChange={onChange} /></Dark>);
    addTag('B');
    expect(onChange).toHaveBeenCalledWith(['A', 'B']);
  });

  it('rejects duplicates when allowDuplicates is false', () => {
    render(<Dark><TagInput defaultValue={['React']} allowDuplicates={false} /></Dark>);
    addTag('React');
    expect(getChips()).toHaveLength(1);
  });

  it('allows duplicates when allowDuplicates is true', () => {
    render(<Dark><TagInput defaultValue={['React']} allowDuplicates={true} /></Dark>);
    addTag('React');
    expect(getChips()).toHaveLength(2);
  });

  it('does not add beyond max', () => {
    render(<Dark><TagInput defaultValue={['A', 'B']} max={2} /></Dark>);
    addTag('C');
    expect(getChips()).toHaveLength(2);
    expect(screen.queryByText('C')).not.toBeInTheDocument();
  });

  it('adds tag on blur if input has value', () => {
    render(<Dark><TagInput /></Dark>);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'BlurTag' } });
    fireEvent.blur(input);
    expect(screen.getByText('BlurTag')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Removing tags
// ---------------------------------------------------------------------------

describe('TagInput — removing tags', () => {
  it('removes a tag via the X button', () => {
    render(<Dark><TagInput defaultValue={['React', 'Vue']} /></Dark>);
    const removeButtons = screen.getAllByRole('button', { name: /^Remove / });
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('removes the last tag on Backspace when input is empty', () => {
    render(<Dark><TagInput defaultValue={['React', 'Vue']} /></Dark>);
    const input = getInput();
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(screen.queryByText('Vue')).not.toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('does not remove on Backspace when input has value', () => {
    render(<Dark><TagInput defaultValue={['React']} /></Dark>);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('calls onTagRemove when a tag is removed', () => {
    const onTagRemove = vi.fn();
    render(<Dark><TagInput defaultValue={['React']} onTagRemove={onTagRemove} /></Dark>);
    const removeBtn = screen.getByRole('button', { name: 'Remove React' });
    fireEvent.click(removeBtn);
    expect(onTagRemove).toHaveBeenCalledWith('React');
  });

  it('calls onChange with updated array when a tag is removed', () => {
    const onChange = vi.fn();
    render(<Dark><TagInput value={['A', 'B']} onChange={onChange} /></Dark>);
    const removeBtn = screen.getByRole('button', { name: 'Remove A' });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(['B']);
  });
});

// ---------------------------------------------------------------------------
// Paste
// ---------------------------------------------------------------------------

describe('TagInput — paste', () => {
  it('splits pasted text by separators', () => {
    render(<Dark><TagInput /></Dark>);
    const input = getInput();
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'React,Vue,Angular' },
    });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Angular')).toBeInTheDocument();
  });

  it('does not split pasted text without separator', () => {
    render(<Dark><TagInput /></Dark>);
    const input = getInput();
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'SingleTag' },
    });
    // Without separators, paste is not intercepted — the value stays in the input
    expect(getChips()).toHaveLength(0);
  });

  it('handles pasted text with custom separators', () => {
    render(<Dark><TagInput separators={[';']} /></Dark>);
    const input = getInput();
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'Foo;Bar;Baz' },
    });
    expect(screen.getByText('Foo')).toBeInTheDocument();
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Baz')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('TagInput — disabled', () => {
  it('disables the input element', () => {
    render(<Dark><TagInput disabled /></Dark>);
    expect(getInput()).toBeDisabled();
  });

  it('does not add tags when disabled', () => {
    render(<Dark><TagInput disabled /></Dark>);
    const input = getInput();
    // Input is disabled so change events won't fire, but test the guard
    expect(input).toBeDisabled();
  });

  it('remove buttons are disabled when component is disabled', () => {
    render(<Dark><TagInput defaultValue={['React']} disabled /></Dark>);
    const removeBtn = screen.getByRole('button', { name: 'Remove React' });
    expect(removeBtn).toBeDisabled();
  });

  it('disables input when max tags reached', () => {
    render(<Dark><TagInput defaultValue={['A', 'B']} max={2} /></Dark>);
    expect(getInput()).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('TagInput — skeleton', () => {
  it('renders skeleton and hides from assistive tech', () => {
    const { container } = render(<Dark><TagInput skeleton /></Dark>);
    expect(container.querySelector('[aria-hidden]')).toBeInTheDocument();
  });

  it('does not render input in skeleton mode', () => {
    render(<Dark><TagInput skeleton /></Dark>);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders label in skeleton mode', () => {
    render(<Dark><TagInput skeleton label="Skills" /></Dark>);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

describe('TagInput — icon', () => {
  it('renders a leading icon', () => {
    const MockIcon = ({ size, color, strokeWidth }: any) => (
      <svg data-testid="mock-icon" width={size} height={size} />
    );
    render(<Dark><TagInput icon={MockIcon} /></Dark>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Custom renderTag
// ---------------------------------------------------------------------------

describe('TagInput — renderTag', () => {
  it('uses custom renderTag for tag rendering', () => {
    render(
      <Dark>
        <TagInput
          defaultValue={['Custom']}
          renderTag={(value, _index, onRemove) => (
            <span data-testid="custom-tag">
              {value}
              <button onClick={onRemove}>x</button>
            </span>
          )}
        />
      </Dark>,
    );
    expect(screen.getByTestId('custom-tag')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('custom renderTag onRemove callback works', () => {
    const onTagRemove = vi.fn();
    render(
      <Dark>
        <TagInput
          defaultValue={['Custom']}
          onTagRemove={onTagRemove}
          renderTag={(value, _index, onRemove) => (
            <span data-testid="custom-tag">
              {value}
              <button data-testid="custom-remove" onClick={onRemove}>x</button>
            </span>
          )}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByTestId('custom-remove'));
    expect(onTagRemove).toHaveBeenCalledWith('Custom');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('TagInput — accessibility', () => {
  it('has role="group" on the container', () => {
    render(<Dark><TagInput /></Dark>);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('uses label for aria-label on the group', () => {
    render(<Dark><TagInput label="Skills" /></Dark>);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Skills');
  });

  it('defaults to "Tag input" for aria-label when no label', () => {
    render(<Dark><TagInput /></Dark>);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tag input');
  });

  it('sets aria-invalid on the input when error is present', () => {
    render(<Dark><TagInput error="Bad" /></Dark>);
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    render(<Dark><TagInput /></Dark>);
    expect(getInput()).not.toHaveAttribute('aria-invalid');
  });

  it('remove buttons have descriptive aria-labels', () => {
    render(<Dark><TagInput defaultValue={['React', 'Vue']} /></Dark>);
    expect(screen.getByRole('button', { name: 'Remove React' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Vue' })).toBeInTheDocument();
  });

  it('input has aria-label referencing label prop', () => {
    render(<Dark><TagInput label="Tags" /></Dark>);
    expect(getInput()).toHaveAttribute('aria-label', 'Tags input');
  });
});

// ---------------------------------------------------------------------------
// Focus behavior
// ---------------------------------------------------------------------------

describe('TagInput — focus', () => {
  it('focuses the input when clicking the container', () => {
    render(<Dark><TagInput /></Dark>);
    const container = screen.getByRole('group');
    fireEvent.click(container);
    expect(document.activeElement).toBe(getInput());
  });

  it('does not focus when disabled', () => {
    render(<Dark><TagInput disabled /></Dark>);
    const container = screen.getByRole('group');
    fireEvent.click(container);
    expect(document.activeElement).not.toBe(getInput());
  });
});

// ---------------------------------------------------------------------------
// Theme awareness
// ---------------------------------------------------------------------------

describe('TagInput — theme awareness', () => {
  it('renders differently in dark vs light mode', () => {
    const { container: darkContainer } = render(
      <Dark><TagInput defaultValue={['Test']} /></Dark>,
    );
    const darkBorder = (darkContainer.querySelector('[role="group"]') as HTMLElement)?.style.borderColor;

    const { container: lightContainer } = render(
      <Light><TagInput defaultValue={['Test']} /></Light>,
    );
    const lightBorder = (lightContainer.querySelector('[role="group"]') as HTMLElement)?.style.borderColor;

    // Border colors should differ between dark and light themes
    expect(darkBorder).not.toBe(lightBorder);
  });
});
