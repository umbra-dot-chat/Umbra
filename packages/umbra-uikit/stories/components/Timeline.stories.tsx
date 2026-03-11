/**
 * Timeline — Stories showing all orientations, sizes, and states.
 *
 * @module stories/timeline
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Timeline } from '@wisp-ui/react';
import { CheckCircle, Package, Truck, CreditCard, ShoppingCart, Clock, Star, AlertCircle } from 'lucide-react';

const meta: Meta<typeof Timeline> = {
  title: 'React/Components/Data Display/Timeline',
  component: Timeline,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Timeline>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    items: [
      { id: '1', title: 'Order placed', description: 'Your order has been confirmed', timestamp: 'Jan 15, 2025 9:00 AM', status: 'completed' },
      { id: '2', title: 'Payment confirmed', description: 'Payment of $49.99 processed', timestamp: 'Jan 15, 2025 9:05 AM', status: 'completed' },
      { id: '3', title: 'Processing', description: 'Your order is being prepared', timestamp: 'Jan 15, 2025 10:30 AM', status: 'active' },
      { id: '4', title: 'Shipped', description: 'Package handed to carrier', status: 'pending' },
      { id: '5', title: 'Delivered', description: 'Estimated delivery in 3-5 days', status: 'pending' },
    ],
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  args: {
    size: 'lg',
    items: [
      { id: '1', title: 'Order placed', description: 'Order #12345 confirmed', timestamp: 'Jan 15, 2025', icon: ShoppingCart, status: 'completed' },
      { id: '2', title: 'Payment confirmed', description: 'Visa ending in 4242', timestamp: 'Jan 15, 2025', icon: CreditCard, status: 'completed' },
      { id: '3', title: 'Preparing shipment', description: 'Packaging your items', timestamp: 'Jan 16, 2025', icon: Package, status: 'active' },
      { id: '4', title: 'In transit', description: 'On the way to you', icon: Truck, status: 'pending' },
      { id: '5', title: 'Delivered', description: 'Arrives by Jan 20', icon: CheckCircle, status: 'pending' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Active Step
// ---------------------------------------------------------------------------

export const ActiveStep: Story = {
  name: 'Active Step',
  args: {
    items: [
      { id: '1', title: 'Account created', timestamp: '2 days ago', status: 'completed' },
      { id: '2', title: 'Profile completed', timestamp: 'Yesterday', status: 'completed' },
      { id: '3', title: 'Verification in progress', description: 'We are verifying your identity. This usually takes 1-2 business days.', timestamp: 'Today', status: 'active' },
      { id: '4', title: 'Account activated', status: 'pending' },
    ],
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => {
    const sampleItems = [
      { id: '1', title: 'First event', description: 'Description text', timestamp: '9:00 AM', status: 'completed' as const },
      { id: '2', title: 'Second event', description: 'Description text', timestamp: '10:00 AM', status: 'active' as const },
      { id: '3', title: 'Third event', description: 'Description text', timestamp: '11:00 AM', status: 'pending' as const },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div>
          <span style={{ fontWeight: 600, marginBottom: 12, display: 'block' }}>Small</span>
          <Timeline items={sampleItems} size="sm" />
        </div>
        <div>
          <span style={{ fontWeight: 600, marginBottom: 12, display: 'block' }}>Medium (default)</span>
          <Timeline items={sampleItems} size="md" />
        </div>
        <div>
          <span style={{ fontWeight: 600, marginBottom: 12, display: 'block' }}>Large</span>
          <Timeline items={sampleItems} size="lg" />
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  args: {
    orientation: 'horizontal',
    items: [
      { id: '1', title: 'Ordered', timestamp: 'Jan 15', status: 'completed' },
      { id: '2', title: 'Confirmed', timestamp: 'Jan 15', status: 'completed' },
      { id: '3', title: 'Shipping', timestamp: 'Jan 16', status: 'active' },
      { id: '4', title: 'Delivered', timestamp: 'Jan 20', status: 'pending' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
};

// ---------------------------------------------------------------------------
// Custom Colors
// ---------------------------------------------------------------------------

export const CustomColors: Story = {
  name: 'Custom Colors',
  args: {
    items: [
      { id: '1', title: 'Build succeeded', description: 'All tests passed', timestamp: '10:00 AM', color: '#22C55E', status: 'completed' },
      { id: '2', title: 'Deploy started', description: 'Deploying to staging', timestamp: '10:05 AM', color: '#3B82F6', status: 'active' },
      { id: '3', title: 'Performance check', description: 'Lighthouse audit pending', timestamp: '10:10 AM', color: '#F59E0B', status: 'pending' },
      { id: '4', title: 'Release', description: 'Publish to production', color: '#8B5CF6', status: 'pending' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    skeleton: true,
    items: [],
  },
};
