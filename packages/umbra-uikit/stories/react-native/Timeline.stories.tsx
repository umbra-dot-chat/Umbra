import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Timeline } from '@wisp-ui/react-native';
import type { TimelineItem } from '@wisp-ui/react-native';

const meta: Meta<typeof Timeline> = {
  title: 'React Native/Components/Data Display/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const basicItems: TimelineItem[] = [
  { id: '1', title: 'Order placed', description: 'Your order has been confirmed.', timestamp: 'Jan 15, 10:30 AM', status: 'completed' },
  { id: '2', title: 'Payment received', description: 'Payment processed successfully.', timestamp: 'Jan 15, 10:32 AM', status: 'completed' },
  { id: '3', title: 'Shipped', description: 'Package is on the way.', timestamp: 'Jan 16, 2:15 PM', status: 'active' },
  { id: '4', title: 'Delivered', status: 'pending' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Order tracking timeline
      </div>
      <Timeline items={basicItems} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Multiple Items
// ---------------------------------------------------------------------------

export const MultipleItems: Story = {
  name: 'Multiple Items',
  render: () => {
    const items: TimelineItem[] = [
      { id: '1', title: 'Project created', description: 'Initial repository setup.', timestamp: 'Dec 1, 2024', status: 'completed' },
      { id: '2', title: 'Design review', description: 'Wireframes approved by stakeholders.', timestamp: 'Dec 5, 2024', status: 'completed' },
      { id: '3', title: 'Development started', description: 'Core features implemented.', timestamp: 'Dec 10, 2024', status: 'completed' },
      { id: '4', title: 'QA testing', description: 'Running integration tests.', timestamp: 'Dec 18, 2024', status: 'completed' },
      { id: '5', title: 'Staging deploy', description: 'Deployed to staging environment.', timestamp: 'Dec 22, 2024', status: 'active' },
      { id: '6', title: 'Production release', status: 'pending' },
      { id: '7', title: 'Post-launch monitoring', status: 'pending' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Project milestone timeline (7 items)
        </div>
        <Timeline items={items} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => {
    const CheckIcon = ({ size = 16, color = '#fff', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );

    const CircleIcon = ({ size = 16, color = '#fff', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );

    const ClockIcon = ({ size = 16, color = '#fff', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );

    const items: TimelineItem[] = [
      { id: '1', title: 'Completed step', description: 'This step is done.', icon: CheckIcon, status: 'completed' },
      { id: '2', title: 'Active step', description: 'Currently in progress.', icon: CircleIcon, status: 'active' },
      { id: '3', title: 'Pending step', description: 'Waiting to start.', icon: ClockIcon, status: 'pending' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
        <div>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Large size with icons (icons appear at lg)
          </div>
          <Timeline items={items} size="lg" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Custom dot colors
          </div>
          <Timeline
            size="lg"
            items={[
              { id: '1', title: 'Success', description: 'Completed with no issues.', color: '#22C55E', icon: CheckIcon, status: 'completed' },
              { id: '2', title: 'Warning', description: 'Needs attention.', color: '#F59E0B', icon: CircleIcon, status: 'active' },
              { id: '3', title: 'Error', description: 'Failed validation.', color: '#EF4444', icon: ClockIcon, status: 'pending' },
            ]}
          />
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const items: TimelineItem[] = [
      { id: '1', title: 'First event', description: 'Description text.', timestamp: '10:00 AM', status: 'completed' },
      { id: '2', title: 'Second event', description: 'Description text.', timestamp: '11:00 AM', status: 'active' },
      { id: '3', title: 'Third event', status: 'pending' },
    ];

    return (
      <div style={{ display: 'flex', gap: 48 }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
              {size}
            </div>
            <Timeline items={items} size={size} />
          </div>
        ))}
      </div>
    );
  },
};
