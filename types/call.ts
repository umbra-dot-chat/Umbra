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

export type AudioQuality = 'opus' | 'pcm';

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

// ─── Call Event (dispatched through service) ─────────────────────────────────

export type CallEvent =
  | { type: 'callOffer'; payload: CallOfferPayload }
  | { type: 'callAnswer'; payload: CallAnswerPayload }
  | { type: 'callIceCandidate'; payload: CallIceCandidatePayload }
  | { type: 'callEnd'; payload: CallEndPayload }
  | { type: 'callState'; payload: CallStatePayload };

// ─── ICE Server Configuration ────────────────────────────────────────────────

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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
}
