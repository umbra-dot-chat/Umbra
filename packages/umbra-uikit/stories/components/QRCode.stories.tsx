import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QRCode, qrCodeSizes, qrCodeDotStyles, qrCodeErrorLevels, qrCodeEyeFrameStyles, qrCodeEyePupilStyles } from '@wisp-ui/react';

const meta: Meta<typeof QRCode> = {
  title: 'React/Components/Data Display/QRCode',
  component: QRCode,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...qrCodeSizes] },
    dotStyle: { control: 'select', options: [...qrCodeDotStyles] },
    errorLevel: { control: 'select', options: [...qrCodeErrorLevels] },
    eyeFrameStyle: { control: 'select', options: [...qrCodeEyeFrameStyles] },
    eyePupilStyle: { control: 'select', options: [...qrCodeEyePupilStyles] },
    darkColor: { control: 'color' },
    lightColor: { control: 'color' },
    eyeColor: { control: 'color' },
    showQuietZone: { control: 'boolean' },
    logoSize: { control: { type: 'range', min: 0.1, max: 0.4, step: 0.05 } },
  },
};

export default meta;
type Story = StoryObj<typeof QRCode>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {qrCodeSizes.map((size) => (
        <QRCode key={size} value="https://github.com/InfamousVague/Wisp" size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Dot Styles
// ---------------------------------------------------------------------------

export const DotStyles: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {qrCodeDotStyles.map((style) => (
        <div key={style} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <QRCode value="https://github.com/InfamousVague/Wisp" size="md" dotStyle={style} />
          <span style={{ fontSize: 12, opacity: 0.6 }}>{style}</span>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Gradient (Linear)
// ---------------------------------------------------------------------------

export const LinearGradient: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'rounded',
    gradient: {
      type: 'linear',
      rotation: 45,
      stops: [
        { offset: 0, color: '#6366F1' },
        { offset: 1, color: '#EC4899' },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Gradient (Radial)
// ---------------------------------------------------------------------------

export const RadialGradient: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'circle',
    gradient: {
      type: 'radial',
      stops: [
        { offset: 0, color: '#0EA5E9' },
        { offset: 1, color: '#6366F1' },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Custom Eye Styles
// ---------------------------------------------------------------------------

export const CustomEyes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="md"
          dotStyle="circle"
          eyeFrameStyle="circle"
          eyePupilStyle="circle"
          eyeColor="#6366F1"
        />
        <span style={{ fontSize: 12, opacity: 0.6 }}>Circle eyes</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="md"
          dotStyle="rounded"
          eyeFrameStyle="rounded"
          eyePupilStyle="rounded"
          eyeColor="#0EA5E9"
        />
        <span style={{ fontSize: 12, opacity: 0.6 }}>Rounded eyes</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="md"
          dotStyle="classy-rounded"
          eyeFrameStyle="rounded"
          eyePupilStyle="diamond"
          eyeColor="#F59E0B"
        />
        <span style={{ fontSize: 12, opacity: 0.6 }}>Rounded + diamond pupils</span>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Styled with Logo
// ---------------------------------------------------------------------------

export const StyledWithLogo: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'classy-rounded',
    eyeFrameStyle: 'rounded',
    eyePupilStyle: 'circle',
    eyeColor: '#6366F1',
    gradient: {
      type: 'linear',
      rotation: 135,
      stops: [
        { offset: 0, color: '#6366F1' },
        { offset: 0.5, color: '#8B5CF6' },
        { offset: 1, color: '#EC4899' },
      ],
    },
    errorLevel: 'H',
    children: (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: '#6366F1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        W
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// With Logo
// ---------------------------------------------------------------------------

export const WithLogo: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    errorLevel: 'H',
    children: (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: '#6366F1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        W
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Custom Colours
// ---------------------------------------------------------------------------

export const CustomColours: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    darkColor: '#6366F1',
    lightColor: '#F5F3FF',
    dotStyle: 'rounded',
  },
};

// ---------------------------------------------------------------------------
// No Quiet Zone
// ---------------------------------------------------------------------------

export const NoQuietZone: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    showQuietZone: false,
  },
};
