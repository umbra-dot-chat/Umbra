/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './FormField';
import { formFieldSizes, formFieldOrientations } from '@coexist/wisp-core/types/FormField.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FormField — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <FormField><input data-testid="child" /></FormField>
      </Dark>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders as a div wrapper', () => {
    const { container } = render(
      <Dark>
        <FormField><input /></FormField>
      </Dark>,
    );
    expect(container.firstChild!.nodeName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('FormField — label', () => {
  it('renders label text', () => {
    render(
      <Dark>
        <FormField label="Email"><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders label as a <label> element', () => {
    render(
      <Dark>
        <FormField label="Email"><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('Email').tagName).toBe('LABEL');
  });

  it('does not render label when not provided', () => {
    const { container } = render(
      <Dark>
        <FormField><input /></FormField>
      </Dark>,
    );
    expect(container.querySelector('label')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Required indicator
// ---------------------------------------------------------------------------

describe('FormField — required', () => {
  it('shows required indicator * when required', () => {
    render(
      <Dark>
        <FormField label="Name" required><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('marks required indicator as aria-hidden', () => {
    render(
      <Dark>
        <FormField label="Name" required><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not show * when not required', () => {
    render(
      <Dark>
        <FormField label="Name"><input /></FormField>
      </Dark>,
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

describe('FormField — description', () => {
  it('renders description text', () => {
    render(
      <Dark>
        <FormField description="Helper text"><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('FormField — error', () => {
  it('renders error message', () => {
    render(
      <Dark>
        <FormField error="Required field"><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('error replaces description', () => {
    render(
      <Dark>
        <FormField description="Helper" error="Error text"><input /></FormField>
      </Dark>,
    );
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('FormField — sizes', () => {
  formFieldSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <FormField size={size} label="Label"><input data-testid={`size-${size}`} /></FormField>
        </Dark>,
      );
      expect(screen.getByTestId(`size-${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('FormField — orientation', () => {
  formFieldOrientations.forEach((orientation) => {
    it(`renders orientation="${orientation}" without crashing`, () => {
      render(
        <Dark>
          <FormField orientation={orientation} label="Label">
            <input data-testid={`orient-${orientation}`} />
          </FormField>
        </Dark>,
      );
      expect(screen.getByTestId(`orient-${orientation}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('FormField — className and style', () => {
  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <FormField className="custom"><input /></FormField>
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('merges user style', () => {
    const { container } = render(
      <Dark>
        <FormField style={{ marginTop: 55 }}><input /></FormField>
      </Dark>,
    );
    expect((container.firstChild as HTMLElement).style.marginTop).toBe('55px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('FormField — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <FormField ref={ref}><input /></FormField>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
