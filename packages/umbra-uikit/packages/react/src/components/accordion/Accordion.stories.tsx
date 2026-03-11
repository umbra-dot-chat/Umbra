import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
import { Text } from '../../primitives/text';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

// ---------------------------------------------------------------------------
// Default — FAQ-style with single open
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <Accordion defaultValue="faq-1" style={{ maxWidth: 520 }}>
      <AccordionItem value="faq-1">
        <AccordionTrigger>What is Wisp UI?</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Wisp UI is a design-token-driven component kit that ships accessible, themeable primitives for React applications.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger>How do I install it?</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Install via your favourite package manager and wrap your application with the WispProvider to supply theme tokens.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-3">
        <AccordionTrigger>Can I customise the theme?</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Absolutely. Pass a custom ThemeConfig to WispProvider or use createTheme to generate one with your own color palette.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ---------------------------------------------------------------------------
// Multiple — several items open at once
// ---------------------------------------------------------------------------

export const Multiple: Story = {
  name: 'Multiple',
  render: () => (
    <Accordion type="multiple" defaultValue={['item-1', 'item-3']} style={{ maxWidth: 520 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section One</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            This section is open by default alongside Section Three.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section Two</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Click to expand. Multiple items can be open simultaneously.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section Three</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Also open by default. Collapse independently of the other sections.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ---------------------------------------------------------------------------
// Disabled — one item disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled Item',
  render: () => (
    <Accordion defaultValue="enabled-1" style={{ maxWidth: 520 }}>
      <AccordionItem value="enabled-1">
        <AccordionTrigger>Available Section</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            This section works as expected.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled-1" disabled>
        <AccordionTrigger>Locked Section</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            This content is not reachable because the item is disabled.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="enabled-2">
        <AccordionTrigger>Another Section</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Clicking here still works normally.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ---------------------------------------------------------------------------
// Controlled — external state management
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState<string | string[]>('ctrl-1');

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setValue('ctrl-1')} style={{ cursor: 'pointer' }}>
              Open First
            </button>
            <button type="button" onClick={() => setValue('ctrl-2')} style={{ cursor: 'pointer' }}>
              Open Second
            </button>
            <button type="button" onClick={() => setValue('')} style={{ cursor: 'pointer' }}>
              Collapse All
            </button>
          </div>
          <Accordion value={value} onChange={setValue}>
            <AccordionItem value="ctrl-1">
              <AccordionTrigger>First Section</AccordionTrigger>
              <AccordionContent>
                <Text size="sm" color="secondary">
                  State is managed externally. Use the buttons above to switch sections.
                </Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ctrl-2">
              <AccordionTrigger>Second Section</AccordionTrigger>
              <AccordionContent>
                <Text size="sm" color="secondary">
                  This section is controlled via the parent component state.
                </Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      );
    };

    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// Custom Icon
// ---------------------------------------------------------------------------

const PlusIcon = ({ isOpen }: { isOpen?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 200ms ease',
      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
    }}
    aria-hidden
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const CustomIcon: Story = {
  name: 'Custom Icon',
  render: () => (
    <Accordion defaultValue="icon-1" style={{ maxWidth: 520 }}>
      <AccordionItem value="icon-1">
        <AccordionTrigger icon={<PlusIcon isOpen />}>Expanded with plus icon</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            The trigger displays a custom plus icon that rotates into an X when open.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="icon-2">
        <AccordionTrigger icon={<PlusIcon />}>Collapsed with plus icon</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            Same custom icon behaviour for every item.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ---------------------------------------------------------------------------
// Nested — accordion inside accordion
// ---------------------------------------------------------------------------

export const Nested: Story = {
  name: 'Nested',
  render: () => (
    <Accordion defaultValue="outer-1" style={{ maxWidth: 520 }}>
      <AccordionItem value="outer-1">
        <AccordionTrigger>Outer Section One</AccordionTrigger>
        <AccordionContent>
          <Accordion type="single" defaultValue="inner-1">
            <AccordionItem value="inner-1">
              <AccordionTrigger>Inner Section A</AccordionTrigger>
              <AccordionContent>
                <Text size="sm" color="secondary">
                  Nested content inside the first outer accordion item.
                </Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="inner-2">
              <AccordionTrigger>Inner Section B</AccordionTrigger>
              <AccordionContent>
                <Text size="sm" color="secondary">
                  Another nested accordion panel.
                </Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="outer-2">
        <AccordionTrigger>Outer Section Two</AccordionTrigger>
        <AccordionContent>
          <Text size="sm" color="secondary">
            This is a regular content section without nesting.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// ---------------------------------------------------------------------------
// Composition — settings panel
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
      <Text size="lg" weight="semibold" as="h2" style={{ margin: 0 }}>
        Settings
      </Text>
      <Accordion type="single" defaultValue="general">
        <AccordionItem value="general">
          <AccordionTrigger>General</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="sm" color="secondary">
                Application language, timezone, and date format preferences.
              </Text>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="appearance">
          <AccordionTrigger>Appearance</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="sm" color="secondary">
                Theme selection, font size, and density options.
              </Text>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notifications">
          <AccordionTrigger>Notifications</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="sm" color="secondary">
                Email digest frequency, push notification channels, and quiet hours.
              </Text>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="privacy">
          <AccordionTrigger>Privacy</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text size="sm" color="secondary">
                Data sharing preferences, analytics opt-in, and account visibility settings.
              </Text>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
