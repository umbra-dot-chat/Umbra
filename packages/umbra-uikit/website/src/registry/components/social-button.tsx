import React from 'react';
import { SocialButton, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const socialButtonEntry: ComponentEntry = {
  slug: 'social-button',
  name: 'SocialButton',
  category: 'components',
  subcategory: 'Social',
  description:
    'Pre-styled OAuth login buttons for 8 providers (Google, Apple, GitHub, etc.) with filled/outline variants and icon-only mode.',
  variantCount: 2,
  keywords: ['social', 'button', 'oauth', 'login', 'google', 'apple', 'github'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 180, pointerEvents: 'none' }}>
      <SocialButton provider="google" size="sm" />
      <SocialButton provider="github" size="sm" />
    </VStack>
  ),

  examples: [
    {
      title: 'Providers',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 280 }}>
          {(['google', 'apple', 'github', 'x', 'discord', 'slack'] as const).map((p) => (
            <SocialButton key={p} provider={p} fullWidth />
          ))}
        </VStack>
      ),
      code: `import { SocialButton } from '@wisp-ui/react';\n\n<SocialButton provider="google" />
<SocialButton provider="apple" />
<SocialButton provider="github" />
<SocialButton provider="discord" />`,
      rnCode: `import { SocialButton } from '@wisp-ui/react-native';

<SocialButton provider="google" onPress={() => {}} />
<SocialButton provider="apple" onPress={() => {}} />
<SocialButton provider="github" onPress={() => {}} />
<SocialButton provider="discord" onPress={() => {}} />`,
    },
    {
      title: 'Variants & Icon Only',
      render: (
        <VStack gap="md">
          <HStack gap="sm">
            <SocialButton provider="google" variant="filled" />
            <SocialButton provider="google" variant="outline" />
          </HStack>
          <HStack gap="sm">
            {(['google', 'apple', 'github', 'x', 'discord'] as const).map((p) => (
              <SocialButton key={p} provider={p} iconOnly />
            ))}
          </HStack>
        </VStack>
      ),
      code: `<SocialButton provider="google" variant="filled" />
<SocialButton provider="google" variant="outline" />
<SocialButton provider="google" iconOnly />`,
      rnCode: `import { SocialButton } from '@wisp-ui/react-native';

<SocialButton provider="google" variant="filled" onPress={() => {}} />
<SocialButton provider="google" variant="outline" onPress={() => {}} />
<SocialButton provider="google" iconOnly onPress={() => {}} />`,
    },
  ],

  props: [
    { name: 'provider', type: "'google' | 'apple' | 'facebook' | 'github' | 'x' | 'microsoft' | 'discord' | 'slack'", required: true, description: 'OAuth provider.' },
    { name: 'action', type: 'string', default: "'Sign in with'", description: 'Action label prefix.' },
    { name: 'variant', type: "'filled' | 'outline'", default: "'filled'", description: 'Visual style.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to full width.' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Show only icon.' },
  ],
};
