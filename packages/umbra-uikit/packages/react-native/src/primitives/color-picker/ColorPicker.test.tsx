/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorPicker } from './ColorPicker';
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

describe('ColorPicker — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <ColorPicker />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <ColorPicker label="Pick a colour" />
      </Wrapper>,
    );
    expect(screen.getByText('Pick a colour')).toBeInTheDocument();
  });

  it('renders the hex input by default', () => {
    render(
      <Wrapper>
        <ColorPicker />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Hex colour value')).toBeInTheDocument();
  });

  it('hides hex input when showInput is false', () => {
    render(
      <Wrapper>
        <ColorPicker showInput={false} />
      </Wrapper>,
    );
    expect(screen.queryByLabelText('Hex colour value')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Shows initial color
// ---------------------------------------------------------------------------

describe('ColorPicker — shows initial color', () => {
  it('displays the default color value in the input', () => {
    render(
      <Wrapper>
        <ColorPicker defaultValue="#FF5500" />
      </Wrapper>,
    );
    const input = screen.getByLabelText('Hex colour value');
    expect(input).toHaveValue('#FF5500');
  });

  it('displays the controlled color value in the input', () => {
    render(
      <Wrapper>
        <ColorPicker value="#3B82F6" />
      </Wrapper>,
    );
    const input = screen.getByLabelText('Hex colour value');
    expect(input).toHaveValue('#3B82F6');
  });
});

// ---------------------------------------------------------------------------
// Renders presets
// ---------------------------------------------------------------------------

describe('ColorPicker — renders presets', () => {
  it('renders default preset swatches', () => {
    render(
      <Wrapper>
        <ColorPicker />
      </Wrapper>,
    );
    // The default preset list has 10 colours; each is a Pressable with
    // an accessibilityLabel like "Select colour #EF4444"
    const presetButtons = screen.getAllByLabelText(/^Select colour /);
    expect(presetButtons).toHaveLength(10);
  });

  it('renders custom presets when provided', () => {
    const customPresets = ['#FF0000', '#00FF00', '#0000FF'];
    render(
      <Wrapper>
        <ColorPicker presets={customPresets} />
      </Wrapper>,
    );
    const presetButtons = screen.getAllByLabelText(/^Select colour /);
    expect(presetButtons).toHaveLength(3);
  });

  it('renders no preset swatches when presets is empty', () => {
    render(
      <Wrapper>
        <ColorPicker presets={[]} />
      </Wrapper>,
    );
    expect(screen.queryByLabelText(/^Select colour /)).not.toBeInTheDocument();
  });
});
