/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Combobox } from './Combobox';
import { WispProvider } from '../../providers';

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
];

describe('Combobox -- rendering', () => {
  it('renders a combobox input element', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByPlaceholderText('Pick fruit')).toBeInTheDocument();
  });

  it('renders with role combobox', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(<Dark><Combobox options={defaultOptions} className="custom" placeholder="test" /></Dark>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom');
  });
});

describe('Combobox -- opens on focus', () => {
  it('opens dropdown when input is focused', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows all options when opened', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(4);
  });

  it('sets aria-expanded to true when open', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Combobox -- filters on type', () => {
  it('filters options based on input text', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ap' } });
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Apple');
  });

  it('filters case-insensitively', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'BANANA' } });
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Banana');
  });
});

describe('Combobox -- selects option', () => {
  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" onChange={onChange} /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('displays selected label in input after selection', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit') as HTMLInputElement;
    fireEvent.focus(input);
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);
    expect(input.value).toBe('Apple');
  });

  it('closes dropdown after selection', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('works with controlled value', () => {
    const onChange = vi.fn();
    render(<Dark><Combobox options={defaultOptions} value="cherry" onChange={onChange} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit') as HTMLInputElement;
    expect(input.value).toBe('Cherry');
  });
});

describe('Combobox -- keyboard navigation', () => {
  it('ArrowDown opens dropdown when closed', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ArrowDown moves highlight down', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toContain('option-0');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toContain('option-1');
  });

  it('ArrowUp moves highlight up', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toContain('option-0');
  });

  it('Enter selects highlighted option', () => {
    const onChange = vi.fn();
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" onChange={onChange} /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('Escape closes dropdown', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Combobox -- empty state', () => {
  it('shows empty message when no options match filter', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" emptyMessage="Nothing here" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('shows empty message for empty options array', () => {
    render(<Dark><Combobox options={[]} placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});

describe('Combobox -- disabled', () => {
  it('sets disabled attribute on input', () => {
    render(<Dark><Combobox options={defaultOptions} disabled placeholder="Pick fruit" /></Dark>);
    expect(screen.getByPlaceholderText('Pick fruit')).toBeDisabled();
  });

  it('does not open dropdown when disabled', () => {
    render(<Dark><Combobox options={defaultOptions} disabled placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    fireEvent.focus(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not open on trigger click when disabled', () => {
    render(<Dark><Combobox options={defaultOptions} disabled placeholder="Pick fruit" /></Dark>);
    const trigger = screen.getByTestId('combobox-trigger');
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Combobox -- error', () => {
  it('shows error message string', () => {
    render(<Dark><Combobox options={defaultOptions} error="Required field" placeholder="Pick fruit" /></Dark>);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies aria-invalid when error is string', () => {
    render(<Dark><Combobox options={defaultOptions} error="Required" placeholder="Pick fruit" /></Dark>);
    expect(screen.getByPlaceholderText('Pick fruit')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies aria-invalid when error is boolean true', () => {
    render(<Dark><Combobox options={defaultOptions} error={true} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByPlaceholderText('Pick fruit')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not apply aria-invalid when error is false', () => {
    render(<Dark><Combobox options={defaultOptions} error={false} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByPlaceholderText('Pick fruit')).not.toHaveAttribute('aria-invalid');
  });

  it('error message replaces hint text', () => {
    render(<Dark><Combobox options={defaultOptions} hint="Helper text" error="Error text" placeholder="Pick fruit" /></Dark>);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});

describe('Combobox -- ARIA', () => {
  it('has aria-autocomplete list', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('has aria-expanded false when closed', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('listbox has role listbox', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    fireEvent.focus(screen.getByPlaceholderText('Pick fruit'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('options have role option', () => {
    render(<Dark><Combobox options={defaultOptions} placeholder="Pick fruit" /></Dark>);
    fireEvent.focus(screen.getByPlaceholderText('Pick fruit'));
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.length).toBe(4);
  });

  it('label is linked via htmlFor', () => {
    render(<Dark><Combobox options={defaultOptions} label="Fruit" placeholder="Pick fruit" /></Dark>);
    const labelEl = screen.getByText('Fruit');
    const input = screen.getByPlaceholderText('Pick fruit');
    expect(labelEl).toHaveAttribute('for', input.id);
  });

  it('hint is linked via aria-describedby', () => {
    render(<Dark><Combobox options={defaultOptions} hint="Pick one" placeholder="Pick fruit" /></Dark>);
    const input = screen.getByPlaceholderText('Pick fruit');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent('Pick one');
  });
});

describe('Combobox -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Combobox options={[]} skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render input element when skeleton', () => {
    render(<Dark><Combobox options={[]} skeleton placeholder="hidden" /></Dark>);
    expect(screen.queryByPlaceholderText('hidden')).not.toBeInTheDocument();
  });
});

describe('Combobox -- sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
  sizes.forEach((size) => {
    it('renders size ' + size + ' without crashing', () => {
      render(<Dark><Combobox options={defaultOptions} size={size} placeholder={'size-' + size} /></Dark>);
      expect(screen.getByPlaceholderText('size-' + size)).toBeInTheDocument();
    });
  });
});
