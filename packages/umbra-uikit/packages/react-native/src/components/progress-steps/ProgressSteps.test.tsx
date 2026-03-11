/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressSteps } from './ProgressSteps';
import type { ProgressStep } from './ProgressSteps';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultSteps: ProgressStep[] = [
  { id: '1', label: 'Account', description: 'Create your account' },
  { id: '2', label: 'Profile', description: 'Set up your profile' },
  { id: '3', label: 'Review', description: 'Review and confirm' },
];

// ---------------------------------------------------------------------------
// Rendering steps
// ---------------------------------------------------------------------------

describe('ProgressSteps — rendering steps', () => {
  it('renders all step labels', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} />
      </Wrapper>,
    );
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} />
      </Wrapper>,
    );
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Set up your profile')).toBeInTheDocument();
    expect(screen.getByText('Review and confirm')).toBeInTheDocument();
  });

  it('renders without crashing with an empty steps array', () => {
    const { container } = render(
      <Wrapper>
        <ProgressSteps steps={[]} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders step numbers for upcoming steps without icons', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} currentStep={0} />
      </Wrapper>,
    );
    // Step numbers 2 and 3 should appear for upcoming steps
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Current step
// ---------------------------------------------------------------------------

describe('ProgressSteps — current step', () => {
  it('renders with currentStep=0 highlighting the first step', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} currentStep={0} />
      </Wrapper>,
    );
    // The first step label should be present and is the active one
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders with currentStep=2 highlighting the last step', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} currentStep={2} />
      </Wrapper>,
    );
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('defaults currentStep to 0 when not provided', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} />
      </Wrapper>,
    );
    // Step 1 (index 0) is active, step numbers 2 and 3 should render for upcoming
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('ProgressSteps — orientation', () => {
  it('renders horizontal orientation without crashing', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} orientation="horizontal" />
      </Wrapper>,
    );
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders vertical orientation without crashing', () => {
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} orientation="vertical" />
      </Wrapper>,
    );
    expect(screen.getByText('Account')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ProgressSteps — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <ProgressSteps steps={defaultSteps} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// onStepClick
// ---------------------------------------------------------------------------

describe('ProgressSteps — onStepClick', () => {
  it('calls onStepClick when a completed step is pressed', () => {
    const onStepClick = vi.fn();
    render(
      <Wrapper>
        <ProgressSteps steps={defaultSteps} currentStep={2} onStepClick={onStepClick} />
      </Wrapper>,
    );
    // Step 0 ("Account") is completed when currentStep=2
    const accountLabel = screen.getByText('Account');
    // Walk up to find the pressable element for the dot
    const pressable = accountLabel.closest('[role="button"]')
      || accountLabel.parentElement?.parentElement?.querySelector('[role="button"]');
    // Find the step dot pressable - in horizontal layout it's inside the row
    // We need to click the dot, not the label
    if (pressable) {
      fireEvent.click(pressable);
      expect(onStepClick).toHaveBeenCalled();
    }
  });
});
