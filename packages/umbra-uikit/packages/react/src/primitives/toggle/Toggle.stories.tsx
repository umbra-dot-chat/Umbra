import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './Toggle';
import { Text } from '../text';
import { Icon } from '../icon';
import { Sun, Moon, Check, X, Volume2, VolumeX, Eye, EyeOff, Bell, BellOff, Wifi, WifiOff, Zap, ZapOff, Lock, Unlock, Monitor, Smartphone } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    slim: false,
    skeleton: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    slim: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

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
  render: (args) => <Toggle {...args} />,
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
          <Toggle size={size} defaultChecked />
          <Toggle size={size} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Slim Variant
// ---------------------------------------------------------------------------

export const SlimVariant: Story = {
  name: 'Slim Variant',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <Toggle size={size} slim defaultChecked />
          <Toggle size={size} slim />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Track Icons Only (no handle icon)
// ---------------------------------------------------------------------------

export const TrackIconsOnly: Story = {
  name: 'Track Icons Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="Sun / Moon">
        <Toggle
          size="lg"
          defaultChecked
          checkedContent={<Icon icon={Sun} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Moon} size="xs" color="currentColor" />}
        />
        <Toggle
          size="lg"
          checkedContent={<Icon icon={Sun} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Moon} size="xs" color="currentColor" />}
        />
      </Row>
      <Row label="Check / X">
        <Toggle
          size="lg"
          defaultChecked
          checkedContent={<Icon icon={Check} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={X} size="xs" color="currentColor" />}
        />
        <Toggle
          size="lg"
          checkedContent={<Icon icon={Check} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={X} size="xs" color="currentColor" />}
        />
      </Row>
      <Row label="Volume">
        <Toggle
          size="xl"
          defaultChecked
          checkedContent={<Icon icon={Volume2} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={VolumeX} size="xs" color="currentColor" />}
        />
        <Toggle
          size="xl"
          checkedContent={<Icon icon={Volume2} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={VolumeX} size="xs" color="currentColor" />}
        />
      </Row>
      <Row label="Lock">
        <Toggle
          size="lg"
          defaultChecked
          checkedContent={<Icon icon={Unlock} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Lock} size="xs" color="currentColor" />}
        />
        <Toggle
          size="lg"
          checkedContent={<Icon icon={Unlock} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Lock} size="xs" color="currentColor" />}
        />
      </Row>
      <Row label="Zap">
        <Toggle
          size="lg"
          defaultChecked
          checkedContent={<Icon icon={Zap} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={ZapOff} size="xs" color="currentColor" />}
        />
        <Toggle
          size="lg"
          checkedContent={<Icon icon={Zap} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={ZapOff} size="xs" color="currentColor" />}
        />
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Track Text Only
// ---------------------------------------------------------------------------

export const TrackTextOnly: Story = {
  name: 'Track Text Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="ON / OFF">
        <Toggle
          size="lg"
          defaultChecked
          checkedContent={
            <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
              ON
            </Text>
          }
          uncheckedContent={
            <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
              OFF
            </Text>
          }
        />
        <Toggle
          size="lg"
          checkedContent={
            <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
              ON
            </Text>
          }
          uncheckedContent={
            <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
              OFF
            </Text>
          }
        />
      </Row>
      <Row label="I / O">
        <Toggle
          size="xl"
          defaultChecked
          checkedContent={
            <Text size="xs" color="currentColor" weight="bold" style={{ fontSize: 11 }}>
              I
            </Text>
          }
          uncheckedContent={
            <Text size="xs" color="currentColor" weight="bold" style={{ fontSize: 11 }}>
              O
            </Text>
          }
        />
        <Toggle
          size="xl"
          checkedContent={
            <Text size="xs" color="currentColor" weight="bold" style={{ fontSize: 11 }}>
              I
            </Text>
          }
          uncheckedContent={
            <Text size="xs" color="currentColor" weight="bold" style={{ fontSize: 11 }}>
              O
            </Text>
          }
        />
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Track Text + Icon (stretching test)
// ---------------------------------------------------------------------------

export const TrackTextAndIcon: Story = {
  name: 'Track Text + Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="Icon + Text">
        <Toggle
          size="xl"
          defaultChecked
          checkedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Sun} size="xs" color="currentColor" />
              <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
                ON
              </Text>
            </span>
          }
          uncheckedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Moon} size="xs" color="currentColor" />
              <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
                OFF
              </Text>
            </span>
          }
        />
        <Toggle
          size="xl"
          checkedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Sun} size="xs" color="currentColor" />
              <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
                ON
              </Text>
            </span>
          }
          uncheckedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Moon} size="xs" color="currentColor" />
              <Text size="xs" color="currentColor" weight="semibold" style={{ fontSize: 9 }}>
                OFF
              </Text>
            </span>
          }
        />
      </Row>
      <Row label="Device Switch">
        <Toggle
          size="xl"
          defaultChecked
          checkedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Monitor} size="xs" color="currentColor" />
            </span>
          }
          uncheckedContent={
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon={Smartphone} size="xs" color="currentColor" />
            </span>
          }
        />
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Handle Icon
// ---------------------------------------------------------------------------

export const HandleIcon: Story = {
  name: 'Handle Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="Sun">
        <Toggle size="lg" handleIcon={Sun} defaultChecked />
        <Toggle size="lg" handleIcon={Sun} />
      </Row>
      <Row label="Eye">
        <Toggle size="lg" handleIcon={Eye} defaultChecked />
        <Toggle size="lg" handleIcon={Eye} />
      </Row>
      <Row label="Bell">
        <Toggle size="xl" handleIcon={Bell} defaultChecked />
        <Toggle size="xl" handleIcon={Bell} />
      </Row>
      <Row label="Track + Handle">
        <Toggle
          size="xl"
          handleIcon={Sun}
          defaultChecked
          checkedContent={<Icon icon={Sun} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Moon} size="xs" color="currentColor" />}
        />
        <Toggle
          size="xl"
          handleIcon={Moon}
          checkedContent={<Icon icon={Sun} size="xs" color="currentColor" />}
          uncheckedContent={<Icon icon={Moon} size="xs" color="currentColor" />}
        />
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Custom Colors
// ---------------------------------------------------------------------------

export const CustomColors: Story = {
  name: 'Custom Track Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="Green">
        <Toggle size="lg" checkedColor="#059669" defaultChecked />
        <Toggle size="lg" checkedColor="#059669" />
      </Row>
      <Row label="Blue">
        <Toggle size="lg" checkedColor="#2563EB" defaultChecked />
        <Toggle size="lg" checkedColor="#2563EB" />
      </Row>
      <Row label="Red off">
        <Toggle size="lg" uncheckedColor="#DC2626" defaultChecked />
        <Toggle size="lg" uncheckedColor="#DC2626" />
      </Row>
      <Row label="Both">
        <Toggle size="lg" checkedColor="#059669" uncheckedColor="#DC2626" defaultChecked />
        <Toggle size="lg" checkedColor="#059669" uncheckedColor="#DC2626" />
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Toggle disabled defaultChecked size="lg" />
      <Toggle disabled size="lg" />
      <Toggle disabled slim defaultChecked size="lg" />
      <Toggle disabled slim size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Toggle key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 11. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [isOn, setIsOn] = useState(false);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Toggle
            checked={isOn}
            onChange={setIsOn}
            size="lg"
            checkedContent={<Icon icon={Sun} size="xs" color="currentColor" />}
            uncheckedContent={<Icon icon={Moon} size="xs" color="currentColor" />}
            handleIcon={isOn ? Sun : Moon}
            label="Toggle theme"
          />
          <Text size="sm" color="secondary">
            {isOn ? 'Light mode' : 'Dark mode'}
          </Text>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 12. Composition — Realistic Settings Panel
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const SettingsPanel = () => {
      const [notifications, setNotifications] = useState(true);
      const [darkMode, setDarkMode] = useState(false);
      const [wifi, setWifi] = useState(true);
      const [visibility, setVisibility] = useState(true);

      // Composition always renders a dark card, so use explicit light-on-dark colors
      // to avoid issues in Panda light mode where semantic colors would be near-black
      const settingRow = (
        icon: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>,
        title: string,
        description: string,
        value: boolean,
        onToggle: (v: boolean) => void,
        toggleProps?: Partial<React.ComponentProps<typeof Toggle>>,
      ) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Icon icon={icon} size="sm" style={{ color: '#94A0B8' }} />
          <div style={{ flex: 1 }}>
            <Text size="sm" weight="medium" style={{ color: '#F7F8FA' }}>{title}</Text>
            <Text size="xs" style={{ color: '#667085' }}>{description}</Text>
          </div>
          <Toggle
            checked={value}
            onChange={onToggle}
            size="md"
            label={title}
            checkedColor="#FFFFFF"
            uncheckedColor="#37404F"
            {...toggleProps}
          />
        </div>
      );

      return (
        <div
          style={{
            maxWidth: 400,
            padding: 20,
            borderRadius: 12,
            backgroundColor: '#161A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Text size="md" weight="semibold" style={{ color: '#F7F8FA', marginBottom: 16 }}>
            Settings
          </Text>

          {settingRow(Bell, 'Notifications', 'Push and email alerts', notifications, setNotifications, {
            checkedContent: <Icon icon={Bell} size="xs" color="currentColor" />,
            uncheckedContent: <Icon icon={BellOff} size="xs" color="currentColor" />,
          })}
          {settingRow(Sun, 'Appearance', 'Switch UI appearance', darkMode, setDarkMode, {
            checkedContent: <Icon icon={Moon} size="xs" color="currentColor" />,
            uncheckedContent: <Icon icon={Sun} size="xs" color="currentColor" />,
            handleIcon: darkMode ? Moon : Sun,
          })}
          {settingRow(Wifi, 'Wi-Fi', 'Connect to networks', wifi, setWifi, {
            checkedContent: <Icon icon={Wifi} size="xs" color="currentColor" />,
            uncheckedContent: <Icon icon={WifiOff} size="xs" color="currentColor" />,
          })}
          {settingRow(Eye, 'Visibility', 'Show profile publicly', visibility, setVisibility, {
            checkedContent: <Icon icon={Eye} size="xs" color="currentColor" />,
            uncheckedContent: <Icon icon={EyeOff} size="xs" color="currentColor" />,
          })}
        </div>
      );
    };

    return <SettingsPanel />;
  },
};
