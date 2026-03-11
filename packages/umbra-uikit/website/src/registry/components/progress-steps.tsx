import React, { useState } from 'react';
import { ProgressSteps, VStack, HStack, Button, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const steps = [
  { id: '1', label: 'Account', description: 'Create account' },
  { id: '2', label: 'Profile', description: 'Set up profile' },
  { id: '3', label: 'Verify', description: 'Verify email' },
  { id: '4', label: 'Done', description: 'All set!' },
];

function StepsDemo() {
  const [step, setStep] = useState(1);
  return (
    <VStack gap="md" style={{ width: '100%', maxWidth: 500 }}>
      <ProgressSteps steps={steps} currentStep={step} />
      <HStack gap="sm" justify="center">
        <Button size="sm" variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
        <Button size="sm" onClick={() => setStep(Math.min(steps.length, step + 1))} disabled={step === steps.length}>Next</Button>
      </HStack>
    </VStack>
  );
}

export const progressStepsEntry: ComponentEntry = {
  slug: 'progress-steps',
  name: 'ProgressSteps',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Multi-step progress indicator with horizontal/vertical orientation, step icons, descriptions, and click-to-navigate.',
  variantCount: 2,
  keywords: ['progress', 'steps', 'wizard', 'stepper', 'multi-step'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <ProgressSteps steps={steps.slice(0, 3)} currentStep={1} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <StepsDemo />,
      code: `import { ProgressSteps } from '@wisp-ui/react';\n\nconst [step, setStep] = useState(1);
<ProgressSteps
  steps={[
    { id: '1', label: 'Account' },
    { id: '2', label: 'Profile' },
    { id: '3', label: 'Done' },
  ]}
  currentStep={step}
/>`,
      rnCode: `import { ProgressSteps } from '@wisp-ui/react-native';
import { useState } from 'react';

const [step, setStep] = useState(1);
<ProgressSteps
  steps={[
    { id: '1', label: 'Account' },
    { id: '2', label: 'Profile' },
    { id: '3', label: 'Done' },
  ]}
  currentStep={step}
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 500 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs">
              <Text size="xs" color="tertiary">{size}</Text>
              <ProgressSteps steps={steps.slice(0, 3)} currentStep={1} size={size} />
            </VStack>
          ))}
        </VStack>
      ),
      code: `<ProgressSteps steps={steps} currentStep={1} size="sm" />
<ProgressSteps steps={steps} currentStep={1} size="md" />
<ProgressSteps steps={steps} currentStep={1} size="lg" />`,
      rnCode: `import { ProgressSteps } from '@wisp-ui/react-native';

<ProgressSteps steps={steps} currentStep={1} size="sm" />
<ProgressSteps steps={steps} currentStep={1} size="md" />
<ProgressSteps steps={steps} currentStep={1} size="lg" />`,
    },
  ],

  props: [
    { name: 'steps', type: 'ProgressStep[]', required: true, description: 'Array of step definitions.' },
    { name: 'currentStep', type: 'number', default: '0', description: 'Active step index (0-based).' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout direction.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'onStepClick', type: '(index: number) => void', description: 'Callback on step click.' },
  ],
};
