/**
 * Call type definitions for voice and video calling.
 */

// ─── Call Status State Machine ───────────────────────────────────────────────

export type CallStatus =
  | 'idle'
  | 'outgoing'     // We initiated, waiting for answer
  | 'incoming'     // Someone is calling us
  | 'connecting'   // Offer/answer exchanged, ICE negotiation
  | 'connected'    // Media flowing
  | 'reconnecting' // Temporary disconnect, attempting recovery
  | 'ended';       // Call finished

export type CallEndReason =
  | 'completed'    // Normal hangup
  | 'declined'     // Callee rejected
  | 'timeout'      // Ring timeout (45s)
  | 'busy'         // Callee is on another call
  | 'failed'       // ICE/network failure
  | 'cancelled';   // Caller cancelled before answer

// ─── Call Types ──────────────────────────────────────────────────────────────

export type CallType = 'voice' | 'video';

export type CallDirection = 'outgoing' | 'incoming';

// ─── Quality Settings ────────────────────────────────────────────────────────

export type VideoQuality = 'auto' | '720p' | '1080p' | '1440p' | '4k';

export type AudioQuality = 'opus-voice' | 'opus-music' | 'opus-low' | 'pcm';

export type AudioBitrate = 16 | 24 | 32 | 48 | 64 | 96 | 128;

export type OpusApplication = 'voip' | 'audio' | 'lowdelay';

export interface OpusConfig {
  /** Opus application mode: voip (voice), audio (music), lowdelay (low latency) */
  application: OpusApplication;
  /** Target bitrate in kbps */
  bitrate: AudioBitrate;
  /** Encoding complexity 0-10 (higher = better quality, more CPU) */
  complexity: number;
  /** Enable Forward Error Correction for packet loss resilience */
  fec: boolean;
  /** Discontinuous Transmission — save bandwidth when silent */
  dtx: boolean;
  /** Expected packet loss percentage (0-100), used to tune FEC */
  packetLoss: number;
}

export const DEFAULT_OPUS_CONFIG: OpusConfig = {
  application: 'voip',
  bitrate: 48,
  complexity: 10,
  fec: true,
  dtx: false,
  packetLoss: 10,
};

export const AUDIO_QUALITY_PRESETS: Record<Exclude<AudioQuality, 'pcm'>, { label: string; description: string; config: OpusConfig }> = {
  'opus-voice': {
    label: 'Voice (VoIP)',
    description: 'Optimized for speech, lower bandwidth',
    config: { application: 'voip', bitrate: 48, complexity: 10, fec: true, dtx: false, packetLoss: 10 },
  },
  'opus-music': {
    label: 'Music (Full Band)',
    description: 'Full-band audio, higher quality',
    config: { application: 'audio', bitrate: 96, complexity: 10, fec: true, dtx: false, packetLoss: 5 },
  },
  'opus-low': {
    label: 'Low Latency',
    description: 'Minimum delay, for real-time interaction',
    config: { application: 'lowdelay', bitrate: 64, complexity: 5, fec: false, dtx: false, packetLoss: 0 },
  },
};

export interface VideoQualityPreset {
  label: string;
  width: number;
  height: number;
  frameRate: number;
  maxBitrate: number; // kbps
}

export const VIDEO_QUALITY_PRESETS: Record<Exclude<VideoQuality, 'auto'>, VideoQualityPreset> = {
  '720p': {
    label: '720p HD',
    width: 1280,
    height: 720,
    frameRate: 30,
    maxBitrate: 2500,
  },
  '1080p': {
    label: '1080p Full HD',
    width: 1920,
    height: 1080,
    frameRate: 30,
    maxBitrate: 5000,
  },
  '1440p': {
    label: '1440p QHD',
    width: 2560,
    height: 1440,
    frameRate: 30,
    maxBitrate: 8000,
  },
  '4k': {
    label: '4K Ultra HD',
    width: 3840,
    height: 2160,
    frameRate: 30,
    maxBitrate: 16000,
  },
};

// ─── Call Participant ────────────────────────────────────────────────────────

export interface CallParticipant {
  did: string;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  stream?: MediaStream;
}

// ─── Active Call ─────────────────────────────────────────────────────────────

export interface ActiveCall {
  /** Unique call ID */
  callId: string;
  /** The conversation this call belongs to */
  conversationId: string;
  /** Voice or video */
  callType: CallType;
  /** Inbound or outbound */
  direction: CallDirection;
  /** Current call state */
  status: CallStatus;
  /** DID of the remote peer (1:1 calls) */
  remoteDid: string;
  /** Display name of remote peer */
  remoteDisplayName: string;
  /** When the call started ringing (unix ms) */
  startedAt: number;
  /** When media connected (unix ms), null if not yet connected */
  connectedAt: number | null;
  /** Why the call ended */
  endReason?: CallEndReason;
  /** Local audio/video stream */
  localStream: MediaStream | null;
  /** Remote audio/video stream */
  remoteStream: MediaStream | null;
  /** Whether local mic is muted */
  isMuted: boolean;
  /** Whether local camera is off */
  isCameraOff: boolean;
}

// ─── Call Signaling Envelopes ────────────────────────────────────────────────
// These flow through the relay as envelope payloads (same as chat_message, etc.)

export interface CallOfferPayload {
  callId: string;
  callType: CallType;
  senderDid: string;
  senderDisplayName: string;
  conversationId: string;
  sdp: string;
  sdpType: 'offer';
}

export interface CallAnswerPayload {
  callId: string;
  senderDid: string;
  sdp: string;
  sdpType: 'answer';
}

export interface CallIceCandidatePayload {
  callId: string;
  senderDid: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface CallEndPayload {
  callId: string;
  senderDid: string;
  reason: CallEndReason;
}

export interface CallStatePayload {
  callId: string;
  senderDid: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

// ─── Encrypted Call Signaling ────────────────────────────────────────────────

/** Wrapper for encrypted call signaling payloads (SDP, ICE, state, end). */
export interface EncryptedCallPayload {
  /** Base64-encoded AES-256-GCM ciphertext */
  encrypted: string;
  /** Hex-encoded 12-byte nonce */
  nonce: string;
  /** Sender DID — needed for relay routing + key lookup before decryption */
  senderDid: string;
  /** Call ID — needed for call correlation before decryption */
  callId: string;
  /** Unix timestamp (ms) used in AAD binding */
  timestamp: number;
}

// ─── Group Call Signaling ────────────────────────────────────────────────────

export interface CallRoomCreatedPayload {
  roomId: string;
  groupId: string;
}

export interface CallParticipantJoinedPayload {
  roomId: string;
  did: string;
}

export interface CallParticipantLeftPayload {
  roomId: string;
  did: string;
}

export interface CallSignalForwardPayload {
  roomId: string;
  fromDid: string;
  payload: string;
}

// ─── Call Event (dispatched through service) ─────────────────────────────────

export type CallEvent =
  | { type: 'callOffer'; payload: CallOfferPayload }
  | { type: 'callAnswer'; payload: CallAnswerPayload }
  | { type: 'callIceCandidate'; payload: CallIceCandidatePayload }
  | { type: 'callEnd'; payload: CallEndPayload }
  | { type: 'callState'; payload: CallStatePayload }
  | { type: 'callRoomCreated'; payload: CallRoomCreatedPayload }
  | { type: 'callParticipantJoined'; payload: CallParticipantJoinedPayload }
  | { type: 'callParticipantLeft'; payload: CallParticipantLeftPayload }
  | { type: 'callSignalForward'; payload: CallSignalForwardPayload };

// ─── ICE Server Configuration ────────────────────────────────────────────────

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:turn.deepspaceshipping.co:3478?transport=udp',
      'turn:turn.deepspaceshipping.co:3478?transport=tcp',
    ],
    // Credentials set dynamically via generateTurnCredentials()
  },
];

// ─── Call Stats ──────────────────────────────────────────────────────────────

export interface CallStats {
  /** Current video resolution */
  resolution: { width: number; height: number } | null;
  /** Current framerate */
  frameRate: number | null;
  /** Current bitrate in kbps */
  bitrate: number | null;
  /** Packet loss percentage */
  packetLoss: number | null;
  /** Current codec in use */
  codec: string | null;
  /** Round-trip time in ms */
  roundTripTime: number | null;
  /** Jitter in ms */
  jitter: number | null;
  /** Total packets lost (inbound) */
  packetsLost: number | null;
  /** Fraction of packets lost (0-1, from remote report) */
  fractionLost: number | null;
  /** ICE candidate type in use (host/srflx/relay) */
  candidateType: string | null;
  /** Local ICE candidate type */
  localCandidateType: string | null;
  /** Remote ICE candidate type */
  remoteCandidateType: string | null;
  /** Available outgoing bitrate in kbps (from ICE candidate pair) */
  availableOutgoingBitrate: number | null;
  /** Audio level (0-1, from inbound-rtp) */
  audioLevel: number | null;
  /** Total frames decoded (video) */
  framesDecoded: number | null;
  /** Total frames dropped (video) */
  framesDropped: number | null;
  /** Audio bitrate in kbps (separate from video) */
  audioBitrate: number | null;
}

// ─── Connectivity Test Results ──────────────────────────────────────────────

export interface TurnTestResult {
  success: boolean;
  rtt: number;
  candidateType: string;
  error?: string;
}

export interface StunTestResult {
  success: boolean;
  publicIp: string;
  rtt: number;
  error?: string;
}
