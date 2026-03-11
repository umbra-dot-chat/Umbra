import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { toastVariants } from '@coexist/wisp-core/types/Toast.types';
import { Text } from '../text';
import { Button } from '../button';
import { Icon } from '../icon';
import { CheckCircle, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';

const meta: Meta<typeof Toast> = {
  title: 'Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: { title: 'Notification', dismissible: true },
  argTypes: {
    variant: { control: 'select', options: [...toastVariants] },
    dismissible: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  args: {
    title: 'Changes saved',
    description: 'Your settings have been updated successfully.',
    onDismiss: () => {},
  },
};

export const Variants: Story = {
  name: 'Variants',
  render: () => {
    const variantIcons: Record<string, React.ReactNode> = {
      default: <Icon icon={Bell} size="md" />,
      success: <Icon icon={CheckCircle} size="md" />,
      warning: <Icon icon={AlertTriangle} size="md" />,
      danger: <Icon icon={AlertCircle} size="md" />,
      info: <Icon icon={Info} size="md" />,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
        {toastVariants.map((variant) => (
          <Toast
            key={variant}
            variant={variant}
            title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} toast`}
            description={`This is a ${variant} notification message.`}
            icon={variantIcons[variant]}
            onDismiss={() => {}}
          />
        ))}
      </div>
    );
  },
};

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <Toast
        variant="default"
        title="File deleted"
        description="report-2024.pdf was moved to trash."
        onDismiss={() => {}}
        action={
          <Button
            variant="secondary"
            size="xs"
            style={{ color: '#F7F8FA', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            Undo
          </Button>
        }
      />
      <Toast
        variant="danger"
        title="Connection lost"
        description="Unable to reach the server."
        icon={<Icon icon={AlertCircle} size="md" />}
        onDismiss={() => {}}
        action={<Button variant="secondary" size="xs">Retry</Button>}
      />
    </div>
  ),
};

export const TitleOnly: Story = {
  name: 'Title Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <Toast title="Saved" onDismiss={() => {}} />
      <Toast variant="success" title="Payment confirmed" icon={<Icon icon={CheckCircle} size="md" />} onDismiss={() => {}} />
    </div>
  ),
};

export const NonDismissible: Story = {
  name: 'Non-Dismissible',
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Toast
        variant="info"
        title="Processing"
        description="Your request is being processed. Please wait."
        icon={<Icon icon={Info} size="md" />}
        dismissible={false}
      />
    </div>
  ),
};

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, maxWidth: 420 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toast
          surface="glass"
          title="Glass Toast"
          description="This toast uses the frosted-glass surface variant."
          icon={<Icon icon={Bell} size="md" />}
          onDismiss={() => {}}
        />
        <Toast
          variant="success"
          surface="glass"
          title="Glass Success"
          description="A glass surface applied to a success toast."
          icon={<Icon icon={CheckCircle} size="md" />}
          onDismiss={() => {}}
        />
      </div>
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <SectionLabel>Notification stack</SectionLabel>
      <Toast
        variant="success"
        title="Deployment complete"
        description="v2.4.1 is now live in production."
        icon={<Icon icon={CheckCircle} size="md" />}
        onDismiss={() => {}}
      />
      <Toast
        variant="warning"
        title="High memory usage"
        description="Server memory at 92%. Consider scaling."
        icon={<Icon icon={AlertTriangle} size="md" />}
        onDismiss={() => {}}
        action={<Button variant="secondary" size="xs">Details</Button>}
      />
      <Toast
        title="New comment"
        description="Alice replied to your pull request."
        icon={<Icon icon={Bell} size="md" />}
        onDismiss={() => {}}
      />
    </div>
  ),
};
