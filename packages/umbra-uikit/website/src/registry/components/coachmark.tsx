import React, { useRef, useState } from 'react';
import { Coachmark, VStack, HStack, Button, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

/* ------------------------------------------------------------------ */
/* Interactive wrapper – manages open state for each demo              */
/* ------------------------------------------------------------------ */

function CoachmarkDemo({
  variant = 'default' as const,
  placement = 'bottom' as const,
  label = 'Show Coachmark',
}: {
  variant?: 'default' | 'info' | 'success' | 'warning';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button ref={ref} size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Coachmark
        target={ref}
        open={open}
        onOpenChange={setOpen}
        title="Welcome to your dashboard"
        description="Click this button to access the main navigation and explore features."
        variant={variant}
        placement={placement}
        actionLabel="Got it"
        onAction={() => setOpen(false)}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Registry entry                                                      */
/* ------------------------------------------------------------------ */

export const coachmarkEntry: ComponentEntry = {
  slug: 'coachmark',
  name: 'Coachmark',
  category: 'components',
  subcategory: 'Feedback & Guidance',
  description:
    'Standalone positioned callout attached to a target element. Supports placement, alignment, colour variants, and arrow pointer.',
  variantCount: 4,
  keywords: ['coachmark', 'callout', 'tooltip', 'guide', 'tour', 'help', 'onboarding'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220, alignItems: 'center' }}>
      <div
        style={{
          padding: '12px 16px',
          border: '1px solid var(--wisp-border-subtle, #2A2A2A)',
          borderRadius: 10,
          fontSize: 13,
          maxWidth: 200,
        }}
      >
        <Text weight="semibold">Welcome!</Text>
        <Text size="xs" color="secondary">Click to explore features.</Text>
      </div>
    </VStack>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <HStack gap="md" style={{ padding: 40 }}>
          <CoachmarkDemo />
        </HStack>
      ),
      code: `import { Coachmark } from '@wisp-ui/react';

const ref = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

<button ref={ref} onClick={() => setOpen(true)}>Show</button>
<Coachmark
  target={ref}
  open={open}
  onOpenChange={setOpen}
  title="Welcome"
  description="Explore features here."
  actionLabel="Got it"
  onAction={() => setOpen(false)}
  onDismiss={() => setOpen(false)}
/>`,
    },
    {
      title: 'Variants',
      render: (
        <HStack gap="md" style={{ flexWrap: 'wrap', padding: 40 }}>
          <CoachmarkDemo variant="default" label="Default" />
          <CoachmarkDemo variant="info" label="Info" />
          <CoachmarkDemo variant="success" label="Success" />
          <CoachmarkDemo variant="warning" label="Warning" />
        </HStack>
      ),
      code: `<Coachmark variant="info" ... />
<Coachmark variant="success" ... />
<Coachmark variant="warning" ... />`,
    },
    {
      title: 'Placement',
      render: (
        <HStack gap="md" style={{ flexWrap: 'wrap', padding: 60 }}>
          <CoachmarkDemo placement="top" label="Top" />
          <CoachmarkDemo placement="bottom" label="Bottom" />
          <CoachmarkDemo placement="left" label="Left" />
          <CoachmarkDemo placement="right" label="Right" />
        </HStack>
      ),
      code: `<Coachmark placement="top" ... />
<Coachmark placement="bottom" ... />
<Coachmark placement="left" ... />
<Coachmark placement="right" ... />`,
    },
  ],

  props: [
    { name: 'target', type: 'React.RefObject<HTMLElement>', required: true, description: 'Ref to the target element.' },
    { name: 'title', type: 'string', required: true, description: 'Primary title text.' },
    { name: 'description', type: 'string', description: 'Optional description.' },
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning'", default: "'default'", description: 'Colour variant.' },
    { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'", description: 'Placement relative to target.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along secondary axis.' },
    { name: 'offset', type: 'number', default: '12', description: 'Distance in px from target.' },
    { name: 'showArrow', type: 'boolean', default: 'true', description: 'Show arrow pointing to target.' },
    { name: 'open', type: 'boolean', default: 'true', description: 'Whether the coachmark is visible.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Open state change callback.' },
    { name: 'actionLabel', type: 'string', description: 'Label for action button.' },
    { name: 'onAction', type: '() => void', description: 'Action button click callback.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Dismiss button label.' },
    { name: 'onDismiss', type: '() => void', description: 'Dismiss callback.' },
  ],
};
