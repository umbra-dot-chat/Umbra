/**
 * ActiveCallPanel — Main in-call UI with video tiles, controls, and quality settings.
 */

export type ActiveCallPanelLayout = 'default' | 'pip';

export interface ActiveCallPanelProps {
  /** Local video/audio stream */
  localStream: any | null;
  /** Remote video/audio stream */
  remoteStream: any | null;
  /** Remote peer display name */
  callerName: string;
  /** Remote peer avatar URI */
  callerAvatar?: string;
  /** Voice or video call */
  callType: 'voice' | 'video';
  /** Whether local mic is muted */
  isMuted: boolean;
  /** Whether local camera is off */
  isCameraOff: boolean;
  /** Current video quality */
  videoQuality: 'auto' | '720p' | '1080p' | '1440p' | '4k';
  /** Current audio quality */
  audioQuality: 'opus' | 'pcm';
  /** When the call connected (unix ms) */
  connectedAt: number | null;
  /** Toggle mute callback */
  onToggleMute: () => void;
  /** Toggle camera callback */
  onToggleCamera: () => void;
  /** End call callback */
  onEndCall: () => void;
  /** Switch camera callback */
  onSwitchCamera: () => void;
  /** Video quality change callback */
  onVideoQualityChange: (quality: 'auto' | '720p' | '1080p' | '1440p' | '4k') => void;
  /** Audio quality change callback */
  onAudioQualityChange: (quality: 'opus' | 'pcm') => void;
  /** Minimize/collapse callback */
  onMinimize?: () => void;
  /** Layout mode */
  layout?: ActiveCallPanelLayout;
  /** Custom style */
  style?: object;
}
