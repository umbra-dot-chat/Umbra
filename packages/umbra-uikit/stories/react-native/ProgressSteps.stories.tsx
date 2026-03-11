import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSteps } from '@wisp-ui/react-native';
import type { ProgressStep } from '@wisp-ui/react-native';

const meta: Meta<typeof ProgressSteps> = {
  title: 'React Native/Components/Data Display/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    currentStep: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressSteps>;

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const checkoutSteps: ProgressStep[] = [
  { id: 'cart', label: 'Cart', description: 'Review items' },
  { id: 'shipping', label: 'Shipping', description: 'Delivery address' },
  { id: 'payment', label: 'Payment', description: 'Payment method' },
  { id: 'confirm', label: 'Confirm', description: 'Place order' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Horizontal steps at first step
      </div>
      <ProgressSteps steps={checkoutSteps} currentStep={0} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. In Progress
// ---------------------------------------------------------------------------

export const InProgress: Story = {
  name: 'In Progress',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Step 2 of 4 (horizontal)
        </div>
        <ProgressSteps steps={checkoutSteps} currentStep={1} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Step 3 of 4 (horizontal)
        </div>
        <ProgressSteps steps={checkoutSteps} currentStep={2} />
      </div>
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Step 2 of 4 (vertical)
        </div>
        <ProgressSteps steps={checkoutSteps} currentStep={1} orientation="vertical" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Complete
// ---------------------------------------------------------------------------

export const Complete: Story = {
  name: 'Complete',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          All steps completed (horizontal)
        </div>
        <ProgressSteps steps={checkoutSteps} currentStep={4} />
      </div>
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          All steps completed (vertical)
        </div>
        <ProgressSteps steps={checkoutSteps} currentStep={4} orientation="vertical" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {size}
          </div>
          <ProgressSteps steps={checkoutSteps} currentStep={2} size={size} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Interactive
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const Controlled = () => {
      const [step, setStep] = useState(2);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Click completed steps to navigate back
          </div>
          <ProgressSteps steps={checkoutSteps} currentStep={step} onStepClick={setStep} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </button>
            <button onClick={() => setStep((s) => Math.min(checkoutSteps.length, s + 1))} disabled={step >= checkoutSteps.length}>
              Next
            </button>
            <span style={{ fontSize: 12, color: '#94A0B8', alignSelf: 'center' }}>
              Step {Math.min(step + 1, checkoutSteps.length)} of {checkoutSteps.length}
            </span>
          </div>
        </div>
      );
    };
    return <Controlled />;
  },
};
