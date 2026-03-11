import React from 'react';
import { StatCard, HStack, VStack } from '@wisp-ui/react';
import { Users, TrendingUp, ShoppingCart, DollarSign, Activity, Eye } from 'lucide-react';
import type { ComponentEntry } from '../types';

const revenueData = [12, 15, 13, 18, 16, 21, 19, 24, 22, 28, 25, 30];
const usersData = [100, 120, 115, 140, 135, 160, 155, 180, 175, 200, 195, 220];
const ordersData = [30, 28, 35, 32, 40, 38, 42, 45, 43, 48, 50, 52];

export const statCardEntry: ComponentEntry = {
  slug: 'stat-card',
  name: 'StatCard',
  category: 'components',
  subcategory: 'Data Display',
  description:
    'KPI / metric display card with optional icon, trend indicator, and inline sparkline chart. Ideal for dashboards, analytics, and overview screens.',
  variantCount: 5,
  keywords: ['stat', 'statistic', 'kpi', 'metric', 'card', 'dashboard', 'analytics', 'trend', 'sparkline', 'number', 'value'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <StatCard
        value="1,234"
        label="Active Users"
        icon={Users}
        trend={12.5}
        size="sm"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <div style={{ maxWidth: 320 }}>
          <StatCard
            value="1,234"
            label="Active Users"
            icon={Users}
            trend={12.5}
            trendLabel="vs last week"
          />
        </div>
      ),
      code: `import { StatCard } from '@wisp-ui/react';
import { Users } from 'lucide-react';

<StatCard
  value="1,234"
  label="Active Users"
  icon={Users}
  trend={12.5}
  trendLabel="vs last week"
/>`,
    },
    {
      title: 'With Sparkline',
      render: (
        <div style={{ maxWidth: 360 }}>
          <StatCard
            value="$48,290"
            label="Revenue"
            icon={DollarSign}
            trend={8.3}
            trendLabel="vs last month"
            sparklineData={revenueData}
            variant="success"
          />
        </div>
      ),
      code: `import { StatCard } from '@wisp-ui/react';
import { DollarSign } from 'lucide-react';

<StatCard
  value="$48,290"
  label="Revenue"
  icon={DollarSign}
  trend={8.3}
  trendLabel="vs last month"
  sparklineData={[12, 15, 13, 18, 16, 21, 19, 24, 22, 28, 25, 30]}
  variant="success"
/>`,
    },
    {
      title: 'Variants',
      render: (
        <VStack gap="md">
          <HStack gap="md">
            <StatCard value="1,234" label="Users" icon={Users} trend={12.5} variant="default" />
            <StatCard value="892" label="Revenue" icon={DollarSign} trend={8.3} variant="success" />
          </HStack>
          <HStack gap="md">
            <StatCard value="23ms" label="Latency" icon={Activity} trend={-5.2} variant="warning" />
            <StatCard value="12" label="Errors" icon={Activity} trend={-15.0} variant="danger" />
          </HStack>
          <HStack gap="md">
            <StatCard value="4,521" label="Page Views" icon={Eye} trend={3.1} variant="info" />
          </HStack>
        </VStack>
      ),
      code: `<StatCard value="1,234" label="Users" icon={Users} trend={12.5} variant="default" />
<StatCard value="892" label="Revenue" icon={DollarSign} trend={8.3} variant="success" />
<StatCard value="23ms" label="Latency" icon={Activity} trend={-5.2} variant="warning" />
<StatCard value="12" label="Errors" icon={Activity} trend={-15.0} variant="danger" />
<StatCard value="4,521" label="Page Views" icon={Eye} trend={3.1} variant="info" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ maxWidth: 360 }}>
          <StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="sm" sparklineData={ordersData} />
          <StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="md" sparklineData={ordersData} />
          <StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="lg" sparklineData={ordersData} />
        </VStack>
      ),
      code: `<StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="sm" />
<StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="md" />
<StatCard value="42" label="Orders" icon={ShoppingCart} trend={5.0} size="lg" />`,
    },
    {
      title: 'Negative Trend',
      render: (
        <HStack gap="md" style={{ maxWidth: 600 }}>
          <StatCard
            value="3,210"
            label="Visitors"
            icon={Users}
            trend={-4.2}
            trendLabel="vs yesterday"
            variant="danger"
            sparklineData={[20, 18, 19, 15, 16, 12, 14, 10, 11, 8, 9, 7]}
          />
          <StatCard
            value="$12,400"
            label="Revenue"
            icon={TrendingUp}
            trend={22.1}
            trendLabel="vs last month"
            variant="success"
            sparklineData={revenueData}
          />
        </HStack>
      ),
      code: `<StatCard
  value="3,210"
  label="Visitors"
  trend={-4.2}
  trendLabel="vs yesterday"
  variant="danger"
  sparklineData={downtrendData}
/>`,
    },
    {
      title: 'Without Icon',
      render: (
        <HStack gap="md" style={{ maxWidth: 500 }}>
          <StatCard value="99.9%" label="Uptime" trend={0.1} description="Last 30 days" />
          <StatCard value="142" label="Open Issues" trend={-8.5} description="Across all repos" />
        </HStack>
      ),
      code: `<StatCard value="99.9%" label="Uptime" trend={0.1} description="Last 30 days" />`,
    },
    {
      title: 'Dashboard Grid',
      render: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, width: '100%' }}>
          <StatCard value="2,420" label="Active Users" icon={Users} trend={12.5} sparklineData={usersData} />
          <StatCard value="$48,290" label="Revenue" icon={DollarSign} trend={8.3} variant="success" sparklineData={revenueData} />
          <StatCard value="573" label="Orders" icon={ShoppingCart} trend={-2.1} variant="warning" sparklineData={ordersData} />
        </div>
      ),
      code: `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
  <StatCard value="2,420" label="Active Users" icon={Users} trend={12.5} sparklineData={usersData} />
  <StatCard value="$48,290" label="Revenue" icon={DollarSign} trend={8.3} variant="success" sparklineData={revenueData} />
  <StatCard value="573" label="Orders" icon={ShoppingCart} trend={-2.1} variant="warning" sparklineData={ordersData} />
</div>`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="md" style={{ maxWidth: 600 }}>
          <StatCard value="" label="" skeleton />
          <StatCard value="" label="" skeleton size="lg" />
        </HStack>
      ),
      code: `<StatCard value="" label="" skeleton />`,
    },
  ],

  props: [
    { name: 'value', type: 'string | number', required: true, description: 'The metric value to display.' },
    { name: 'label', type: 'string', required: true, description: 'Metric label / title.' },
    { name: 'description', type: 'string', description: 'Optional subtitle or description text.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Lucide icon component rendered beside the label.' },
    { name: 'trend', type: 'number', description: 'Percentage change (positive = up arrow, negative = down arrow).' },
    { name: 'trendLabel', type: 'string', description: 'Custom text beside the trend indicator.' },
    { name: 'sparklineData', type: 'number[]', description: 'Data array to render an inline Sparkline chart.' },
    { name: 'variant', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Color accent variant.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show a loading skeleton placeholder.' },
  ],
};
