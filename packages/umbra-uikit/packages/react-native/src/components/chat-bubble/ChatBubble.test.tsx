/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatBubble } from './ChatBubble';
import { chatBubbleAlignments, chatBubbleVariants, chatBubbleStatuses } from '@coexist/wisp-core/types/ChatBubble.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChatBubble — rendering', () => {
  it('renders message content', () => {
    render(<Wrapper><ChatBubble>Hello world</ChatBubble></Wrapper>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Alignments
// ---------------------------------------------------------------------------

describe('ChatBubble — alignments', () => {
  chatBubbleAlignments.forEach((align) => {
    it(`renders align="${align}" without crashing`, () => {
      render(<Wrapper><ChatBubble align={align}>Test</ChatBubble></Wrapper>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
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
          <Wrapper><ChatBubble variant={variant} align={align}>Test</ChatBubble></Wrapper>,
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
    render(<Wrapper><ChatBubble timestamp="2:34 PM">Message</ChatBubble></Wrapper>);
    expect(screen.getByText('2:34 PM')).toBeInTheDocument();
  });

  it('does not render timestamp when not provided', () => {
    render(<Wrapper><ChatBubble>Message</ChatBubble></Wrapper>);
    expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument();
  });

  it('suppresses timestamp when _inGroup is true', () => {
    render(<Wrapper><ChatBubble timestamp="4:00 PM" _inGroup>Grouped</ChatBubble></Wrapper>);
    expect(screen.getByText('Grouped')).toBeInTheDocument();
    expect(screen.queryByText('4:00 PM')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

describe('ChatBubble — status', () => {
  chatBubbleStatuses.forEach((status) => {
    it(`renders status="${status}" without crashing`, () => {
      render(
        <Wrapper><ChatBubble align="outgoing" status={status} timestamp="Now">Test</ChatBubble></Wrapper>,
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

describe('ChatBubble — reactions', () => {
  it('renders reaction chips when reactions are provided', () => {
    render(
      <Wrapper>
        <ChatBubble
          reactions={[
            { emoji: '👍', count: 3 },
            { emoji: '❤️', count: 1 },
          ]}
        >
          Message
        </ChatBubble>
      </Wrapper>,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('fires onReactionClick when a reaction chip is pressed', () => {
    const onReactionClick = vi.fn();
    render(
      <Wrapper>
        <ChatBubble
          reactions={[{ emoji: '👍', count: 2 }]}
          onReactionClick={onReactionClick}
        >
          Message
        </ChatBubble>
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('👍 2'));
    expect(onReactionClick).toHaveBeenCalledWith('👍');
  });
});
