/**
 * ProgressSteps — Stories showing all orientations and states.
 *
 * @module stories/progress-steps
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSteps } from './ProgressSteps';
import { Button } from '../../primitives/button';
import { User, CreditCard, CheckCircle, Package } from 'lucide-react';

const meta: Meta<typeof ProgressSteps> = {
  title: 'Components/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProgressSteps>;

const basicSteps = [
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
];

// ---------------------------------------------------------------------------
// Default (Horizontal)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
  },
};

// ---------------------------------------------------------------------------
// Interactive
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const Demo = () => {
      const [step, setStep] = useState(0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
          <ProgressSteps
            steps={basicSteps}
            currentStep={step}
            onStepClick={(i) => setStep(i)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button size="sm" disabled={step === basicSteps.length} onClick={() => setStep(step + 1)}>
              {step === basicSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
          <span>Current step: {step < basicSteps.length ? basicSteps[step].label : 'Complete!'}</span>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Vertical
// ---------------------------------------------------------------------------

export const Vertical: Story = {
  name: 'Vertical',
  args: {
    steps: basicSteps,
    currentStep: 2,
    orientation: 'vertical',
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  args: {
    steps: [
      { id: 'account', label: 'Account', description: 'Create your account', icon: User },
      { id: 'payment', label: 'Payment', description: 'Add payment method', icon: CreditCard },
      { id: 'shipping', label: 'Shipping', description: 'Select shipping', icon: Package },
      { id: 'done', label: 'Done', description: 'Order confirmed', icon: CheckCircle },
    ],
    currentStep: 2,
  },
};

// ---------------------------------------------------------------------------
// With Descriptions
// ---------------------------------------------------------------------------

export const WithDescriptions: Story = {
  name: 'With Descriptions',
  args: {
    steps: [
      { id: 'details', label: 'Details', description: 'Enter your info' },
      { id: 'payment', label: 'Payment', description: 'Add card details' },
      { id: 'review', label: 'Review', description: 'Check your order' },
    ],
    currentStep: 1,
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
      <div>
        <span style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Small</span>
        <ProgressSteps steps={basicSteps} currentStep={2} size="sm" />
      </div>
      <div>
        <span style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Medium</span>
        <ProgressSteps steps={basicSteps} currentStep={2} size="md" />
      </div>
      <div>
        <span style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Large</span>
        <ProgressSteps steps={basicSteps} currentStep={2} size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Complete
// ---------------------------------------------------------------------------

export const AllComplete: Story = {
  name: 'All Complete',
  args: {
    steps: basicSteps,
    currentStep: 4,
  },
};

// ---------------------------------------------------------------------------
// Vertical with Icons
// ---------------------------------------------------------------------------

export const VerticalWithIcons: Story = {
  name: 'Vertical with Icons',
  args: {
    steps: [
      { id: 'account', label: 'Account', description: 'Create your account', icon: User },
      { id: 'payment', label: 'Payment', description: 'Add payment method', icon: CreditCard },
      { id: 'shipping', label: 'Shipping', description: 'Select shipping', icon: Package },
      { id: 'done', label: 'Done', description: 'Order confirmed', icon: CheckCircle },
    ],
    currentStep: 1,
    orientation: 'vertical',
  },
};
