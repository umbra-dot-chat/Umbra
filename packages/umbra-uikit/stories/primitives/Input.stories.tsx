import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { Search, X, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Input> = {
  title: 'React/Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    fullWidth: false,
    placeholder: 'Enter text...',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right', paddingTop: 8 }}>
      {label}
    </Text>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Input {...args} />,
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
          <Input size={size} placeholder={`Size ${size}`} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Input label="Full Name" placeholder="John Doe" size="md" />
      <Input label="Email Address" placeholder="john@example.com" size="md" />
      <Input label="Company" placeholder="Acme Inc." size="sm" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Hint
// ---------------------------------------------------------------------------

export const WithHint: Story = {
  name: 'With Hint',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <Input
        label="Email"
        placeholder="you@example.com"
        hint="We'll never share your email with anyone."
        size="md"
      />
      <Input
        label="Username"
        placeholder="johndoe"
        hint="Must be 3-20 characters, letters and numbers only."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <Input
        icon={Search}
        placeholder="Search..."
        size="md"
      />
      <Input
        trailingIcon={X}
        placeholder="With trailing icon"
        size="md"
      />
      <Input
        icon={Mail}
        trailingIcon={X}
        placeholder="Both icons"
        size="md"
      />
      <Input
        icon={Search}
        placeholder="Large with icon"
        size="lg"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Error
// ---------------------------------------------------------------------------

export const Error: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <Input
        label="Email"
        placeholder="you@example.com"
        error="Please enter a valid email address."
        size="md"
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        error="Password must be at least 8 characters."
        icon={Lock}
        size="md"
      />
      <Input
        placeholder="Boolean error (red border only)"
        error={true}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <Input
        label="Disabled input"
        placeholder="Cannot type here"
        disabled
        size="md"
      />
      <Input
        placeholder="Disabled with value"
        value="Read-only value"
        disabled
        size="md"
        icon={Lock}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Input key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
      <Input fullWidth placeholder="Full width input" size="md" />
      <Input fullWidth label="Email" placeholder="you@example.com" hint="Full width with label and hint" size="md" icon={Mail} />
      <Input fullWidth placeholder="Full width large" size="lg" icon={Search} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Composition — Login Form
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const LoginForm = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [submitted, setSubmitted] = useState(false);

      const emailError = submitted && !email.includes('@') ? 'Please enter a valid email address.' : undefined;
      const passwordError = submitted && password.length < 8 ? 'Password must be at least 8 characters.' : undefined;

      return (
        <div style={{ maxWidth: 400 }}>
          <Text size="lg" weight="semibold" style={{ marginBottom: 4 }}>
            Sign in
          </Text>
          <Text size="sm" color="secondary" style={{ marginBottom: 20 }}>
            Enter your credentials to continue.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              fullWidth
              label="Email"
              placeholder="you@example.com"
              icon={Mail}
              size="md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
            />

            <Input
              fullWidth
              label="Password"
              placeholder="Enter password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              trailingIcon={showPassword ? EyeOff : Eye}
              size="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              hint={!passwordError ? 'Must be at least 8 characters.' : undefined}
            />

            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={() => setSubmitted(true)}
              style={{ marginTop: 4 }}
            >
              Sign In
            </Button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="tertiary" size="sm">
                Forgot password?
              </Button>
            </div>
          </div>
        </div>
      );
    };

    return <LoginForm />;
  },
};
