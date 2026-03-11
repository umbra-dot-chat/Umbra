/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { ChannelHeader } from './ChannelHeader';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChannelHeader — rendering', () => {
  it('renders the channel name', () => {
    render(
      <Dark>
        <ChannelHeader name="general" />
      </Dark>,
    );
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('renders the topic text when provided', () => {
    render(
      <Dark>
        <ChannelHeader name="general" topic="Talk about anything" />
      </Dark>,
    );
    expect(screen.getByText('Talk about anything')).toBeInTheDocument();
  });

  it('renders a type icon as SVG', () => {
    const { container } = render(
      <Dark>
        <ChannelHeader name="general" type="text" />
      </Dark>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders different channel type icons without crashing', () => {
    const types = ['text', 'voice', 'announcement', 'files', 'bulletin', 'welcome', 'thread', 'forum'] as const;
    for (const channelType of types) {
      const { unmount } = render(
        <Dark>
          <ChannelHeader name={`${channelType}-channel`} type={channelType} />
        </Dark>,
      );
      expect(screen.getByText(`${channelType}-channel`)).toBeInTheDocument();
      unmount();
    }
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

describe('ChannelHeader — actions', () => {
  it('renders action buttons', () => {
    render(
      <Dark>
        <ChannelHeader
          name="general"
          actions={[
            {
              key: 'pin',
              label: 'Pinned Messages',
              icon: <span>pin-icon</span>,
              onClick: () => {},
            },
            {
              key: 'members',
              label: 'Member List',
              icon: <span>members-icon</span>,
              onClick: () => {},
            },
          ]}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Pinned Messages')).toBeInTheDocument();
    expect(screen.getByLabelText('Member List')).toBeInTheDocument();
  });

  it('calls onClick when an action button is clicked', () => {
    const onClick = vi.fn();
    render(
      <Dark>
        <ChannelHeader
          name="general"
          actions={[
            {
              key: 'settings',
              label: 'Settings',
              icon: <span>gear-icon</span>,
              onClick,
            },
          ]}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled action buttons', () => {
    render(
      <Dark>
        <ChannelHeader
          name="general"
          actions={[
            {
              key: 'search',
              label: 'Search',
              icon: <span>search-icon</span>,
              onClick: () => {},
              disabled: true,
            },
          ]}
        />
      </Dark>,
    );
    const btn = screen.getByLabelText('Search');
    expect(btn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Encrypted & Slow Mode indicators
// ---------------------------------------------------------------------------

describe('ChannelHeader — indicators', () => {
  it('shows encrypted indicator when encrypted is true', () => {
    const { container } = render(
      <Dark>
        <ChannelHeader name="secret" encrypted />
      </Dark>,
    );
    const lockIndicator = container.querySelector('[title="End-to-end encrypted"]');
    expect(lockIndicator).toBeInTheDocument();
  });

  it('shows slow mode indicator when slowMode is true', () => {
    const { container } = render(
      <Dark>
        <ChannelHeader name="slow" slowMode />
      </Dark>,
    );
    const clockIndicator = container.querySelector('[title="Slow mode enabled"]');
    expect(clockIndicator).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('ChannelHeader — skeleton', () => {
  it('renders skeleton placeholders when skeleton is true', () => {
    render(
      <Dark>
        <ChannelHeader name="general" skeleton />
      </Dark>,
    );
    // In skeleton mode, the channel name should not be visible
    expect(screen.queryByText('general')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ChannelHeader — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChannelHeader ref={ref} name="general" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className & style passthrough
// ---------------------------------------------------------------------------

describe('ChannelHeader — className & style', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <ChannelHeader name="general" className="custom-header" />
      </Dark>,
    );
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
  });

  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChannelHeader ref={ref} name="general" style={{ marginTop: 10 }} />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('10px');
  });
});

// ---------------------------------------------------------------------------
// Topic click
// ---------------------------------------------------------------------------

describe('ChannelHeader — topic click', () => {
  it('calls onTopicClick when the topic text is clicked', () => {
    const onTopicClick = vi.fn();
    render(
      <Dark>
        <ChannelHeader
          name="general"
          topic="Click me to edit"
          onTopicClick={onTopicClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Click me to edit'));
    expect(onTopicClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('ChannelHeader — accessibility', () => {
  it('has role="banner" on the root element', () => {
    render(
      <Dark>
        <ChannelHeader name="general" />
      </Dark>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('has an aria-label describing the channel', () => {
    render(
      <Dark>
        <ChannelHeader name="general" />
      </Dark>,
    );
    expect(screen.getByLabelText('general channel header')).toBeInTheDocument();
  });
});
