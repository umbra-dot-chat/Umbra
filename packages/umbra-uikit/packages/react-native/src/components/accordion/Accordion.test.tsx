/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Text } from 'react-native';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './Accordion';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper — standard accordion with three items
// ---------------------------------------------------------------------------

function TestAccordion(props: Partial<React.ComponentProps<typeof Accordion>>) {
  return (
    <Wrapper>
      <Accordion {...props}>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <Text>Section 1</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text>Content 1</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <Text>Section 2</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text>Content 2</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <Text>Section 3</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text>Content 3</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Accordion — rendering', () => {
  it('renders all trigger labels', () => {
    render(<TestAccordion />);
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  it('triggers have button accessibility role', () => {
    const { container } = render(<TestAccordion />);
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons.length).toBe(3);
  });

  it('has correct displayNames', () => {
    expect(Accordion.displayName).toBe('Accordion');
    expect(AccordionItem.displayName).toBe('AccordionItem');
    expect(AccordionTrigger.displayName).toBe('AccordionTrigger');
    expect(AccordionContent.displayName).toBe('AccordionContent');
  });
});

// ---------------------------------------------------------------------------
// Expand / collapse
// ---------------------------------------------------------------------------

describe('Accordion — expand / collapse', () => {
  it('starts collapsed by default (no defaultValue)', () => {
    const { container } = render(<TestAccordion />);
    const buttons = container.querySelectorAll('[role="button"]');
    // All triggers should have aria-expanded=false
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('expands an item when its trigger is clicked', () => {
    const { container } = render(<TestAccordion />);
    const buttons = container.querySelectorAll('[role="button"]');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses an open item when its trigger is clicked again (collapsible=true)', () => {
    const { container } = render(<TestAccordion collapsible />);
    const buttons = container.querySelectorAll('[role="button"]');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects defaultValue to start expanded', () => {
    const { container } = render(<TestAccordion defaultValue="item-2" />);
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('only one item open at a time in single mode', () => {
    const { container } = render(<TestAccordion type="single" defaultValue="item-1" />);
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    // Click second item
    fireEvent.click(buttons[1]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('allows multiple items open in multiple mode', () => {
    const { container } = render(
      <TestAccordion type="multiple" defaultValue={['item-1']} />,
    );
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    // Click second item — first should stay open
    fireEvent.click(buttons[1]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('Accordion — onChange', () => {
  it('calls onChange when an item is expanded', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TestAccordion type="single" onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('[role="button"]');
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('item-1');
  });

  it('calls onChange with array in multiple mode', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TestAccordion type="multiple" onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('[role="button"]');
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith(['item-1']);
  });
});
