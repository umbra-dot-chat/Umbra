import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PinInput } from './PinInput';
import { pinInputSizes } from '@coexist/wisp-core/types/PinInput.types';
import { Text } from '../text';
import { Button } from '../button';
import { VStack, HStack } from '../../layouts/stack';
import { Box } from '../../layouts/box';
import { Card } from '../../layouts/card';
import { Icon } from '../icon';
import { useThemeColors } from '../../providers';
import { ShieldCheck, KeyRound, Smartphone } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof PinInput> = {
  title: 'Primitives/PinInput',
  component: PinInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...pinInputSizes] },
    type: { control: 'select', options: ['number', 'text'] },
    length: { control: { type: 'number', min: 2, max: 10 } },
  },
};

export default meta;
type Story = StoryObj<typeof PinInput>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    size="xs"
    color="tertiary"
    weight="semibold"
    as="div"
    style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default — 6-digit numeric
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <PinInput label="Verification Code" hint="Enter the 6-digit code sent to your phone" />
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <VStack gap="xl">
      {pinInputSizes.map((size) => (
        <div key={size}>
          <SectionLabel>size=&quot;{size}&quot;</SectionLabel>
          <PinInput size={size} length={4} />
        </div>
      ))}
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 3. Numeric vs Alphanumeric
// ---------------------------------------------------------------------------

export const InputTypes: Story = {
  name: 'Numeric vs Alphanumeric',
  render: () => (
    <VStack gap="xl">
      <div>
        <SectionLabel>type=&quot;number&quot; (digits only)</SectionLabel>
        <PinInput type="number" label="Numeric Code" length={6} />
      </div>
      <div>
        <SectionLabel>type=&quot;text&quot; (alphanumeric)</SectionLabel>
        <PinInput type="text" label="Alphanumeric Code" length={6} />
      </div>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 4. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [code, setCode] = useState('');
    const [complete, setComplete] = useState(false);

    return (
      <VStack gap="lg">
        <PinInput
          value={code}
          onChange={setCode}
          onComplete={() => setComplete(true)}
          label="Enter Code"
        />
        <Text size="sm" color="secondary">
          Current value: <Text as="span" weight="semibold">&quot;{code}&quot;</Text>
          {complete && <Text as="span" color="success"> — Complete!</Text>}
        </Text>
        <HStack gap="xs">
          <Button size="sm" variant="tertiary" onClick={() => { setCode(''); setComplete(false); }}>
            Clear
          </Button>
          <Button size="sm" variant="tertiary" onClick={() => { setCode('123456'); setComplete(true); }}>
            Fill 123456
          </Button>
        </HStack>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Error States
// ---------------------------------------------------------------------------

export const ErrorStates: Story = {
  name: 'Error States',
  render: () => (
    <VStack gap="xl">
      <div>
        <SectionLabel>error string</SectionLabel>
        <PinInput error="Invalid verification code" label="Code" defaultValue="123" />
      </div>
      <div>
        <SectionLabel>error boolean</SectionLabel>
        <PinInput error label="Code" defaultValue="999" />
      </div>
      <div>
        <SectionLabel>warning</SectionLabel>
        <PinInput warning="Code is about to expire" label="Code" />
      </div>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 6. With Label and Hint
// ---------------------------------------------------------------------------

export const LabelAndHint: Story = {
  name: 'With Label and Hint',
  render: () => (
    <VStack gap="xl">
      <PinInput label="Two-Factor Code" hint="Check your authenticator app" />
      <PinInput label="SMS Code" hint="Sent to +1 (555) ***-**89" length={4} />
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 7. Masked
// ---------------------------------------------------------------------------

export const Masked: Story = {
  name: 'Masked',
  render: () => (
    <VStack gap="xl">
      <div>
        <SectionLabel>masked input</SectionLabel>
        <PinInput mask label="Enter PIN" length={4} />
      </div>
      <div>
        <SectionLabel>masked with default value</SectionLabel>
        <PinInput mask label="PIN" length={4} defaultValue="1234" />
      </div>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 8. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <VStack gap="xl">
      <PinInput disabled label="Disabled (empty)" />
      <PinInput disabled label="Disabled (with value)" defaultValue="5678" length={4} />
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 9. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <VStack gap="xl">
      {pinInputSizes.map((size) => (
        <div key={size}>
          <SectionLabel>size=&quot;{size}&quot;</SectionLabel>
          <PinInput skeleton size={size} length={6} />
        </div>
      ))}
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 10. Auto Focus
// ---------------------------------------------------------------------------

export const AutoFocus: Story = {
  name: 'Auto Focus',
  render: () => (
    <PinInput autoFocus label="Auto-focused on mount" hint="First cell should be focused" />
  ),
};

// ---------------------------------------------------------------------------
// 11. Custom Length
// ---------------------------------------------------------------------------

export const CustomLength: Story = {
  name: 'Custom Length',
  render: () => (
    <VStack gap="xl">
      <div>
        <SectionLabel>4-digit pin</SectionLabel>
        <PinInput length={4} label="4-Digit PIN" />
      </div>
      <div>
        <SectionLabel>8-character code</SectionLabel>
        <PinInput length={8} type="text" label="License Key Segment" />
      </div>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 12. Composition — verification dialog
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Verification Dialog',
  render: () => {
    const [code, setCode] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const themeColors = useThemeColors();

    const handleComplete = (value: string) => {
      if (value === '123456') {
        setSubmitted(true);
        setError(undefined);
      } else {
        setError('Invalid code. Try 123456.');
      }
    };

    return (
      <Box
        display="flex"
        style={{ justifyContent: 'center', paddingTop: 40, paddingBottom: 40 }}
      >
        <Card
          variant="elevated"
          padding="lg"
          style={{ maxWidth: 400, width: '100%' }}
        >
          <VStack gap="lg" align="center">
            <Box
              display="flex"
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: themeColors.accent.mutedRaised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                icon={submitted ? ShieldCheck : Smartphone}
                size="lg"
                color="primary"
              />
            </Box>

            <VStack gap="xs" align="center">
              <Text size="lg" weight="semibold">
                {submitted ? 'Verified!' : 'Verify your identity'}
              </Text>
              <Text size="sm" color="secondary" style={{ textAlign: 'center' }}>
                {submitted
                  ? 'Your account has been verified successfully.'
                  : 'We sent a 6-digit code to your phone. Enter it below.'}
              </Text>
            </VStack>

            {!submitted && (
              <>
                <PinInput
                  value={code}
                  onChange={(v) => { setCode(v); setError(undefined); }}
                  onComplete={handleComplete}
                  error={error}
                  size="lg"
                  autoFocus
                />

                <HStack gap="sm">
                  <Button size="sm" variant="tertiary">
                    Resend code
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={code.length < 6}
                    onClick={() => handleComplete(code)}
                  >
                    Verify
                  </Button>
                </HStack>
              </>
            )}

            {submitted && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => { setSubmitted(false); setCode(''); setError(undefined); }}
              >
                Reset Demo
              </Button>
            )}
          </VStack>
        </Card>
      </Box>
    );
  },
};
