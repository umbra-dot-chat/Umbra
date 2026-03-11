import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LocalePicker, DEFAULT_LOCALE_OPTIONS } from '@wisp-ui/react-native';

const meta: Meta<typeof LocalePicker> = {
  title: 'React Native/Components/Data Entry/LocalePicker',
  component: LocalePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    searchable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    groupByRegion: { control: 'boolean' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof LocalePicker>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
    placeholder: 'Select language',
    searchable: true,
    groupByRegion: true,
  },
  render: (args) => (
    <div style={{ maxWidth: 300 }}>
      <LocalePicker {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. WithCustomOptions
// ---------------------------------------------------------------------------

const customOptions = [
  { code: 'en-US', label: 'English (US)', nativeLabel: 'English' },
  { code: 'fr-FR', label: 'French (France)', nativeLabel: 'Fran\u00e7ais' },
  { code: 'de-DE', label: 'German (Germany)', nativeLabel: 'Deutsch' },
  { code: 'ja-JP', label: 'Japanese (Japan)', nativeLabel: '\u65e5\u672c\u8a9e' },
];

export const WithCustomOptions: Story = {
  name: 'With Custom Options',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 300 }}>
      <div style={sectionLabel}>Custom locale list (4 options, no regions)</div>
      <LocalePicker
        options={customOptions}
        groupByRegion={false}
        placeholder="Choose a language"
      />

      <div style={sectionLabel}>With label</div>
      <LocalePicker
        options={customOptions}
        groupByRegion={false}
        label="Preferred Language"
        placeholder="Choose a language"
      />

      <div style={sectionLabel}>Disabled</div>
      <LocalePicker
        options={customOptions}
        groupByRegion={false}
        placeholder="Choose a language"
        disabled
      />

      <div style={sectionLabel}>Sizes</div>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <LocalePicker
          key={size}
          options={customOptions}
          groupByRegion={false}
          size={size}
          placeholder={`Size: ${size}`}
        />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

function ControlledExample() {
  const [locale, setLocale] = useState('en-US');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
      <div style={sectionLabel}>Controlled value</div>
      <LocalePicker
        value={locale}
        onChange={setLocale}
        label="Language"
      />
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        Selected: <strong>{locale}</strong>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['en-US', 'es-ES', 'ja-JP', 'ar-SA'].map((code) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: locale === code ? '#E0E7FF' : '#fff',
              cursor: 'pointer',
            }}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}

export const Controlled: Story = {
  name: 'Controlled',
  render: () => <ControlledExample />,
};
