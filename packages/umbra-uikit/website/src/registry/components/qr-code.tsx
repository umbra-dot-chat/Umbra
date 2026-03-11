import React from 'react';
import { QRCode } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const qrCodeEntry: ComponentEntry = {
  slug: 'qr-code',
  name: 'QRCode',
  category: 'components',
  subcategory: 'Social',
  description:
    'Stylised QR code generator with custom SVG rendering. Supports 7 dot shapes (square, circle, rounded, diamond, star, classy, classy-rounded), gradient fills, independent finder-pattern eye styling, theme-aware colours, and optional centre logo.',
  variantCount: 7,
  keywords: ['qr', 'code', 'barcode', 'svg', 'data', 'encoding', 'scan', 'link', 'gradient', 'styled'],
  props: [
    { name: 'value', type: 'string', required: true, description: 'The data to encode into the QR code.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size variant controlling dimension.' },
    { name: 'dotStyle', type: "'square' | 'circle' | 'rounded' | 'diamond' | 'star' | 'classy' | 'classy-rounded'", default: "'square'", description: 'Visual style for data modules.' },
    { name: 'errorLevel', type: "'L' | 'M' | 'Q' | 'H'", default: "'M'", description: 'Error correction level.' },
    { name: 'darkColor', type: 'string', description: 'Override colour for dark modules.' },
    { name: 'lightColor', type: 'string', description: 'Override background colour.' },
    { name: 'gradient', type: 'QRCodeGradient', description: 'Linear or radial gradient fill for data modules.' },
    { name: 'eyeFrameStyle', type: "'square' | 'circle' | 'rounded'", default: "'square'", description: 'Outer frame style for finder-pattern eyes.' },
    { name: 'eyePupilStyle', type: "'square' | 'circle' | 'rounded' | 'diamond'", default: "'square'", description: 'Inner pupil style for finder-pattern eyes.' },
    { name: 'eyeColor', type: 'string', description: 'Override colour for finder-pattern eyes.' },
    { name: 'logo', type: 'ReactNode', description: 'Custom content rendered in the centre.' },
    { name: 'logoSize', type: 'number', default: '0.2', description: 'Logo area fraction of QR width.' },
    { name: 'showQuietZone', type: 'boolean', default: 'true', description: 'Include quiet-zone margin.' },
  ],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <QRCode
        value="https://github.com/InfamousVague/Wisp"
        size="sm"
        dotStyle="circle"
        eyeFrameStyle="rounded"
        eyePupilStyle="circle"
        eyeColor="#9CA3AF"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <QRCode value="https://github.com/InfamousVague/Wisp" size="lg" />
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode value="https://github.com/InfamousVague/Wisp" size="lg" />`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode value="https://github.com/InfamousVague/Wisp" size="lg" />`,
    },
    {
      title: 'Circle Dots',
      render: (
        <QRCode value="https://github.com/InfamousVague/Wisp" size="lg" dotStyle="circle" />
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
/>`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
/>`,
    },
    {
      title: 'Gradient Fill',
      render: (
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="lg"
          dotStyle="rounded"
          gradient={{
            type: 'linear',
            rotation: 45,
            stops: [
              { offset: 0, color: '#6366F1' },
              { offset: 1, color: '#EC4899' },
            ],
          }}
        />
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="rounded"
  gradient={{
    type: 'linear',
    rotation: 45,
    stops: [
      { offset: 0, color: '#6366F1' },
      { offset: 1, color: '#EC4899' },
    ],
  }}
/>`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="rounded"
  gradient={{
    type: 'linear',
    rotation: 45,
    stops: [
      { offset: 0, color: '#6366F1' },
      { offset: 1, color: '#EC4899' },
    ],
  }}
/>`,
    },
    {
      title: 'Custom Eyes',
      render: (
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="lg"
          dotStyle="circle"
          eyeFrameStyle="rounded"
          eyePupilStyle="circle"
          eyeColor="#9CA3AF"
        />
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
  eyeFrameStyle="rounded"
  eyePupilStyle="circle"
  eyeColor="#9CA3AF"
/>`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
  eyeFrameStyle="rounded"
  eyePupilStyle="circle"
  eyeColor="#9CA3AF"
/>`,
    },
    {
      title: 'Styled with Logo',
      render: (
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="lg"
          dotStyle="circle"
          eyeFrameStyle="rounded"
          eyePupilStyle="circle"
          eyeColor="#9CA3AF"
          gradient={{
            type: 'linear',
            rotation: 135,
            stops: [
              { offset: 0, color: '#6366F1' },
              { offset: 0.5, color: '#8B5CF6' },
              { offset: 1, color: '#EC4899' },
            ],
          }}
          errorLevel="H"
        >
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
        </QRCode>
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
  eyeFrameStyle="rounded"
  eyePupilStyle="circle"
  eyeColor="#9CA3AF"
  gradient={{
    type: 'linear',
    rotation: 135,
    stops: [
      { offset: 0, color: '#6366F1' },
      { offset: 0.5, color: '#8B5CF6' },
      { offset: 1, color: '#EC4899' },
    ],
  }}
  errorLevel="H"
>
  <Logo />
</QRCode>`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="circle"
  eyeFrameStyle="rounded"
  eyePupilStyle="circle"
  eyeColor="#9CA3AF"
  gradient={{
    type: 'linear',
    rotation: 135,
    stops: [
      { offset: 0, color: '#6366F1' },
      { offset: 0.5, color: '#8B5CF6' },
      { offset: 1, color: '#EC4899' },
    ],
  }}
  errorLevel="H"
>
  <Logo />
</QRCode>`,
    },
    {
      title: 'Rounded with Custom Colours',
      render: (
        <QRCode
          value="https://github.com/InfamousVague/Wisp"
          size="lg"
          dotStyle="rounded"
          darkColor="#6366F1"
          lightColor="#F5F3FF"
        />
      ),
      code: `import { QRCode } from '@wisp-ui/react';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="rounded"
  darkColor="#6366F1"
  lightColor="#F5F3FF"
/>`,
      rnCode: `import { QRCode } from '@wisp-ui/react-native';

<QRCode
  value="https://github.com/InfamousVague/Wisp"
  size="lg"
  dotStyle="rounded"
  darkColor="#6366F1"
  lightColor="#F5F3FF"
/>`,
    },
  ],
};
