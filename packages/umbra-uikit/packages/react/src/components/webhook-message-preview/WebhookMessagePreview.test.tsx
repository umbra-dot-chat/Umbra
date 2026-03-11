/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebhookMessagePreview } from './WebhookMessagePreview';
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

describe('WebhookMessagePreview — rendering', () => {
  it('renders webhook name', () => {
    render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="Hello world" />
      </Dark>,
    );
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders BOT badge', () => {
    render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="Hello world" />
      </Dark>,
    );
    expect(screen.getByText('BOT')).toBeInTheDocument();
  });

  it('renders message content', () => {
    render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="New push to main" />
      </Dark>,
    );
    expect(screen.getByText('New push to main')).toBeInTheDocument();
  });

  it('renders timestamp when provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview
          webhookName="GitHub"
          content="Hello"
          timestamp="Today at 3:45 PM"
        />
      </Dark>,
    );
    expect(screen.getByText('Today at 3:45 PM')).toBeInTheDocument();
  });

  it('renders default avatar when no webhookAvatar is provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="Hello" />
      </Dark>,
    );
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('renders custom webhook avatar when provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview
          webhookName="GitHub"
          content="Hello"
          webhookAvatar={<img src="avatar.png" alt="avatar" />}
        />
      </Dark>,
    );
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

describe('WebhookMessagePreview — media', () => {
  it('renders media when provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview
          webhookName="GitHub"
          content="Hello"
          media={<div data-testid="media-content">Media here</div>}
        />
      </Dark>,
    );
    expect(screen.getByTestId('media-content')).toBeInTheDocument();
  });

  it('does not render media section when not provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="Hello" />
      </Dark>,
    );
    expect(screen.queryByTestId('media-content')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

describe('WebhookMessagePreview — reactions', () => {
  it('renders reactions when provided', () => {
    render(
      <Dark>
        <WebhookMessagePreview
          webhookName="GitHub"
          content="Hello"
          reactions={[
            { emoji: '👍', count: 3, reacted: true },
            { emoji: '❤️', count: 1 },
          ]}
        />
      </Dark>,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onReactionClick with emoji when reaction is clicked', () => {
    const onReactionClick = vi.fn();
    render(
      <Dark>
        <WebhookMessagePreview
          webhookName="GitHub"
          content="Hello"
          reactions={[{ emoji: '👍', count: 3 }]}
          onReactionClick={onReactionClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('👍').closest('button')!);
    expect(onReactionClick).toHaveBeenCalledWith('👍');
  });

  it('does not render reactions when not provided', () => {
    const { container } = render(
      <Dark>
        <WebhookMessagePreview webhookName="GitHub" content="Hello" />
      </Dark>,
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
