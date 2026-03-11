import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Accordion> = {
  title: 'React Native/Components/Data Display/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['single', 'multiple'] },
    collapsible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Accordion type="single" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>What is Wisp UI?</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Wisp UI is a cross-platform component library for React and React Native.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Is it accessible?</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Yes. All components follow WAI-ARIA patterns and support keyboard navigation.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Can I customize the styles?</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Yes. You can pass custom styles to every sub-component via the style prop.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Multiple
// ---------------------------------------------------------------------------

export const Multiple: Story = {
  name: 'Multiple',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <div style={sectionLabel}>Multiple items can be open simultaneously</div>
      <Accordion type="multiple" defaultValue={['features', 'support']}>
        <AccordionItem value="features">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Features</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Cross-platform support, theme-aware styling, and accessible by default.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pricing">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Pricing</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Wisp UI is free and open-source under the MIT license.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="support">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Support</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Community support is available through GitHub issues and discussions.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. DefaultOpen
// ---------------------------------------------------------------------------

export const DefaultOpen: Story = {
  name: 'Default Open',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div style={sectionLabel}>Single — first item open by default</div>
      <Accordion type="single" defaultValue="first">
        <AccordionItem value="first">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>First Section</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              This section is expanded by default when the accordion renders.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="second">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Second Section</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Click the trigger above to reveal this content.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div style={sectionLabel}>With disabled item</div>
      <Accordion type="single" defaultValue="enabled">
        <AccordionItem value="enabled">
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Enabled Item</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              This item can be interacted with normally.
            </Text>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="disabled" disabled>
          <AccordionTrigger>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>Disabled Item</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              This content is not accessible because the item is disabled.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
