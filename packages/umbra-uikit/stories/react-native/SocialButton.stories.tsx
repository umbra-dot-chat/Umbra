import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SocialButton } from '@wisp-ui/react-native';

const meta: Meta<typeof SocialButton> = {
  title: 'React Native/Components/Utilities/SocialButton',
  component: SocialButton,
  tags: ['autodocs'],
  argTypes: {
    provider: { control: 'select', options: ['google', 'apple', 'facebook', 'github', 'x', 'microsoft', 'discord', 'slack'] },
    variant: { control: 'select', options: ['filled', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SocialButton>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    provider: 'google',
    variant: 'filled',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Providers
// ---------------------------------------------------------------------------

export const Providers: Story = {
  name: 'Providers',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Filled</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" />
        <SocialButton provider="apple" />
        <SocialButton provider="facebook" />
        <SocialButton provider="github" />
        <SocialButton provider="x" />
        <SocialButton provider="microsoft" />
        <SocialButton provider="discord" />
        <SocialButton provider="slack" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Outline</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" variant="outline" />
        <SocialButton provider="apple" variant="outline" />
        <SocialButton provider="facebook" variant="outline" />
        <SocialButton provider="github" variant="outline" />
        <SocialButton provider="x" variant="outline" />
        <SocialButton provider="microsoft" variant="outline" />
        <SocialButton provider="discord" variant="outline" />
        <SocialButton provider="slack" variant="outline" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Icon Only</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" iconOnly />
        <SocialButton provider="apple" iconOnly />
        <SocialButton provider="facebook" iconOnly />
        <SocialButton provider="github" iconOnly />
        <SocialButton provider="x" iconOnly />
        <SocialButton provider="microsoft" iconOnly />
        <SocialButton provider="discord" iconOnly />
        <SocialButton provider="slack" iconOnly />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" size="sm" />
        <SocialButton provider="github" size="sm" />
        <SocialButton provider="apple" size="sm" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" size="md" />
        <SocialButton provider="github" size="md" />
        <SocialButton provider="apple" size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" size="lg" />
        <SocialButton provider="github" size="lg" />
        <SocialButton provider="apple" size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
      <SocialButton provider="google" fullWidth />
      <SocialButton provider="apple" fullWidth />
      <SocialButton provider="github" fullWidth />
      <SocialButton provider="discord" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Custom Action
// ---------------------------------------------------------------------------

export const CustomAction: Story = {
  name: 'Custom Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Sign Up</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" action="Sign up with" />
        <SocialButton provider="github" action="Sign up with" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Continue</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SocialButton provider="google" action="Continue with" />
        <SocialButton provider="apple" action="Continue with" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <SocialButton provider="google" disabled />
      <SocialButton provider="apple" disabled />
      <SocialButton provider="github" disabled variant="outline" />
    </div>
  ),
};
