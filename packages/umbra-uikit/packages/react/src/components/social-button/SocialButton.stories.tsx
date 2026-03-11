/**
 * SocialButton — Stories showing all providers and variants.
 *
 * @module stories/social-button
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SocialButton } from './SocialButton';

const meta: Meta<typeof SocialButton> = {
  title: 'Components/SocialButton',
  component: SocialButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SocialButton>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    provider: 'google',
  },
};

// ---------------------------------------------------------------------------
// All Providers — Filled
// ---------------------------------------------------------------------------

export const AllProvidersFilled: Story = {
  name: 'All Providers (Filled)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <SocialButton provider="google" fullWidth />
      <SocialButton provider="apple" fullWidth />
      <SocialButton provider="facebook" fullWidth />
      <SocialButton provider="github" fullWidth />
      <SocialButton provider="x" fullWidth />
      <SocialButton provider="microsoft" fullWidth />
      <SocialButton provider="discord" fullWidth />
      <SocialButton provider="slack" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Providers — Outline
// ---------------------------------------------------------------------------

export const AllProvidersOutline: Story = {
  name: 'All Providers (Outline)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <SocialButton provider="google" variant="outline" fullWidth />
      <SocialButton provider="apple" variant="outline" fullWidth />
      <SocialButton provider="facebook" variant="outline" fullWidth />
      <SocialButton provider="github" variant="outline" fullWidth />
      <SocialButton provider="x" variant="outline" fullWidth />
      <SocialButton provider="microsoft" variant="outline" fullWidth />
      <SocialButton provider="discord" variant="outline" fullWidth />
      <SocialButton provider="slack" variant="outline" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Icon Only
// ---------------------------------------------------------------------------

export const IconOnly: Story = {
  name: 'Icon Only',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <SocialButton provider="google" iconOnly />
      <SocialButton provider="apple" iconOnly />
      <SocialButton provider="facebook" iconOnly />
      <SocialButton provider="github" iconOnly />
      <SocialButton provider="x" iconOnly />
      <SocialButton provider="discord" iconOnly />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <SocialButton provider="google" size="sm" fullWidth />
      <SocialButton provider="google" size="md" fullWidth />
      <SocialButton provider="google" size="lg" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Custom Action
// ---------------------------------------------------------------------------

export const ContinueWith: Story = {
  name: 'Continue With',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <SocialButton provider="google" action="Continue with" fullWidth />
      <SocialButton provider="apple" action="Continue with" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Sign Up
// ---------------------------------------------------------------------------

export const SignUp: Story = {
  name: 'Sign Up',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <SocialButton provider="google" action="Sign up with" fullWidth />
      <SocialButton provider="github" action="Sign up with" fullWidth />
    </div>
  ),
};
