import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QRCode } from '@wisp-ui/react-native';
import { qrCodeSizes, qrCodeDotStyles, qrCodeErrorLevels, qrCodeEyeFrameStyles, qrCodeEyePupilStyles } from '@wisp-ui/core/types/QRCode.types';

const meta: Meta<typeof QRCode> = {
  title: 'React Native/Components/Data Display/QRCode',
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
// Circle Style
// ---------------------------------------------------------------------------

export const CircleStyle: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'circle',
  },
};

// ---------------------------------------------------------------------------
// Rounded Style
// ---------------------------------------------------------------------------

export const RoundedStyle: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'rounded',
  },
};

// ---------------------------------------------------------------------------
// Classy Rounded
// ---------------------------------------------------------------------------

export const ClassyRounded: Story = {
  args: {
    value: 'https://github.com/InfamousVague/Wisp',
    size: 'lg',
    dotStyle: 'classy-rounded',
    eyeFrameStyle: 'rounded',
    eyePupilStyle: 'circle',
    eyeColor: '#6366F1',
  },
};

// ---------------------------------------------------------------------------
// Linear Gradient
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
