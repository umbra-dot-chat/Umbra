/**
 * CallingContent — Guide chapter content for Voice & Video Calling.
 *
 * Documents all calling features including voice/video calls,
 * quality presets, screen sharing, virtual backgrounds, noise
 * suppression, PiP mode, and call signaling architecture.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import { FlowDiagram } from '@/components/guide/FlowDiagram';

export default function CallingContent() {
  return (
    <View style={{ gap: 12 }}>
      {/* ── Feature Cards ──────────────────────────────────────────── */}

      <FeatureCard
        title="Voice Calls"
        description="Make 1:1 voice calls with end-to-end encrypted audio. Calls use WebRTC for direct peer-to-peer connections, with signaling routed through the relay server."
        status="working"
        howTo={[
          'Open a DM conversation',
          'Click the phone icon in the chat header',
          'Wait for the other person to accept',
        ]}
      />

      <FeatureCard
        title="Video Calls"
        description="Upgrade to video with camera support. Toggle camera on/off mid-call, switch between cameras, and choose your video quality preset."
        status="working"
        howTo={[
          'Click the video icon in the chat header',
          'Or upgrade a voice call by enabling camera mid-call',
        ]}
      />

      <FeatureCard
        title="Quality Presets"
        description="Choose from Auto, 720p HD, 1080p Full HD, 1440p QHD, or 4K Ultra HD. Quality can be changed mid-call without renegotiation."
        status="working"
        howTo={[
          'Open call settings during a call',
          'Select your preferred quality preset',
          'Changes apply immediately',
        ]}
      />

      <FeatureCard
        title="Lossless Audio"
        description="Switch to PCM lossless audio for studio-quality sound. Uses ~1.4 Mbps bandwidth — ensure a stable connection."
        status="working"
        howTo={[
          'Go to Settings > Audio & Video',
          'Change Audio Quality to PCM Lossless',
        ]}
        limitations={[
          'Requires ~1.4 Mbps bandwidth',
          'May cause issues on unstable connections',
        ]}
      />

      <FeatureCard
        title="Group Calls"
        description="Start group voice or video calls with up to 50 participants. Uses mesh topology for 2-6 participants and SFU for 7-50."
        status="working"
        howTo={[
          'Open a group conversation',
          'Click the phone or video icon',
          'Members can join the call room',
        ]}
      />

      <FeatureCard
        title="Screen Sharing"
        description="Share your screen during any call. The shared screen takes the main view while participant videos move to a sidebar strip."
        status="working"
        howTo={[
          'During an active call, click the screen share button',
          'Select a window or entire screen',
          'Click Stop to end sharing',
        ]}
      />

      <FeatureCard
        title="Virtual Backgrounds"
        description="Apply blur or virtual background effects to your video. Choose from 6 preset backgrounds or upload your own."
        status="working"
        howTo={[
          'During a video call, open effects panel',
          'Choose blur, a preset, or upload custom image',
        ]}
        limitations={[
          'Requires TensorFlow.js on web',
          'Performance depends on device capability',
        ]}
      />

      <FeatureCard
        title="Video Filters"
        description="Apply visual filters like grayscale, sepia, warm, cool, or high contrast to your video feed."
        status="working"
        howTo={[
          'Open the effects panel during a video call',
          'Select a filter from the grid',
        ]}
      />

      <FeatureCard
        title="Emoji Reactions"
        description="Send floating emoji reactions visible to all call participants. Quick-react with common emojis or choose from the full picker."
        status="working"
      />

      <FeatureCard
        title="Noise Suppression"
        description="AI-powered noise suppression, echo cancellation, and auto gain control. Toggle each independently in Settings."
        status="working"
        howTo={[
          'Go to Settings > Audio & Video',
          'Toggle noise suppression, echo cancellation, or auto gain',
        ]}
      />

      <FeatureCard
        title="Device Selection"
        description="Hot-swap audio and video devices mid-call. New devices are auto-detected with toast notifications."
        status="working"
        howTo={[
          'Connect a new microphone, camera, or speaker',
          'Select it from Settings > Audio & Video',
        ]}
      />

      <FeatureCard
        title="PiP Mode"
        description="When you navigate away from the active call conversation, a draggable Picture-in-Picture widget appears so you stay connected."
        status="working"
      />

      <FeatureCard
        title="Call History"
        description="Full log of all calls with one-tap callback. Call events appear as system messages in the conversation."
        status="working"
        howTo={[
          'View call history from the sidebar',
          'Tap any entry to call back',
        ]}
      />

      {/* ── Technical Specification ────────────────────────────────── */}

      <TechSpec
        title="Call Technology"
        accentColor="#10B981"
        entries={[
          { label: 'Audio Codec', value: 'Opus (adaptive) / PCM L16 (lossless)' },
          { label: 'Video Codec', value: 'VP8 / VP9 / H.264' },
          { label: 'Max Resolution', value: '4K Ultra HD (3840x2160)' },
          { label: 'ICE', value: 'STUN + self-hosted TURN' },
          { label: 'Group Topology', value: 'Mesh (≤6) / SFU (7-50)' },
          { label: 'Encryption', value: 'DTLS-SRTP' },
          { label: 'Max Participants', value: '50' },
        ]}
      />

      {/* ── Call Signaling Flow ─────────────────────────────────────── */}

      <FlowDiagram
        title="Call Signaling Flow"
        steps={[
          { label: 'Caller', color: '#3B82F6' },
          { label: 'Offer via Relay', color: '#6366F1' },
          { label: 'Callee', color: '#8B5CF6' },
          { label: 'Answer via Relay', color: '#6366F1' },
          { label: 'ICE Exchange', color: '#EC4899' },
          { label: 'P2P Media', color: '#10B981' },
        ]}
      />
    </View>
  );
}
