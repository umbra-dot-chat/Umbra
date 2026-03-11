/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageGroup } from './MessageGroup';
import { ChatBubble } from '../chat-bubble/ChatBubble';
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

describe('MessageGroup — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <MessageGroup>
          <div>Bubble 1</div>
          <div>Bubble 2</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByText('Bubble 1')).toBeInTheDocument();
    expect(screen.getByText('Bubble 2')).toBeInTheDocument();
  });

  it('renders sender name', () => {
    render(
      <Dark>
        <MessageGroup sender="Alice">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar element', () => {
    render(
      <Dark>
        <MessageGroup avatar={<div data-testid="avatar">A</div>}>
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('renders avatar and sender together', () => {
    render(
      <Dark>
        <MessageGroup sender="Bob" avatar={<div data-testid="avatar">B</div>}>
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

describe('MessageGroup — alignment', () => {
  it('incoming alignment renders left-aligned (default)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageGroup ref={ref} align="incoming">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(ref.current!.style.alignItems).toBe('flex-start');
  });

  it('outgoing alignment renders right-aligned', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageGroup ref={ref} align="outgoing">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(ref.current!.style.alignItems).toBe('flex-end');
  });
});

// ---------------------------------------------------------------------------
// No header
// ---------------------------------------------------------------------------

describe('MessageGroup — no header', () => {
  it('does not render header when no avatar or sender', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageGroup ref={ref}>
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    // Should only have the bubbles container, no header or footer
    expect(ref.current!.children).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Timestamp & Status (group-level footer)
// ---------------------------------------------------------------------------

describe('MessageGroup — timestamp & status', () => {
  it('renders timestamp below the group', () => {
    render(
      <Dark>
        <MessageGroup timestamp="2:30 PM">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.getByTestId('group-footer')).toBeInTheDocument();
  });

  it('renders status icon in the group footer', () => {
    const { container } = render(
      <Dark>
        <MessageGroup timestamp="2:30 PM" status="read">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.getByTestId('group-footer')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render footer when no timestamp or status', () => {
    render(
      <Dark>
        <MessageGroup>
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(screen.queryByTestId('group-footer')).not.toBeInTheDocument();
  });

  it('suppresses child ChatBubble footers via _inGroup injection', () => {
    render(
      <Dark>
        <MessageGroup timestamp="2:30 PM">
          <ChatBubble align="incoming" timestamp="Should be hidden">
            Bubble 1
          </ChatBubble>
          <ChatBubble align="incoming" timestamp="Also hidden">
            Bubble 2
          </ChatBubble>
        </MessageGroup>
      </Dark>,
    );
    // The group renders its own timestamp
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    // The individual bubble timestamps should be suppressed
    expect(screen.queryByText('Should be hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Also hidden')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MessageGroup — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageGroup ref={ref}>
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MessageGroup — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <MessageGroup className="custom-group">
          <div>Message</div>
        </MessageGroup>
      </Dark>,
    );
    expect(container.querySelector('.custom-group')).toBeInTheDocument();
  });
});
