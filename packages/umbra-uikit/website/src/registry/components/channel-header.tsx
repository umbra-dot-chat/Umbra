import React from 'react';
import { ChannelHeader, useThemeColors } from '@wisp-ui/react';
import type { ChannelHeaderAction, ChannelHeaderType } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Inline icons for demos
// ---------------------------------------------------------------------------

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const defaultActions: ChannelHeaderAction[] = [
  { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: () => {} },
  { key: 'pins', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
  { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
];

const voiceActions: ChannelHeaderAction[] = [
  { key: 'call', label: 'Start Call', icon: <PhoneIcon />, onClick: () => {} },
  { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
];

const allTypes: ChannelHeaderType[] = [
  'text', 'voice', 'announcement', 'files', 'bulletin', 'welcome', 'thread', 'forum',
];

// ---------------------------------------------------------------------------
// Demo components
// ---------------------------------------------------------------------------

function TextChannelDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ChannelHeader
        name="general"
        type="text"
        topic="General discussion for the team"
        actions={[
          ...defaultActions.slice(0, 2),
          { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {}, active: true },
        ]}
      />
    </div>
  );
}

function VoiceChannelDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ChannelHeader
        name="Lounge"
        type="voice"
        topic="Hang out and chat"
        actions={voiceActions}
      />
    </div>
  );
}

function EncryptedDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ChannelHeader
        name="secret-plans"
        type="text"
        topic="End-to-end encrypted channel"
        encrypted
        actions={defaultActions}
      />
    </div>
  );
}

function AllTypesDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 720 }}>
      {allTypes.map((channelType) => (
        <ChannelHeader
          key={channelType}
          name={channelType}
          type={channelType}
          topic={`A ${channelType} channel`}
        />
      ))}
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ChannelHeader name="" skeleton />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card preview
// ---------------------------------------------------------------------------

function ChannelHeaderPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 200,
          height: 36,
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          backgroundColor: colors.background.canvas,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px',
        }}
      >
        {/* Hash icon placeholder */}
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.text.muted }}>#</span>
        {/* Name */}
        <span style={{ fontSize: 10, fontWeight: 600, color: colors.text.primary }}>general</span>
        {/* Divider */}
        <div style={{ width: 1, height: 16, backgroundColor: colors.border.subtle, marginLeft: 2 }} />
        {/* Topic */}
        <span
          style={{
            fontSize: 9,
            color: colors.text.secondary,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Discussion
        </span>
        {/* Action dots */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: colors.text.muted,
                opacity: i === 2 ? 0.8 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const channelHeaderEntry: ComponentEntry = {
  slug: 'channel-header',
  name: 'ChannelHeader',
  category: 'components',
  subcategory: 'Community',
  description:
    'Header bar for an active community channel displaying the channel type icon, name, topic, indicators (encrypted, slow mode), and action buttons.',
  variantCount: 5,
  keywords: [
    'channel', 'header', 'topic', 'banner', 'chat',
    'community', 'text', 'voice', 'actions', 'encrypted',
  ],

  cardPreview: <ChannelHeaderPreview />,

  examples: [
    {
      title: 'Text Channel',
      render: <TextChannelDemo />,
      code: `import { ChannelHeader } from '@wisp-ui/react';

<ChannelHeader
  name="general"
  type="text"
  topic="General discussion for the team"
  actions={[
    { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: () => {} },
    { key: 'pins', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
    { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {}, active: true },
  ]}
/>`,
    },
    {
      title: 'Voice Channel',
      render: <VoiceChannelDemo />,
      code: `<ChannelHeader
  name="Lounge"
  type="voice"
  topic="Hang out and chat"
  actions={[
    { key: 'call', label: 'Start Call', icon: <PhoneIcon />, onClick: () => {} },
    { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
  ]}
/>`,
    },
    {
      title: 'Encrypted',
      render: <EncryptedDemo />,
      code: `<ChannelHeader
  name="secret-plans"
  type="text"
  topic="End-to-end encrypted channel"
  encrypted
  actions={actions}
/>`,
    },
    {
      title: 'All Channel Types',
      render: <AllTypesDemo />,
      code: `const types = ['text', 'voice', 'announcement', 'files', 'bulletin', 'welcome', 'thread', 'forum'];

{types.map((type) => (
  <ChannelHeader key={type} name={type} type={type} topic={\`A \${type} channel\`} />
))}`,
    },
    {
      title: 'Skeleton',
      render: <SkeletonDemo />,
      code: `<ChannelHeader name="" skeleton />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: 'Channel display name.' },
    { name: 'type', type: "ChannelHeaderType", default: "'text'", description: 'Channel type — determines the leading icon. One of: text, voice, announcement, files, bulletin, welcome, thread, forum.' },
    { name: 'topic', type: 'string', description: 'Channel topic or description text shown after the divider.' },
    { name: 'actions', type: 'ChannelHeaderAction[]', description: 'Action buttons displayed on the right side of the header (search, pins, members, etc.).' },
    { name: 'encrypted', type: 'boolean', default: 'false', description: 'Show lock icon indicating E2EE is enabled.' },
    { name: 'slowMode', type: 'boolean', default: 'false', description: 'Show clock icon indicating slow mode is active.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Custom icon override — replaces the type-based icon.' },
    { name: 'onTopicClick', type: '() => void', description: 'Called when the topic area is clicked (e.g. to edit the topic).' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton placeholders.' },
  ],
};
