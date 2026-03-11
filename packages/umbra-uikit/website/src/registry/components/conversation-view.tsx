import React, { useState } from 'react';
import { ConversationView, E2EEKeyExchangeUI, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Fake message row
// ---------------------------------------------------------------------------

function FakeMessage({ sender, text, time, own }: { sender: string; text: string; time: string; own?: boolean }) {
  const colors = useThemeColors();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '6px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: own ? colors.accent.primary : colors.text.primary }}>{sender}</span>
        <span style={{ fontSize: 10, color: colors.text.muted }}>{time}</span>
      </div>
      <span style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function FakeInput() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        margin: '8px 12px',
        padding: '10px 14px',
        borderRadius: 20,
        border: `1px solid ${colors.border.subtle}`,
        backgroundColor: colors.background.raised,
        fontSize: 13,
        color: colors.text.muted,
      }}
    >
      Message #encrypted-channel
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

function EncryptedChannelDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 560, border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <ConversationView encrypted e2eeStatus="active" e2eeKeyVersion={3}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
          <FakeMessage sender="Alice" text="The new E2EE key rotation is working flawlessly." time="2:41 PM" />
          <FakeMessage sender="You" text="Nice! Key version bumped to v3 after we removed that member." time="2:42 PM" own />
          <FakeMessage sender="Alice" text="Perfect. Messages are fully forward-secret now." time="2:43 PM" />
        </div>
        <FakeInput />
      </ConversationView>
    </div>
  );
}

function UnencryptedChannelDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 560, border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <ConversationView>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
          <FakeMessage sender="Bob" text="Hey, anyone up for a game tonight?" time="5:10 PM" />
          <FakeMessage sender="You" text="Sure, count me in!" time="5:12 PM" own />
        </div>
        <FakeInput />
      </ConversationView>
    </div>
  );
}

function InteractiveDemo() {
  const [status, setStatus] = useState<'active' | 'rotating' | 'error'>('active');
  const [version, setVersion] = useState(3);

  const handleRotate = () => {
    setStatus('rotating');
    setTimeout(() => {
      setStatus('active');
      setVersion((v) => v + 1);
    }, 2000);
  };

  const handleError = () => setStatus('error');
  const handleRetry = () => {
    setStatus('rotating');
    setTimeout(() => setStatus('active'), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleRotate} disabled={status === 'rotating'} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #555', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
          Simulate Rotation
        </button>
        <button onClick={handleError} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #555', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
          Simulate Error
        </button>
      </div>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <ConversationView
          encrypted
          e2eeStatus={status}
          e2eeKeyVersion={version}
          e2eeErrorMessage={status === 'error' ? 'Network timeout — peer unreachable' : undefined}
          onE2eeRetry={handleRetry}
          onE2eeRotateKey={handleRotate}
          e2eeRotating={status === 'rotating'}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
            <FakeMessage sender="Alice" text="Testing the encryption flow..." time="3:00 PM" />
            <FakeMessage sender="You" text="All looks good on my end." time="3:01 PM" own />
          </div>
          <FakeInput />
        </ConversationView>
      </div>
    </div>
  );
}

function PendingDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 560, border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <ConversationView encrypted e2eeStatus="pending" e2eeKeyVersion={1}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
          <FakeMessage sender="System" text="Establishing encrypted session with this channel..." time="1:00 PM" />
        </div>
        <FakeInput />
      </ConversationView>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card preview
// ---------------------------------------------------------------------------

function ConversationViewPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 200,
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          backgroundColor: colors.background.canvas,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Mini E2EE banner */}
        <div
          style={{
            padding: '4px 6px',
            backgroundColor: colors.status.successSurface,
            borderBottom: `1px solid ${colors.status.successBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={colors.status.success} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span style={{ fontSize: 6, fontWeight: 600, color: colors.text.primary }}>Encrypted</span>
        </div>
        {/* Mini messages */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: '3px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ width: i === 1 ? '40%' : '50%', height: 3, borderRadius: 2, backgroundColor: colors.text.muted, opacity: 0.3 }} />
            <div style={{ width: i === 2 ? '60%' : '70%', height: 3, borderRadius: 2, backgroundColor: colors.text.muted, opacity: 0.15 }} />
          </div>
        ))}
        {/* Mini input */}
        <div style={{ margin: '3px 5px 5px', height: 12, borderRadius: 6, border: `1px solid ${colors.border.subtle}`, backgroundColor: colors.background.raised }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const conversationViewEntry: ComponentEntry = {
  slug: 'conversation-view',
  name: 'ConversationView',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Wrapper for the conversation message area that displays an E2EE status banner when encryption is enabled. Shared by both DM chats and community channels.',
  variantCount: 2,
  keywords: [
    'conversation', 'view', 'wrapper', 'e2ee', 'encrypted', 'chat',
    'community', 'channel', 'banner', 'messages', 'container',
  ],

  cardPreview: <ConversationViewPreview />,

  examples: [
    {
      title: 'Encrypted Channel',
      render: <EncryptedChannelDemo />,
      code: `import { ConversationView } from '@wisp-ui/react';

<ConversationView encrypted e2eeStatus="active" e2eeKeyVersion={3}>
  <MessageList entries={entries} />
  <MessageInput onSubmit={handleSend} />
</ConversationView>`,
      rnCode: `import { ConversationView } from '@coexist/wisp-react-native';

<ConversationView encrypted e2eeStatus="active" e2eeKeyVersion={3}>
  <MessageList entries={entries} />
  <MessageInput onSubmit={handleSend} />
</ConversationView>`,
    },
    {
      title: 'Unencrypted Channel',
      render: <UnencryptedChannelDemo />,
      code: `<ConversationView>
  <MessageList entries={entries} />
  <MessageInput onSubmit={handleSend} />
</ConversationView>`,
    },
    {
      title: 'Interactive — Status Changes',
      render: <InteractiveDemo />,
      code: `const [status, setStatus] = useState('active');
const [version, setVersion] = useState(3);

<ConversationView
  encrypted
  e2eeStatus={status}
  e2eeKeyVersion={version}
  e2eeErrorMessage={status === 'error' ? 'Network timeout' : undefined}
  onE2eeRetry={handleRetry}
  onE2eeRotateKey={handleRotate}
  e2eeRotating={status === 'rotating'}
>
  {/* messages + input */}
</ConversationView>`,
    },
    {
      title: 'Pending Key Exchange',
      render: <PendingDemo />,
      code: `<ConversationView encrypted e2eeStatus="pending" e2eeKeyVersion={1}>
  {/* messages + input */}
</ConversationView>`,
    },
  ],

  props: [
    { name: 'encrypted', type: 'boolean', default: 'false', description: 'Whether the conversation/channel uses end-to-end encryption. Shows the E2EE banner when true.' },
    { name: 'e2eeStatus', type: "'pending' | 'active' | 'rotating' | 'error'", default: "'active'", description: 'Current E2EE key exchange status. Only shown when `encrypted` is true.' },
    { name: 'e2eeKeyVersion', type: 'number', description: 'Current key version number displayed as a badge.' },
    { name: 'e2eeErrorMessage', type: 'string', description: 'Error message for the E2EE banner when status is "error".' },
    { name: 'onE2eeRetry', type: '() => void', description: 'Called when retry is pressed in the E2EE error banner.' },
    { name: 'onE2eeRotateKey', type: '() => void', description: 'Called when key rotation is requested from the E2EE active banner.' },
    { name: 'e2eeRotating', type: 'boolean', default: 'false', description: 'Whether E2EE key rotation is currently in progress.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Conversation body content (messages, input, etc.).' },
  ],
};
