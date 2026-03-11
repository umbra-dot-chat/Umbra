import React from 'react';
import { VoiceChannelPanel, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const connectedParticipants = [
  { id: '1', name: 'Alice Chen', isMuted: false, isSpeaking: true, status: 'connected' as const },
  { id: '2', name: 'Bob Smith', isMuted: true, isSpeaking: false, status: 'connected' as const },
  { id: '3', name: 'Carol White', isMuted: false, isSpeaking: false, status: 'connected' as const },
];

const localUser = { id: 'local', name: 'You', isMuted: false, status: 'connected' as const };

export const voiceChannelPanelEntry: ComponentEntry = {
  slug: 'voice-channel-panel',
  name: 'VoiceChannelPanel',
  category: 'components',
  subcategory: 'Audio & Video',
  description:
    'Bottom bar showing voice channel connection status, participant avatars, and quick mute/deafen/disconnect controls.',
  variantCount: 2,
  keywords: ['voice', 'channel', 'panel', 'bar', 'mute', 'deafen', 'disconnect', 'participants'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <VoiceChannelPanel
        channelName="General"
        communityName="Design Team"
        participants={connectedParticipants.slice(0, 2)}
        localParticipant={localUser}
        isConnected
        isMuted={false}
        isDeafened={false}
        style={{ maxWidth: 280 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Connected',
      render: (
        <VoiceChannelPanel
          channelName="General"
          communityName="Design Team"
          participants={connectedParticipants}
          localParticipant={localUser}
          isConnected
          isMuted={false}
          isDeafened={false}
          onToggleMute={() => {}}
          onToggleDeafen={() => {}}
          onLeave={() => {}}
          style={{ maxWidth: 360 }}
        />
      ),
      code: `<VoiceChannelPanel
  channelName="General"
  communityName="Design Team"
  participants={participants}
  localParticipant={localUser}
  isConnected
  isMuted={false}
  isDeafened={false}
  onToggleMute={toggleMute}
  onToggleDeafen={toggleDeafen}
  onLeave={leaveChannel}
/>`,
    },
    {
      title: 'Disconnected',
      render: (
        <VoiceChannelPanel
          channelName="General"
          communityName="Design Team"
          participants={connectedParticipants.slice(0, 1)}
          isConnected={false}
          onJoin={() => {}}
          style={{ maxWidth: 360 }}
        />
      ),
      code: `<VoiceChannelPanel
  channelName="General"
  communityName="Design Team"
  participants={otherUsers}
  isConnected={false}
  onJoin={joinChannel}
/>`,
    },
  ],

  props: [
    { name: 'channelName', type: 'string', required: true, description: 'Name of the voice channel.' },
    { name: 'communityName', type: 'string', description: 'Community or server name.' },
    { name: 'participants', type: 'CallParticipant[]', required: true, description: 'Participants currently in the channel.' },
    { name: 'localParticipant', type: 'CallParticipant', description: 'The local user (undefined if not connected).' },
    { name: 'isConnected', type: 'boolean', required: true, description: 'Whether the local user is connected.' },
    { name: 'onJoin', type: '() => void', description: 'Join the voice channel.' },
    { name: 'onLeave', type: '() => void', description: 'Leave the voice channel.' },
    { name: 'onToggleMute', type: '() => void', description: 'Toggle local microphone mute.' },
    { name: 'onToggleDeafen', type: '() => void', description: 'Toggle local deafen state.' },
    { name: 'isMuted', type: 'boolean', default: 'false', description: 'Whether the local user is muted.' },
    { name: 'isDeafened', type: 'boolean', default: 'false', description: 'Whether the local user is deafened.' },
  ],
};
