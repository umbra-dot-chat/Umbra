import React from 'react';
import { VoiceRecorder, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const voiceRecorderEntry: ComponentEntry = {
  slug: 'voice-recorder',
  name: 'VoiceRecorder',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Voice recording button with timer, pulsing indicator, and send/cancel controls. Supports idle, recording, paused, and preview states.',
  variantCount: 4,
  keywords: ['voice', 'recorder', 'audio', 'record', 'microphone', 'chat', 'message', 'send'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <VoiceRecorder state="recording" duration={15} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'States',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Idle</Text>
            <VoiceRecorder state="idle" />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Recording</Text>
            <VoiceRecorder state="recording" duration={15} />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Paused</Text>
            <VoiceRecorder state="paused" duration={15} />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Preview</Text>
            <VoiceRecorder state="preview" duration={15} />
          </VStack>
        </VStack>
      ),
      code: `import { VoiceRecorder } from '@wisp-ui/react';

<VoiceRecorder state="idle" onRecord={handleRecord} />
<VoiceRecorder state="recording" duration={15} onStop={handleStop} />
<VoiceRecorder state="paused" duration={15} onResume={handleResume} />
<VoiceRecorder state="preview" duration={15} onSend={handleSend} onCancel={handleCancel} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <VoiceRecorder state="recording" duration={8} size="sm" />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <VoiceRecorder state="recording" duration={8} size="md" />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">lg</Text>
            <VoiceRecorder state="recording" duration={8} size="lg" />
          </VStack>
        </VStack>
      ),
      code: `<VoiceRecorder state="recording" size="sm" />
<VoiceRecorder state="recording" size="md" />
<VoiceRecorder state="recording" size="lg" />`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <VoiceRecorder skeleton />
        </VStack>
      ),
      code: `<VoiceRecorder skeleton />`,
    },
  ],

  props: [
    { name: 'state', type: "'idle' | 'recording' | 'paused' | 'preview'", default: "'idle'", description: 'Current recording state.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'duration', type: 'number', default: '0', description: 'Recording duration in seconds.' },
    { name: 'maxDuration', type: 'number', default: '120', description: 'Maximum recording duration.' },
    { name: 'waveformData', type: 'number[]', description: 'Waveform amplitude data for preview.' },
    { name: 'onRecord', type: '() => void', description: 'Called when record button is pressed.' },
    { name: 'onStop', type: '() => void', description: 'Called when stop is pressed.' },
    { name: 'onPause', type: '() => void', description: 'Called when pause is pressed.' },
    { name: 'onResume', type: '() => void', description: 'Called when resume is pressed.' },
    { name: 'onSend', type: '() => void', description: 'Called when send is pressed.' },
    { name: 'onCancel', type: '() => void', description: 'Called when cancel is pressed.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
