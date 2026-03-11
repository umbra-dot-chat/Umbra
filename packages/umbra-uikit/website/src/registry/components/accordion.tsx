import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Text, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const accordionEntry: ComponentEntry = {
  slug: 'accordion',
  name: 'Accordion',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Collapsible content sections with single or multiple expansion modes, icons, disabled items, and keyboard navigation.',
  variantCount: 2,
  keywords: ['accordion', 'collapse', 'expand', 'faq', 'section'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <Accordion type="single" defaultValue="1">
        <AccordionItem value="1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>
            <Text size="xs" color="secondary">Content…</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="2">
          <AccordionTrigger>Section 2</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    </div>
  ),

  examples: [
    {
      title: 'Single',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Accordion type="single" defaultValue="1">
            <AccordionItem value="1">
              <AccordionTrigger>What is Wisp?</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">A monochrome, cross-platform UI kit with 90+ components.</Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">Yes, full keyboard navigation and ARIA attributes.</Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Can I customize it?</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">Fully theme-able with token-based design system.</Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
      code: `import { Accordion, AccordionItem } from '@wisp-ui/react';\n\n<Accordion type="single" defaultValue="1">
  <AccordionItem value="1">
    <AccordionTrigger>Question</AccordionTrigger>
    <AccordionContent>Answer</AccordionContent>
  </AccordionItem>
</Accordion>`,
      rnCode: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@wisp-ui/react-native';

<Accordion type="single" defaultValue="1">
  <AccordionItem value="1">
    <AccordionTrigger>Question</AccordionTrigger>
    <AccordionContent>Answer</AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
    {
      title: 'Multiple',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Accordion type="multiple" defaultValue={['a', 'b']}>
            <AccordionItem value="a">
              <AccordionTrigger>Section A</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">Multiple sections can be open at once.</Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Section B</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">This is also expanded by default.</Text>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="c" disabled>
              <AccordionTrigger>Disabled</AccordionTrigger>
              <AccordionContent>
                <Text color="secondary">Cannot toggle.</Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
      code: `<Accordion type="multiple" defaultValue={['a', 'b']}>
  <AccordionItem value="a"><AccordionTrigger>A</AccordionTrigger>…</AccordionItem>
  <AccordionItem value="b"><AccordionTrigger>B</AccordionTrigger>…</AccordionItem>
  <AccordionItem value="c" disabled><AccordionTrigger>Disabled</AccordionTrigger>…</AccordionItem>
</Accordion>`,
      rnCode: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@wisp-ui/react-native';

<Accordion type="multiple" defaultValue={['a', 'b']}>
  <AccordionItem value="a"><AccordionTrigger>A</AccordionTrigger>…</AccordionItem>
  <AccordionItem value="b"><AccordionTrigger>B</AccordionTrigger>…</AccordionItem>
  <AccordionItem value="c" disabled><AccordionTrigger>Disabled</AccordionTrigger>…</AccordionItem>
</Accordion>`,
    },
  ],

  props: [
    { name: 'type', type: "'single' | 'multiple'", default: "'single'", description: 'Expansion mode.' },
    { name: 'value', type: 'string | string[]', description: 'Controlled open value(s).' },
    { name: 'defaultValue', type: 'string | string[]', description: 'Initial open value(s).' },
    { name: 'onChange', type: '(value: string | string[]) => void', description: 'Open state callback.' },
    { name: 'collapsible', type: 'boolean', default: 'true', description: 'Allow all items closed.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'AccordionItem children.' },
  ],
};
