import React from 'react';
import { CallControls, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const callControlsEntry: ComponentEntry = {
  slug: 'call-controls',
  name: 'CallControls',
  category: 'components',
  subcategory: 'Audio & Video',
  description:
    'A row of circular control buttons for audio/video calls — mute, camera, screen share, speaker, and end call.',
  variantCount: 3,
  keywords: ['call', 'controls', 'audio', 'video', 'mute', 'camera', 'phone', 'end'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <CallControls
        isMuted={false}
        isVideoOff={false}
        isScreenSharing={false}
        isSpeakerOn={true}
        onToggleMute={() => {}}
        onToggleVideo={() => {}}
        onToggleScreenShare={() => {}}
        onToggleSpeaker={() => {}}
        onEndCall={() => {}}
        callType="video"
        style={{ transform: 'scale(0.85)' }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Video Call',
      render: (
        <CallControls
          isMuted={false}
          isVideoOff={false}
          isScreenSharing={false}
          isSpeakerOn={true}
          onToggleMute={() => {}}
          onToggleVideo={() => {}}
          onToggleScreenShare={() => {}}
          onToggleSpeaker={() => {}}
          onEndCall={() => {}}
          callType="video"
        />
      ),
      code: `<CallControls
  isMuted={false}
  isVideoOff={false}
  isScreenSharing={false}
  isSpeakerOn={true}
  onToggleMute={toggleMute}
  onToggleVideo={toggleVideo}
  onToggleScreenShare={toggleScreenShare}
  onToggleSpeaker={toggleSpeaker}
  onEndCall={endCall}
  callType="video"
/>`,
    },
    {
      title: 'Audio Call (Muted)',
      render: (
        <CallControls
          isMuted={true}
          isVideoOff={true}
          isScreenSharing={false}
          isSpeakerOn={true}
          onToggleMute={() => {}}
          onToggleVideo={() => {}}
          onToggleScreenShare={() => {}}
          onToggleSpeaker={() => {}}
          onEndCall={() => {}}
          callType="audio"
        />
      ),
      code: `<CallControls
  isMuted={true}
  isVideoOff={true}
  isScreenSharing={false}
  isSpeakerOn={true}
  callType="audio"
  {...handlers}
/>`,
    },
    {
      title: 'Compact Layout',
      render: (
        <CallControls
          isMuted={false}
          isVideoOff={false}
          isScreenSharing={true}
          isSpeakerOn={true}
          onToggleMute={() => {}}
          onToggleVideo={() => {}}
          onToggleScreenShare={() => {}}
          onToggleSpeaker={() => {}}
          onEndCall={() => {}}
          callType="video"
          layout="compact"
        />
      ),
      code: `<CallControls callType="video" layout="compact" {...handlers} />`,
    },
  ],

  props: [
    { name: 'isMuted', type: 'boolean', required: true, description: 'Whether the local microphone is muted.' },
    { name: 'isVideoOff', type: 'boolean', required: true, description: 'Whether the local camera is off.' },
    { name: 'isScreenSharing', type: 'boolean', required: true, description: 'Whether screen sharing is active.' },
    { name: 'isSpeakerOn', type: 'boolean', required: true, description: 'Whether speaker/audio output is on.' },
    { name: 'onToggleMute', type: '() => void', required: true, description: 'Toggle microphone mute.' },
    { name: 'onToggleVideo', type: '() => void', required: true, description: 'Toggle camera on/off.' },
    { name: 'onToggleScreenShare', type: '() => void', required: true, description: 'Toggle screen sharing.' },
    { name: 'onToggleSpeaker', type: '() => void', required: true, description: 'Toggle speaker output.' },
    { name: 'onEndCall', type: '() => void', required: true, description: 'End the current call.' },
    { name: 'callType', type: "'audio' | 'video'", required: true, description: 'Type of call.' },
    { name: 'layout', type: "'horizontal' | 'compact'", default: "'horizontal'", description: 'Layout variant.' },
  ],
};
