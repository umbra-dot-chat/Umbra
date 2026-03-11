import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Bell, Mail, Shield, Smartphone, Globe, Lock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Checkbox> = {
  title: 'React/Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    error: false,
    skeleton: false,
    indeterminate: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right' }}>
      {label}
    </Text>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Checkbox {...args} label="Accept terms and conditions" />,
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <Checkbox size={size} defaultChecked label={`Checked ${size}`} />
          <Checkbox size={size} label={`Unchecked ${size}`} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. States
// ---------------------------------------------------------------------------

export const States: Story = {
  name: 'States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Checkbox size="lg" label="Unchecked" />
        <Checkbox size="lg" defaultChecked label="Checked" />
        <Checkbox size="lg" indeterminate label="Indeterminate" />
        <Checkbox size="lg" disabled label="Disabled" />
        <Checkbox size="lg" disabled defaultChecked label="Disabled checked" />
        <Checkbox size="lg" disabled indeterminate label="Disabled indeterminate" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. WithLabels
// ---------------------------------------------------------------------------

export const WithLabels: Story = {
  name: 'With Labels',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox size="md" label="Simple label" />
      <Checkbox
        size="md"
        label="Email notifications"
        description="Receive email updates about your account activity and security alerts."
      />
      <Checkbox
        size="lg"
        defaultChecked
        label="Marketing emails"
        description="Get news about product updates and promotions."
      />
      <Checkbox
        size="lg"
        label={
          <span>
            I agree to the{' '}
            <span style={{ textDecoration: 'underline' }}>Terms of Service</span>
          </span>
        }
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error
// ---------------------------------------------------------------------------

export const Error: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox size="md" error label="This field is required" />
      <Checkbox size="md" error defaultChecked label="Checked with error" />
      <Checkbox
        size="lg"
        error
        label="Accept terms"
        description="You must accept the terms to continue."
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Checkbox key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [agreed, setAgreed] = useState(false);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Checkbox
            checked={agreed}
            onChange={setAgreed}
            size="lg"
            label="I agree to the terms"
          />
          <Text size="sm" color="secondary">
            {agreed ? 'Agreed' : 'Not agreed'}
          </Text>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 8. Composition — Realistic Notification Preferences Form
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const NotificationPreferences = () => {
      const [emailAlerts, setEmailAlerts] = useState(true);
      const [pushNotifs, setPushNotifs] = useState(true);
      const [smsAlerts, setSmsAlerts] = useState(false);
      const [securityAlerts, setSecurityAlerts] = useState(true);
      const [newsletter, setNewsletter] = useState(false);
      const [publicProfile, setPublicProfile] = useState(true);

      // Composition always renders a dark card
      return (
        <div
          style={{
            maxWidth: 420,
            padding: 20,
            borderRadius: 12,
            backgroundColor: '#161A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Text size="md" weight="semibold" style={{ color: '#F7F8FA', marginBottom: 4 }}>
            Notification Preferences
          </Text>
          <Text size="xs" style={{ color: '#667085', marginBottom: 20 }}>
            Choose how you want to be notified about activity.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { icon: Mail, label: 'Email alerts', desc: 'Important account notifications', value: emailAlerts, onChange: setEmailAlerts },
              { icon: Bell, label: 'Push notifications', desc: 'Real-time browser notifications', value: pushNotifs, onChange: setPushNotifs },
              { icon: Smartphone, label: 'SMS alerts', desc: 'Text messages for critical updates', value: smsAlerts, onChange: setSmsAlerts },
              { icon: Shield, label: 'Security alerts', desc: 'Login attempts and password changes', value: securityAlerts, onChange: setSecurityAlerts },
              { icon: Globe, label: 'Newsletter', desc: 'Weekly product news and tips', value: newsletter, onChange: setNewsletter },
              { icon: Lock, label: 'Public profile', desc: 'Allow others to see your profile', value: publicProfile, onChange: setPublicProfile },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon icon={item.icon} size="sm" style={{ color: '#94A0B8' }} />
                <div style={{ flex: 1 }}>
                  <Text size="sm" weight="medium" style={{ color: '#F7F8FA' }}>{item.label}</Text>
                  <Text size="xs" style={{ color: '#667085' }}>{item.desc}</Text>
                </div>
                <Checkbox
                  checked={item.value}
                  onChange={item.onChange}
                  size="md"
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return <NotificationPreferences />;
  },
};

// ---------------------------------------------------------------------------
// 9. Interactive Task List — Working example with animations
// ---------------------------------------------------------------------------

export const TaskList: Story = {
  name: 'Task List',
  render: () => {
    const InteractiveTaskList = () => {
      const [tasks, setTasks] = useState([
        { id: '1', label: 'Review pull request #142', done: true },
        { id: '2', label: 'Update design tokens', done: true },
        { id: '3', label: 'Build checkbox animations', done: false },
        { id: '4', label: 'Write unit tests', done: false },
        { id: '5', label: 'Deploy to staging', done: false },
        { id: '6', label: 'Send launch email', done: false },
      ]);

      const toggleTask = (id: string) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        );
      };

      const doneCount = tasks.filter((t) => t.done).length;
      const allDone = doneCount === tasks.length;

      const toggleAll = () => {
        setTasks((prev) => prev.map((t) => ({ ...t, done: !allDone })));
      };

      return (
        <div
          style={{
            maxWidth: 380,
            borderRadius: 12,
            backgroundColor: '#161A24',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Text size="md" weight="semibold" style={{ color: '#F7F8FA' }}>
                Sprint Tasks
              </Text>
              <Text size="xs" style={{ color: '#667085', marginTop: 2 }}>
                {doneCount} of {tasks.length} completed
              </Text>
            </div>
            <Checkbox
              checked={allDone}
              indeterminate={doneCount > 0 && !allDone}
              onChange={toggleAll}
              size="md"
            />
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 2,
              backgroundColor: '#202531',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(doneCount / tasks.length) * 100}%`,
                backgroundColor: '#FFFFFF',
                borderRadius: 1,
                transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          {/* Task items */}
          <div style={{ padding: '8px 0' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  transition: 'background-color 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <Checkbox
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  size="md"
                />
                <Text
                  size="sm"
                  style={{
                    color: task.done ? '#667085' : '#F7F8FA',
                    marginLeft: 12,
                    textDecoration: task.done ? 'line-through' : 'none',
                    transition: 'color 200ms ease, text-decoration 200ms ease',
                  }}
                >
                  {task.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return <InteractiveTaskList />;
  },
};
