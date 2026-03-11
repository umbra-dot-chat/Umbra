/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper: default composed Accordion
// ---------------------------------------------------------------------------

function renderAccordion(props: Record<string, unknown> = {}) {
  return render(
    <Dark>
      <Accordion defaultValue="item-1" {...props}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section One</AccordionTrigger>
          <AccordionContent>Content one</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section Two</AccordionTrigger>
          <AccordionContent>Content two</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Section Three</AccordionTrigger>
          <AccordionContent>Content three</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Accordion — rendering', () => {
  it('renders trigger labels', () => {
    renderAccordion();
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Section Two')).toBeInTheDocument();
    expect(screen.getByText('Section Three')).toBeInTheDocument();
  });

  it('renders content for the default expanded item', () => {
    renderAccordion();
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('renders the root with data-wisp-accordion attribute', () => {
    const { container } = renderAccordion();
    expect(container.querySelector('[data-wisp-accordion]')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Single mode
// ---------------------------------------------------------------------------

describe('Accordion — single mode', () => {
  it('opens clicked item and closes previously open item', () => {
    renderAccordion();
    // item-1 is open by default
    const item1 = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    expect(item1).toHaveAttribute('data-state', 'open');

    // Click item-2
    fireEvent.click(screen.getByText('Section Two'));
    const item2 = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(item2).toHaveAttribute('data-state', 'open');
    expect(item1).toHaveAttribute('data-state', 'closed');
  });

  it('collapses the open item when collapsible=true (default)', () => {
    renderAccordion();
    fireEvent.click(screen.getByText('Section One'));
    const item1 = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    expect(item1).toHaveAttribute('data-state', 'closed');
  });

  it('does not collapse when collapsible=false', () => {
    renderAccordion({ collapsible: false });
    fireEvent.click(screen.getByText('Section One'));
    const item1 = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    expect(item1).toHaveAttribute('data-state', 'open');
  });
});

// ---------------------------------------------------------------------------
// Multiple mode
// ---------------------------------------------------------------------------

describe('Accordion — multiple mode', () => {
  it('allows multiple items open simultaneously', () => {
    renderAccordion({ type: 'multiple', defaultValue: ['item-1'] });
    fireEvent.click(screen.getByText('Section Two'));
    const item1 = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    const item2 = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(item1).toHaveAttribute('data-state', 'open');
    expect(item2).toHaveAttribute('data-state', 'open');
  });
});

// ---------------------------------------------------------------------------
// Controlled usage
// ---------------------------------------------------------------------------

describe('Accordion — controlled usage', () => {
  it('respects the controlled value prop', () => {
    render(
      <Dark>
        <Accordion value="item-2">
          <AccordionItem value="item-1">
            <AccordionTrigger>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Two</AccordionTrigger>
            <AccordionContent>Content two</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    const item2 = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(item2).toHaveAttribute('data-state', 'open');
    const item1 = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    expect(item1).toHaveAttribute('data-state', 'closed');
  });

  it('calls onChange when toggle is triggered', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <Accordion value="item-1" onChange={handleChange}>
          <AccordionItem value="item-1">
            <AccordionTrigger>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Two</AccordionTrigger>
            <AccordionContent>Content two</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    fireEvent.click(screen.getByText('Two'));
    expect(handleChange).toHaveBeenCalledWith('item-2');
  });
});

// ---------------------------------------------------------------------------
// Disabled items
// ---------------------------------------------------------------------------

describe('Accordion — disabled items', () => {
  it('does not toggle a disabled item', () => {
    render(
      <Dark>
        <Accordion defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" disabled>
            <AccordionTrigger>Two</AccordionTrigger>
            <AccordionContent>Content two</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    fireEvent.click(screen.getByText('Two'));
    const item2 = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(item2).toHaveAttribute('data-state', 'closed');
  });

  it('sets data-disabled on disabled item', () => {
    render(
      <Dark>
        <Accordion defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" disabled>
            <AccordionTrigger>Two</AccordionTrigger>
            <AccordionContent>Content two</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    const item2 = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(item2).toHaveAttribute('data-disabled');
  });

  it('disabled trigger button is disabled', () => {
    render(
      <Dark>
        <Accordion defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" disabled>
            <AccordionTrigger>Two</AccordionTrigger>
            <AccordionContent>Content two</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    const trigger = screen.getByText('Two').closest('button');
    expect(trigger).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Custom icon
// ---------------------------------------------------------------------------

describe('Accordion — custom icon', () => {
  it('renders a custom icon in the trigger', () => {
    render(
      <Dark>
        <Accordion defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger icon={<span data-testid="custom-icon">+</span>}>One</AccordionTrigger>
            <AccordionContent>Content one</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Accordion — accessibility', () => {
  it('trigger has aria-expanded=true when open', () => {
    renderAccordion();
    const trigger = screen.getByText('Section One').closest('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('trigger has aria-expanded=false when closed', () => {
    renderAccordion();
    const trigger = screen.getByText('Section Two').closest('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('content has role="region"', () => {
    renderAccordion();
    const regions = screen.getAllByRole('region');
    expect(regions.length).toBeGreaterThanOrEqual(1);
  });

  it('closed content has aria-hidden=true', () => {
    renderAccordion();
    const closedContent = screen.getByText('Content two').closest('[role="region"]');
    expect(closedContent).toHaveAttribute('aria-hidden', 'true');
  });

  it('open content has aria-hidden=false', () => {
    renderAccordion();
    const openContent = screen.getByText('Content one').closest('[role="region"]');
    expect(openContent).toHaveAttribute('aria-hidden', 'false');
  });

  it('item has data-state reflecting open/closed', () => {
    renderAccordion();
    const openItem = screen.getByText('Content one').closest('[data-wisp-accordion-item]');
    const closedItem = screen.getByText('Content two').closest('[data-wisp-accordion-item]');
    expect(openItem).toHaveAttribute('data-state', 'open');
    expect(closedItem).toHaveAttribute('data-state', 'closed');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Accordion — className passthrough', () => {
  it('passes className to root Accordion', () => {
    const { container } = renderAccordion({ className: 'acc-custom' });
    expect(container.querySelector('[data-wisp-accordion]')).toHaveClass('acc-custom');
  });

  it('passes className to AccordionItem', () => {
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a" className="item-custom">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionContent>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(screen.getByText('C').closest('[data-wisp-accordion-item]')).toHaveClass('item-custom');
  });

  it('passes className to AccordionTrigger', () => {
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger className="trigger-custom">T</AccordionTrigger>
            <AccordionContent>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(screen.getByText('T').closest('button')).toHaveClass('trigger-custom');
  });

  it('passes className to AccordionContent', () => {
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionContent className="content-custom">C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(screen.getByText('C').closest('[role="region"]')).toHaveClass('content-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Accordion — style merge', () => {
  it('merges user style onto root', () => {
    const { container } = renderAccordion({ style: { marginTop: 42 } });
    expect(container.querySelector('[data-wisp-accordion]')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Accordion — ref forwarding', () => {
  it('forwards ref to root Accordion div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Accordion defaultValue="a" ref={ref}>
          <AccordionItem value="a">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionContent>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to AccordionItem', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a" ref={ref}>
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionContent>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to AccordionTrigger', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger ref={ref}>T</AccordionTrigger>
            <AccordionContent>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('forwards ref to AccordionContent', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionContent ref={ref}>C</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
