import React, { useRef, useState } from 'react';
import { SpotlightTour, VStack, HStack, Button, Text, Badge } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

/* ------------------------------------------------------------------ */
/* Interactive demo wrapper                                            */
/* ------------------------------------------------------------------ */

function SpotlightTourDemo() {
  const ref1 = useRef<HTMLButtonElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <VStack gap="md" style={{ padding: 20 }}>
      <HStack gap="md" style={{ alignItems: 'center' }}>
        <Button ref={ref1} size="sm" variant="secondary">
          Dashboard
        </Button>
        <div
          ref={ref2}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--wisp-border-subtle, #2A2A2A)',
          }}
        >
          <Text>Settings Panel</Text>
        </div>
        <div ref={ref3}>
          <Badge variant="default" size="sm">
            New
          </Badge>
        </div>
      </HStack>

      <Button size="sm" onClick={() => { setStep(0); setOpen(true); }}>
        Start Tour
      </Button>

      <SpotlightTour
        steps={[
          {
            target: ref1,
            title: 'Your Dashboard',
            description: 'This is the main entry point to your workspace.',
            placement: 'bottom',
          },
          {
            target: ref2,
            title: 'Settings',
            description: 'Configure your workspace preferences here.',
            placement: 'bottom',
          },
          {
            target: ref3,
            title: 'New Features',
            description: 'Check out the latest additions we have made.',
            placement: 'bottom',
          },
        ]}
        open={open}
        currentStep={step}
        onStepChange={setStep}
        onFinish={() => setOpen(false)}
        onClose={() => setOpen(false)}
      />
    </VStack>
  );
}

/* ------------------------------------------------------------------ */
/* Registry entry                                                      */
/* ------------------------------------------------------------------ */

export const spotlightTourEntry: ComponentEntry = {
  slug: 'spotlight-tour',
  name: 'SpotlightTour',
  category: 'components',
  subcategory: 'Feedback & Guidance',
  description:
    'Full guided tour with dark backdrop cutout, step popovers, and navigation controls. Highlights target elements with an SVG mask overlay.',
  variantCount: 2,
  keywords: ['spotlight', 'tour', 'guide', 'onboarding', 'walkthrough', 'step', 'help', 'tutorial'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220, alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 180,
          height: 80,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: 'var(--wisp-bg-canvas, #000)',
            border: '1px solid var(--wisp-border-subtle, #2A2A2A)',
            fontSize: 11,
          }}
        >
          <Text size="xs" weight="semibold">Step 1 of 3</Text>
        </div>
      </div>
    </VStack>
  ),

  examples: [
    {
      title: 'Interactive Tour',
      render: <SpotlightTourDemo />,
      code: `import { SpotlightTour } from '@wisp-ui/react';

const ref1 = useRef(null);
const ref2 = useRef(null);
const [open, setOpen] = useState(false);
const [step, setStep] = useState(0);

<SpotlightTour
  steps={[
    { target: ref1, title: 'Dashboard', description: '...' },
    { target: ref2, title: 'Settings', description: '...' },
  ]}
  open={open}
  currentStep={step}
  onStepChange={setStep}
  onFinish={() => setOpen(false)}
  onClose={() => setOpen(false)}
/>`,
    },
  ],

  props: [
    { name: 'steps', type: 'SpotlightTourStep[]', required: true, description: 'Array of tour steps with target ref, title, description.' },
    { name: 'open', type: 'boolean', required: true, description: 'Whether the tour is visible.' },
    { name: 'currentStep', type: 'number', default: '0', description: 'Controlled current step index.' },
    { name: 'onStepChange', type: '(step: number) => void', description: 'Step change callback.' },
    { name: 'onFinish', type: '() => void', description: 'Callback when tour finishes.' },
    { name: 'onClose', type: '() => void', description: 'Callback when tour is closed.' },
    { name: 'showStepCount', type: 'boolean', default: 'true', description: 'Show step counter.' },
    { name: 'nextLabel', type: 'string', default: "'Next'", description: 'Next button label.' },
    { name: 'prevLabel', type: 'string', default: "'Back'", description: 'Back button label.' },
    { name: 'finishLabel', type: 'string', default: "'Finish'", description: 'Finish button label.' },
    { name: 'closeOnOverlayClick', type: 'boolean', default: 'false', description: 'Close on overlay click.' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Escape key.' },
    { name: 'variant', type: "'default' | 'info'", default: "'default'", description: 'Colour variant.' },
  ],
};
