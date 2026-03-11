import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '@wisp-ui/react';
import { alertVariants } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell } from 'lucide-react';

const meta: Meta<typeof Alert> = {
  title: 'React/Primitives/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: { variant: 'default' },
  argTypes: {
    variant: { control: 'select', options: [...alertVariants] },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    title: 'Heads up',
    description: 'This is a default alert with neutral styling.',
  },
};

// ---------------------------------------------------------------------------
// Info
// ---------------------------------------------------------------------------

export const InfoVariant: Story = {
  name: 'Info',
  args: {
    variant: 'info',
    title: 'New update available',
    description: 'A new version has been released. Please refresh to update.',
    icon: <Icon icon={Info} size="md" />,
  },
};

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Changes saved',
    description: 'Your settings have been updated successfully.',
    icon: <Icon icon={CheckCircle} size="md" />,
  },
};

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Storage almost full',
    description: 'You have used 90% of your available storage.',
    icon: <Icon icon={AlertTriangle} size="md" />,
  },
};

// ---------------------------------------------------------------------------
// Danger
// ---------------------------------------------------------------------------

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Deletion failed',
    description: 'The resource could not be deleted. Please try again.',
    icon: <Icon icon={XCircle} size="md" />,
  },
};

// ---------------------------------------------------------------------------
// With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert
        variant="warning"
        title="Unsaved changes"
        description="You have unsaved changes that will be lost."
        icon={<Icon icon={AlertTriangle} size="md" />}
        action={<Button variant="secondary" size="xs">Save now</Button>}
      />
      <Alert
        variant="danger"
        title="Connection lost"
        description="Unable to reach the server."
        icon={<Icon icon={XCircle} size="md" />}
        action={<Button variant="secondary" size="xs">Retry</Button>}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Icon (all variants)
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => {
    const variantIcons: Record<string, React.ReactNode> = {
      default: <Icon icon={Bell} size="md" />,
      info: <Icon icon={Info} size="md" />,
      success: <Icon icon={CheckCircle} size="md" />,
      warning: <Icon icon={AlertTriangle} size="md" />,
      danger: <Icon icon={XCircle} size="md" />,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
        {alertVariants.map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} alert`}
            description={`This is a ${variant} alert with an icon.`}
            icon={variantIcons[variant]}
          />
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Title Only
// ---------------------------------------------------------------------------

export const TitleOnly: Story = {
  name: 'Title Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert title="Simple notification" />
      <Alert variant="success" title="Payment confirmed" icon={<Icon icon={CheckCircle} size="md" />} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Description Only
// ---------------------------------------------------------------------------

export const DescriptionOnly: Story = {
  name: 'Description Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert description="This alert has no title, only a description." />
      <Alert
        variant="info"
        description="Informational message without a title."
        icon={<Icon icon={Info} size="md" />}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <SectionLabel>Alert stack</SectionLabel>
      <Alert
        variant="success"
        title="Deployment complete"
        description="v2.4.1 is now live in production."
        icon={<Icon icon={CheckCircle} size="md" />}
      />
      <Alert
        variant="warning"
        title="High memory usage"
        description="Server memory at 92%. Consider scaling."
        icon={<Icon icon={AlertTriangle} size="md" />}
        action={<Button variant="secondary" size="xs">Details</Button>}
      />
      <Alert
        variant="danger"
        title="Build failed"
        description="CI pipeline encountered 3 errors."
        icon={<Icon icon={XCircle} size="md" />}
        action={<Button variant="secondary" size="xs">View logs</Button>}
      />
      <Alert
        variant="info"
        title="Scheduled maintenance"
        description="Downtime expected on Feb 15 from 2:00-4:00 AM UTC."
        icon={<Icon icon={Info} size="md" />}
      />
      <Alert
        title="New comment"
        description="Alice replied to your pull request."
        icon={<Icon icon={Bell} size="md" />}
      />
    </div>
  ),
};
