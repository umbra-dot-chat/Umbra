import React from 'react';
import { GroupCallPanel, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import type { GroupCallParticipant } from '@wisp-ui/react';

const voiceParticipants: GroupCallParticipant[] = [
  { did: '1', displayName: 'Alice Chen', stream: null, isMuted: false, isCameraOff: true, isSpeaking: true },
  { did: '2', displayName: 'Bob Smith', stream: null, isMuted: true, isCameraOff: true, isSpeaking: false },
  { did: '3', displayName: 'Carol White', stream: null, isMuted: false, isCameraOff: true, isSpeaking: false },
  { did: '4', displayName: 'Dave Lee', stream: null, isMuted: false, isCameraOff: true, isSpeaking: false, isDeafened: true },
];

const videoParticipants: GroupCallParticipant[] = [
  { did: '1', displayName: 'Alice Chen', stream: null, isMuted: false, isCameraOff: false, isSpeaking: true },
  { did: '2', displayName: 'Bob Smith', stream: null, isMuted: true, isCameraOff: true, isSpeaking: false },
  { did: '3', displayName: 'Carol White', stream: null, isMuted: false, isCameraOff: false, isSpeaking: false },
];

const noop = () => {};

export const groupCallPanelEntry: ComponentEntry = {
  slug: 'group-call-panel',
  name: 'GroupCallPanel',
  category: 'components',
  subcategory: 'Audio & Video',
  description:
    'Unified voice and video call panel with adaptive layouts — voice cards, video grid, and spotlight modes. ' +
    'Features speaking indicators, mute/deafen badges, call timer, and a full control bar. ' +
    'Inspired by Discord, Google Meet, Telegram, and WhatsApp.',
  variantCount: 4,
  keywords: [
    'call', 'group', 'voice', 'video', 'panel', 'grid', 'spotlight',
    'speaking', 'mute', 'deafen', 'participants', 'avatar', 'controls',
  ],

  cardPreview: (
    <div style={{ width: '100%', height: 280, pointerEvents: 'none' }}>
      <GroupCallPanel
        participants={voiceParticipants.slice(0, 3)}
        localDid="1"
        localStream={null}
        groupName="Design Team"
        callType="audio"
        connectedAt={Date.now() - 125000}
        isMuted={false}
        isCameraOff={true}
        isScreenSharing={false}
        layout="voice"
        onToggleMute={noop}
        onToggleCamera={noop}
        onEndCall={noop}
        onToggleDeafen={noop}
        hideHeader
        style={{ height: '100%' }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Voice Call (4 participants)',
      render: (
        <div style={{ height: 420 }}>
          <GroupCallPanel
            participants={voiceParticipants}
            localDid="1"
            localStream={null}
            groupName="General"
            subtitle="Design Team"
            callType="audio"
            connectedAt={Date.now() - 305000}
            isMuted={false}
            isCameraOff={true}
            isScreenSharing={false}
            layout="voice"
            onToggleMute={noop}
            onToggleCamera={noop}
            onEndCall={noop}
            onToggleDeafen={noop}
            style={{ height: '100%' }}
          />
        </div>
      ),
      code: `<GroupCallPanel
  participants={participants}
  localDid={myDid}
  localStream={null}
  groupName="General"
  subtitle="Design Team"
  callType="audio"
  connectedAt={connectedAt}
  isMuted={isMuted}
  isCameraOff={true}
  isScreenSharing={false}
  layout="voice"
  onToggleMute={toggleMute}
  onToggleCamera={toggleCamera}
  onEndCall={leaveCall}
  onToggleDeafen={toggleDeafen}
/>`,
    },
    {
      title: 'Video Call (Grid)',
      render: (
        <div style={{ height: 420 }}>
          <GroupCallPanel
            participants={videoParticipants}
            localDid="1"
            localStream={null}
            groupName="Team Standup"
            callType="video"
            connectedAt={Date.now() - 60000}
            isMuted={false}
            isCameraOff={false}
            isScreenSharing={false}
            layout="grid"
            onToggleMute={noop}
            onToggleCamera={noop}
            onEndCall={noop}
            onToggleScreenShare={noop}
            style={{ height: '100%' }}
          />
        </div>
      ),
      code: `<GroupCallPanel
  participants={participants}
  localDid={myDid}
  localStream={localStream}
  groupName="Team Standup"
  callType="video"
  connectedAt={connectedAt}
  isMuted={isMuted}
  isCameraOff={isCameraOff}
  isScreenSharing={isScreenSharing}
  layout="grid"
  onToggleMute={toggleMute}
  onToggleCamera={toggleCamera}
  onEndCall={endCall}
  onToggleScreenShare={toggleScreenShare}
/>`,
    },
    {
      title: 'Connecting State',
      render: (
        <div style={{ height: 300 }}>
          <GroupCallPanel
            participants={[]}
            localDid="1"
            localStream={null}
            groupName="General"
            callType="audio"
            connectedAt={null}
            isConnecting
            isMuted={false}
            isCameraOff={true}
            isScreenSharing={false}
            onToggleMute={noop}
            onToggleCamera={noop}
            onEndCall={noop}
            style={{ height: '100%' }}
          />
        </div>
      ),
      code: `<GroupCallPanel
  participants={[]}
  localDid={myDid}
  localStream={null}
  groupName="General"
  callType="audio"
  connectedAt={null}
  isConnecting
  isMuted={false}
  isCameraOff={true}
  isScreenSharing={false}
  onToggleMute={toggleMute}
  onToggleCamera={toggleCamera}
  onEndCall={endCall}
/>`,
    },
    {
      title: 'Auto Layout (adapts to context)',
      render: (
        <div style={{ height: 420 }}>
          <GroupCallPanel
            participants={voiceParticipants}
            localDid="1"
            localStream={null}
            groupName="Lounge"
            callType="video"
            connectedAt={Date.now() - 180000}
            isMuted={true}
            isCameraOff={true}
            isScreenSharing={false}
            isDeafened={false}
            layout="auto"
            onToggleMute={noop}
            onToggleCamera={noop}
            onEndCall={noop}
            onToggleDeafen={noop}
            onToggleScreenShare={noop}
            style={{ height: '100%' }}
          />
        </div>
      ),
      code: `<GroupCallPanel
  participants={participants}
  layout="auto"  // Selects voice/grid/spotlight automatically
  callType="video"
  {...otherProps}
/>`,
    },
  ],

  props: [
    { name: 'participants', type: 'GroupCallParticipant[]', required: true, description: 'All participants including the local user.' },
    { name: 'localDid', type: 'string', description: 'Current user\'s DID for identifying self.' },
    { name: 'localStream', type: 'MediaStream | null', required: true, description: 'Local camera/video stream.' },
    { name: 'groupName', type: 'string', required: true, description: 'Name displayed in the header.' },
    { name: 'callType', type: "'audio' | 'video'", default: "'video'", description: 'Controls which buttons appear.' },
    { name: 'layout', type: "'grid' | 'spotlight' | 'voice' | 'auto'", default: "'auto'", description: 'Layout mode for the call panel.' },
    { name: 'connectedAt', type: 'number | null', required: true, description: 'Unix timestamp (ms) for the call timer.' },
    { name: 'isConnecting', type: 'boolean', default: 'false', description: 'Shows a loading state.' },
    { name: 'isMuted', type: 'boolean', required: true, description: 'Whether local mic is muted.' },
    { name: 'isCameraOff', type: 'boolean', required: true, description: 'Whether local camera is off.' },
    { name: 'isScreenSharing', type: 'boolean', required: true, description: 'Whether screen sharing is active.' },
    { name: 'isDeafened', type: 'boolean', default: 'false', description: 'Whether local user is deafened.' },
    { name: 'subtitle', type: 'string', description: 'Subtitle text shown under the group name.' },
    { name: 'onToggleMute', type: '() => void', required: true, description: 'Toggle microphone mute.' },
    { name: 'onToggleCamera', type: '() => void', required: true, description: 'Toggle camera on/off.' },
    { name: 'onEndCall', type: '() => void', required: true, description: 'End or leave the call.' },
    { name: 'onToggleDeafen', type: '() => void', description: 'Toggle deafen state.' },
    { name: 'onToggleScreenShare', type: '() => void', description: 'Toggle screen sharing.' },
    { name: 'onParticipantClick', type: '(did: string) => void', description: 'Called when a participant tile is clicked.' },
    { name: 'hideHeader', type: 'boolean', default: 'false', description: 'Hide the top bar.' },
    { name: 'hideNames', type: 'boolean', default: 'false', description: 'Hide participant names.' },
    { name: 'showTimer', type: 'boolean', default: 'true', description: 'Show the call timer.' },
    { name: 'maxVisible', type: 'number', default: '25', description: 'Max visible tiles before overflow badge.' },
  ],
};
