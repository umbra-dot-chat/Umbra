/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatBubble } from './ChatBubble';
import { chatBubbleAlignments, chatBubbleVariants, chatBubbleStatuses } from '.';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChatBubble — rendering', () => {
  it('renders message content', () => {
    render(
      <Dark>
        <ChatBubble>Hello world</ChatBubble>
      </Dark>,
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    const { container } = render(
      <Dark>
        <ChatBubble>Message</ChatBubble>
      </Dark>,
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Alignment — corner radius
// ---------------------------------------------------------------------------

describe('ChatBubble — alignment', () => {
  it('incoming has sharp bottom-left corner', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChatBubble ref={ref} align="incoming">Hi</ChatBubble>
      </Dark>,
    );
    // ref points to the outer wrapper; the bubble div is the first child
    const bubbleDiv = ref.current!.firstElementChild as HTMLElement;
    expect(bubbleDiv.style.borderRadius).toBe('12px 12px 12px 2px');
  });

  it('outgoing has sharp bottom-right corner', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChatBubble ref={ref} align="outgoing">Hi</ChatBubble>
      </Dark>,
    );
    const bubbleDiv = ref.current!.firstElementChild as HTMLElement;
    expect(bubbleDiv.style.borderRadius).toBe('12px 12px 2px 12px');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('ChatBubble — variants', () => {
  chatBubbleVariants.forEach((variant) => {
    chatBubbleAlignments.forEach((align) => {
      it(`renders variant="${variant}" align="${align}" without crashing`, () => {
        render(
          <Dark>
            <ChatBubble variant={variant} align={align}>
              Test
            </ChatBubble>
          </Dark>,
        );
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Timestamp
// ---------------------------------------------------------------------------

describe('ChatBubble — timestamp', () => {
  it('renders timestamp when provided', () => {
    render(
      <Dark>
        <ChatBubble timestamp="2:34 PM">Message</ChatBubble>
      </Dark>,
    );
    expect(screen.getByText('2:34 PM')).toBeInTheDocument();
  });

  it('does not render timestamp when not provided', () => {
    render(
      <Dark>
        <ChatBubble>Message</ChatBubble>
      </Dark>,
    );
    expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument();
  });

  it('renders timestamp below the bubble (outside the bubble div)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChatBubble ref={ref} timestamp="3:00 PM">Message</ChatBubble>
      </Dark>,
    );
    // The timestamp is in the second child of the wrapper (sibling of the bubble)
    const wrapper = ref.current!;
    const timestampEl = wrapper.querySelector('span');
    expect(timestampEl).toBeInTheDocument();
    expect(timestampEl!.textContent).toBe('3:00 PM');
    // It should NOT be inside the bubble div (first child)
    const bubbleDiv = wrapper.firstElementChild as HTMLElement;
    expect(bubbleDiv.querySelector('span')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// _inGroup suppresses footer
// ---------------------------------------------------------------------------

describe('ChatBubble — _inGroup', () => {
  it('suppresses timestamp/status when _inGroup is true', () => {
    render(
      <Dark>
        <ChatBubble timestamp="4:00 PM" status="read" _inGroup>
          Grouped message
        </ChatBubble>
      </Dark>,
    );
    expect(screen.getByText('Grouped message')).toBeInTheDocument();
    // Timestamp should NOT be rendered
    expect(screen.queryByText('4:00 PM')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

describe('ChatBubble — status', () => {
  chatBubbleStatuses.forEach((status) => {
    it(`renders status="${status}" without crashing`, () => {
      const { container } = render(
        <Dark>
          <ChatBubble align="outgoing" status={status} timestamp="Now">
            Test
          </ChatBubble>
        </Dark>,
      );
      // Status renders an SVG icon
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

describe('ChatBubble — reactions', () => {
  it('renders reaction chips when reactions are provided', () => {
    render(
      <Dark>
        <ChatBubble
          reactions={[
            { emoji: '👍', count: 3 },
            { emoji: '❤️', count: 1 },
          ]}
        >
          Message
        </ChatBubble>
      </Dark>,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('fires onReactionClick when a reaction chip is clicked', () => {
    const onReactionClick = vi.fn();
    render(
      <Dark>
        <ChatBubble
          reactions={[{ emoji: '👍', count: 2 }]}
          onReactionClick={onReactionClick}
        >
          Message
        </ChatBubble>
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('👍 2'));
    expect(onReactionClick).toHaveBeenCalledWith('👍');
  });

  it('does not render reactions when not provided', () => {
    const { container } = render(
      <Dark>
        <ChatBubble>Message</ChatBubble>
      </Dark>,
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ChatBubble — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChatBubble ref={ref}>Message</ChatBubble>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('ChatBubble — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <ChatBubble className="custom-bubble">Message</ChatBubble>
      </Dark>,
    );
    expect(container.querySelector('.custom-bubble')).toBeInTheDocument();
  });
});
