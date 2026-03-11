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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MessageGroup — rendering', () => {
  it('renders children', () => {
    render(
      <Wrapper>
        <MessageGroup>
          <div>Bubble 1</div>
          <div>Bubble 2</div>
        </MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('Bubble 1')).toBeInTheDocument();
    expect(screen.getByText('Bubble 2')).toBeInTheDocument();
  });

  it('renders sender name', () => {
    render(
      <Wrapper>
        <MessageGroup sender="Alice"><div>Message</div></MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar element', () => {
    render(
      <Wrapper>
        <MessageGroup avatar={<div data-testid="avatar">A</div>}>
          <div>Message</div>
        </MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

describe('MessageGroup — alignment', () => {
  it('renders incoming without crashing', () => {
    render(
      <Wrapper>
        <MessageGroup align="incoming"><div>Message</div></MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders outgoing without crashing', () => {
    render(
      <Wrapper>
        <MessageGroup align="outgoing"><div>Message</div></MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Timestamp & Status
// ---------------------------------------------------------------------------

describe('MessageGroup — timestamp & status', () => {
  it('renders timestamp below the group', () => {
    render(
      <Wrapper>
        <MessageGroup timestamp="2:30 PM"><div>Message</div></MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('does not render footer when no timestamp or status', () => {
    render(
      <Wrapper>
        <MessageGroup><div>Message</div></MessageGroup>
      </Wrapper>,
    );
    expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument();
  });

  it('suppresses child ChatBubble footers via _inGroup injection', () => {
    render(
      <Wrapper>
        <MessageGroup timestamp="2:30 PM">
          <ChatBubble align="incoming" timestamp="Should be hidden">
            Bubble 1
          </ChatBubble>
        </MessageGroup>
      </Wrapper>,
    );
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.queryByText('Should be hidden')).not.toBeInTheDocument();
  });
});
