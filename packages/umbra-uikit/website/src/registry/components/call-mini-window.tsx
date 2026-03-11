import React from 'react';
import { CallMiniWindow, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const participant = { id: '1', name: 'Alice Chen', isMuted: false, isSpeaking: true, status: 'connected' as const };
const localParticipant = { id: 'local', name: 'You', isMuted: false, status: 'connected' as const };

export const callMiniWindowEntry: ComponentEntry = {
  slug: 'call-mini-window',
  name: 'CallMiniWindow',
  category: 'components',
  subcategory: 'Audio & Video',
  description:
    'A small floating picture-in-picture window for active calls, showing participant info, duration, and hover controls.',
  variantCount: 2,
  keywords: ['call', 'mini', 'window', 'pip', 'picture-in-picture', 'float', 'drag'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <CallMiniWindow
        participant={participant}
        localParticipant={localParticipant}
        callType="video"
        duration={67}
        onExpand={() => {}}
        onEndCall={() => {}}
        draggable={false}
        style={{ position: 'relative', bottom: 'auto', right: 'auto', zIndex: 'auto' }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Video Call',
      render: (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <CallMiniWindow
            participant={participant}
            localParticipant={localParticipant}
            callType="video"
            duration={67}
            onExpand={() => {}}
            onEndCall={() => {}}
            draggable={false}
            style={{ position: 'relative', bottom: 'auto', right: 'auto', zIndex: 'auto' }}
          />
        </div>
      ),
      code: `<CallMiniWindow
  participant={currentSpeaker}
  localParticipant={localUser}
  callType="video"
  duration={67}
  onExpand={expandToFullScreen}
  onEndCall={endCall}
/>`,
    },
    {
      title: 'Audio Call',
      render: (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <CallMiniWindow
            participant={participant}
            localParticipant={localParticipant}
            callType="audio"
            duration={120}
            onExpand={() => {}}
            onEndCall={() => {}}
            draggable={false}
            style={{ position: 'relative', bottom: 'auto', right: 'auto', zIndex: 'auto' }}
          />
        </div>
      ),
      code: `<CallMiniWindow
  participant={currentSpeaker}
  localParticipant={localUser}
  callType="audio"
  duration={120}
  onExpand={expandToFullScreen}
  onEndCall={endCall}
/>`,
    },
  ],

  props: [
    { name: 'participant', type: 'CallParticipant', required: true, description: 'The currently focused participant.' },
    { name: 'localParticipant', type: 'CallParticipant', required: true, description: 'The local user info.' },
    { name: 'callType', type: "'audio' | 'video'", required: true, description: 'Type of call.' },
    { name: 'duration', type: 'number', description: 'Call duration in seconds.' },
    { name: 'onExpand', type: '() => void', required: true, description: 'Expand to full call screen.' },
    { name: 'onEndCall', type: '() => void', required: true, description: 'End the call.' },
    { name: 'snapPosition', type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'", default: "'bottom-right'", description: 'Corner snap position.' },
    { name: 'draggable', type: 'boolean', default: 'true', description: 'Whether the window can be dragged.' },
  ],
};
