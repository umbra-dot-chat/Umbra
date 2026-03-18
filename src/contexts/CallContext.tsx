/**
 * CallContext — Manages call state machine and coordinates signaling.
 *
 * State machine: idle → outgoing/incoming → connecting → connected → ended → idle
 * 45s ring timeout, sessionStorage reconnect, busy notification.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { CallManager } from '@/services/CallManager';
import { GroupCallManager } from '@/services/GroupCallManager';
import type {
  ActiveCall,
  AudioQuality,
  CallAnswerPayload,
  CallEndPayload,
  CallEvent,
  CallIceCandidatePayload,
  CallOfferPayload,
  CallParticipant,
  CallStatePayload,
  CallStats,
  CallStatus,
  CallType,
  CallEndReason,
  GroupCallInvitePayload,
  OpusConfig,
  VideoQuality,
} from '@/types/call';
import { DEFAULT_OPUS_CONFIG } from '@/types/call';
import type { EncryptedCallPayload } from '@/types/call';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { getOnlineRelayDids } from '@/hooks/useNetwork';
import { VoiceStreamBridge } from '@/services/VoiceStreamBridge';
import { encryptSignal, decryptSignal, isSignalEncryptionAvailable } from '@/services/callCrypto';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';
import { dbg } from '@/utils/debug';

const SRC = 'CallContext';

// ─── Context Value ───────────────────────────────────────────────────────────

interface CallContextValue {
  /** Current active call, or null if idle */
  activeCall: ActiveCall | null;
  /** Start an outgoing call */
  startCall: (conversationId: string, remoteDid: string, remoteDisplayName: string, callType: CallType) => Promise<void>;
  /** Accept an incoming call */
  acceptCall: () => Promise<void>;
  /** Decline/end the current call */
  endCall: (reason?: CallEndReason) => void;
  /** Toggle mic mute */
  toggleMute: () => void;
  /** Toggle deafen (mute incoming audio) */
  toggleDeafen: () => void;
  /** Toggle camera */
  toggleCamera: () => void;
  /** Current video quality */
  videoQuality: VideoQuality;
  /** Current audio quality */
  audioQuality: AudioQuality;
  /** Change video quality mid-call */
  setVideoQuality: (quality: VideoQuality) => void;
  /** Change audio quality (applies on next call) */
  setAudioQuality: (quality: AudioQuality) => void;
  /** Switch to next camera or specific device */
  switchCamera: (deviceId?: string) => void;
  /** Current call stats */
  callStats: CallStats | null;
  /** Whether screen sharing is active */
  isScreenSharing: boolean;
  /** Start screen sharing */
  startScreenShare: () => Promise<void>;
  /** Stop screen sharing */
  stopScreenShare: () => void;
  /** The screen share stream */
  screenShareStream: MediaStream | null;
  /** Noise suppression enabled */
  noiseSuppression: boolean;
  /** Echo cancellation enabled */
  echoCancellation: boolean;
  /** Auto gain control enabled */
  autoGainControl: boolean;
  /** Toggle noise suppression */
  setNoiseSuppression: (enabled: boolean) => void;
  /** Toggle echo cancellation */
  setEchoCancellation: (enabled: boolean) => void;
  /** Toggle auto gain control */
  setAutoGainControl: (enabled: boolean) => void;
  /** Remote audio volume (0-100) */
  volume: number;
  /** Set remote audio volume */
  setVolume: (volume: number) => void;
  /** Microphone input volume (0-100) */
  inputVolume: number;
  /** Set microphone input volume */
  setInputVolume: (volume: number) => void;
  /** Current Opus configuration */
  opusConfig: OpusConfig;
  /** Set granular Opus configuration */
  setOpusConfig: (config: OpusConfig) => void;
  /** Ghost bot metadata from data channel */
  ghostMetadata: any | null;
  /** Whether local video tile is shown */
  selfViewVisible: boolean;
  /** Toggle self-view visibility */
  toggleSelfView: () => void;
  /** Remote peer's screen share stream, if they are sharing */
  remoteScreenShareStream: MediaStream | null;
  /** Start an outgoing group call */
  startGroupCall: (conversationId: string, groupId: string, memberDids: string[], memberNames: Record<string, string>, callType: CallType) => Promise<void>;
  /** Join an existing group call (from incoming invite) */
  joinGroupCall: (payload: GroupCallInvitePayload) => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

// ─── Ring Timeout ────────────────────────────────────────────────────────────

const RING_TIMEOUT_MS = 45_000;

// ─── Provider ────────────────────────────────────────────────────────────────

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const devSettings = useDeveloperSettings();
  const myDid = identity?.did ?? '';
  const myName = identity?.displayName ?? '';

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [videoQuality, setVideoQualityState] = useState<VideoQuality>('auto');
  const [audioQuality, setAudioQualityState] = useState<AudioQuality>('opus-voice');
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [ghostMetadata, setGhostMetadata] = useState<any | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [remoteScreenShareStream, setRemoteScreenShareStream] = useState<MediaStream | null>(null);
  const [noiseSuppression, setNoiseSuppressionState] = useState(true);
  const [echoCancellation, setEchoCancellationState] = useState(true);
  const [autoGainControl, setAutoGainControlState] = useState(true);
  const [volume, setVolumeState] = useState(100);
  const [inputVolume, setInputVolumeState] = useState(100);
  const [opusConfig, setOpusConfigState] = useState<OpusConfig>({ ...DEFAULT_OPUS_CONFIG });
  const [selfViewVisible, setSelfViewVisible] = useState(true);
  const callManagerRef = useRef<CallManager | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputGainNodeRef = useRef<GainNode | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  // Ref to avoid stale closure in call event handler
  const activeCallRef = useRef<ActiveCall | null>(null);
  // Set synchronously in callOffer handler so ICE candidates arriving
  // before setActiveCall propagates are not dropped
  const pendingCallIdRef = useRef<string | null>(null);
  // Timer to auto-end a call stuck in 'disconnected' / 'reconnecting' state
  const disconnectedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Group call mesh manager (separate from 1:1 CallManager)
  const groupCallManagerRef = useRef<GroupCallManager | null>(null);
  // Pending group ID while waiting for callRoomCreated response
  const pendingGroupIdRef = useRef<string | null>(null);
  // Hidden <audio> elements for group call remote peer audio playback (web only)
  const groupAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // (friendsRef removed — call invites now use getOnlineRelayDids() instead of WASM friend DIDs)

  // Keep activeCallRef in sync with state for use in event handler closures
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearRingTimeout();
    if (disconnectedTimeoutRef.current) {
      clearTimeout(disconnectedTimeoutRef.current);
      disconnectedTimeoutRef.current = null;
    }
    if (callManagerRef.current) {
      callManagerRef.current.close();
      callManagerRef.current = null;
    }
    if (groupCallManagerRef.current) {
      groupCallManagerRef.current.close();
      groupCallManagerRef.current = null;
    }
    pendingGroupIdRef.current = null;
    pendingCallIdRef.current = null;
    setActiveCall(null);
    setIsScreenSharing(false);
    setScreenShareStream(null);
    setRemoteScreenShareStream(null);
    VoiceStreamBridge.clear();
    // Clean up group call audio elements
    if (groupAudioElementsRef.current) {
      for (const [, el] of groupAudioElementsRef.current) {
        el.pause();
        el.srcObject = null;
        el.remove();
      }
      groupAudioElementsRef.current.clear();
    }
    try {
      sessionStorage.removeItem('umbra_active_call');
    } catch { /* not available */ }
  }, [clearRingTimeout]);

  const toggleSelfView = useCallback(() => setSelfViewVisible((v) => !v), []);

  /** Create a CallParticipant entry with defaults */
  const makeParticipant = useCallback((
    did: string, displayName: string, stream: MediaStream | null, isCameraOff: boolean,
  ): CallParticipant => ({
    did, displayName, stream, isMuted: false, isDeafened: false, isCameraOff, isSpeaking: false, isScreenSharing: false,
  }), []);

  // Track whether WASM signal encryption is available
  const signalEncryptionRef = useRef<boolean | null>(null);
  useEffect(() => {
    isSignalEncryptionAvailable().then((available) => {
      signalEncryptionRef.current = available;
    });
  }, []);

  const sendSignal = useCallback(async (toDid: string, envelope: string, envelopeType: string) => {
    if (!service) return;
    try {
      const parsedPayload = JSON.parse(envelope);

      let finalPayload: object;

      // Attempt to encrypt the signaling payload
      if (signalEncryptionRef.current) {
        try {
          const callId = parsedPayload.callId ?? '';
          const { ciphertext, nonce, timestamp } = await encryptSignal(toDid, parsedPayload, callId);
          finalPayload = {
            encrypted: ciphertext,
            nonce,
            senderDid: parsedPayload.senderDid,
            callId,
            timestamp,
          } satisfies EncryptedCallPayload;
        } catch (encErr) {
          if (__DEV__) dbg.warn('call', 'Signal encryption failed, sending unencrypted', encErr, SRC);
          finalPayload = parsedPayload;
        }
      } else {
        finalPayload = parsedPayload;
      }

      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: toDid,
        payload: JSON.stringify({
          envelope: envelopeType,
          version: 1,
          payload: finalPayload,
        }),
      });
      service.sendCallSignal(toDid, relayMessage);
    } catch (err) {
      if (__DEV__) dbg.warn('call', 'Failed to send signal', err, SRC);
    }
  }, [service]);

  /**
   * Send call_end + cleanup using refs. Safe for beforeunload / AppState / unmount
   * where the reactive `activeCall` state may be stale.
   */
  const endCallFromRef = useCallback((reason: CallEndReason = 'completed') => {
    const call = activeCallRef.current;
    if (!call) return;
    const endPayload: CallEndPayload = {
      callId: call.callId,
      senderDid: myDid,
      reason,
    };
    sendSignal(call.remoteDid, JSON.stringify(endPayload), 'call_end');
    cleanup();
  }, [myDid, sendSignal, cleanup]);

  // ── Start Outgoing Call ──────────────────────────────────────────────────

  const startCall = useCallback(async (
    conversationId: string,
    remoteDid: string,
    remoteDisplayName: string,
    callType: CallType,
  ) => {
    if (activeCall) {
      if (__DEV__) dbg.warn('call', 'Already in a call', undefined, SRC);
      return;
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (__DEV__) dbg.debug('call', 'Starting call', { callType, remoteDid, callId }, SRC);
    const isVideo = callType === 'video';
    const manager = new CallManager();
    callManagerRef.current = manager;
    pendingCallIdRef.current = callId;

    // Set up ICE candidate handler
    manager.onIceCandidate = (candidate) => {
      const payload: CallIceCandidatePayload = {
        callId,
        senderDid: myDid,
        candidate: candidate.candidate!,
        sdpMid: candidate.sdpMid ?? null,
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
      };
      sendSignal(remoteDid, JSON.stringify(payload), 'call_ice_candidate');
    };

    // Set up remote stream handler
    manager.onRemoteStream = (stream) => {
      const hasVideoTrack = stream.getVideoTracks().length > 0;
      setActiveCall((prev) => {
        if (!prev) return prev;
        const updatedParticipants = new Map(prev.participants);
        const remote = updatedParticipants.get(remoteDid);
        if (remote) {
          updatedParticipants.set(remoteDid, {
            ...remote,
            stream,
            isCameraOff: hasVideoTrack ? false : remote.isCameraOff,
          });
        }
        return { ...prev, remoteStream: stream, participants: updatedParticipants };
      });
      VoiceStreamBridge.setPeerStream(remoteDid, stream);
    };

    // Set up renegotiation handler (for screen sharing)
    manager.onRenegotiationNeeded = async (offer) => {
      const reofferPayload = {
        callId,
        senderDid: myDid,
        sdp: JSON.stringify(offer),
      };
      sendSignal(remoteDid, JSON.stringify(reofferPayload), 'call_reoffer');
    };

    // Set up remote screen share handler
    manager.onRemoteScreenShareStream = (stream) => {
      setRemoteScreenShareStream(stream);
    };

    // Set up connection state handler
    manager.onConnectionStateChange = (state) => {
      if (__DEV__) dbg.debug('call', 'Outgoing connection state changed', { state }, SRC);
      if (state === 'connected') {
        clearRingTimeout();
        // Clear any pending disconnected timeout on successful reconnect
        if (disconnectedTimeoutRef.current) {
          clearTimeout(disconnectedTimeoutRef.current);
          disconnectedTimeoutRef.current = null;
        }
        setActiveCall((prev) => prev ? {
          ...prev,
          status: 'connected',
          connectedAt: Date.now(),
        } : prev);
      } else if (state === 'failed' || state === 'closed') {
        if (state === 'failed') {
          const pc = manager.getPeerConnection();
          if (pc) {
            if (__DEV__) dbg.error('call', 'Outgoing call FAILED', { iceConnectionState: pc.iceConnectionState, iceGatheringState: pc.iceGatheringState, signalingState: pc.signalingState }, SRC);
          }
        }
        endCallFromRef(state === 'failed' ? 'failed' : 'completed');
      } else if (state === 'disconnected') {
        setActiveCall((prev) => prev ? { ...prev, status: 'reconnecting' } : prev);
        // Auto-end if stuck disconnected for 30s
        if (disconnectedTimeoutRef.current) clearTimeout(disconnectedTimeoutRef.current);
        disconnectedTimeoutRef.current = setTimeout(() => {
          if (__DEV__) dbg.warn('call', 'Disconnected timeout — ending call', undefined, SRC);
          endCallFromRef('timeout');
        }, 30_000);
      }
    };

    try {
      const sdpOffer = await manager.createOffer(isVideo);
      const localStream = manager.getLocalStream();

      // Register on VoiceStreamBridge for plugin access
      VoiceStreamBridge.setLocalStream(localStream);
      VoiceStreamBridge.setActive(true);
      VoiceStreamBridge.addParticipant({ did: myDid, displayName: myName });
      VoiceStreamBridge.addParticipant({ did: remoteDid, displayName: remoteDisplayName });

      const participants = new Map<string, CallParticipant>();
      participants.set(myDid, makeParticipant(myDid, myName, localStream, !isVideo));
      participants.set(remoteDid, makeParticipant(remoteDid, remoteDisplayName, null, true));

      const call: ActiveCall = {
        callId,
        conversationId,
        callType,
        direction: 'outgoing',
        status: 'outgoing',
        remoteDid,
        remoteDisplayName,
        startedAt: Date.now(),
        connectedAt: null,
        localStream,
        remoteStream: null,
        isMuted: false,
        isDeafened: false,
        isCameraOff: !isVideo,
        participants,
        selfViewVisible: true,
      };

      setActiveCall(call);

      // Store in sessionStorage for reconnect
      try {
        sessionStorage.setItem('umbra_active_call', JSON.stringify({
          callId,
          conversationId,
          remoteDid,
          remoteDisplayName,
          callType,
        }));
      } catch { /* not available */ }

      // Send offer via relay
      const offerPayload: CallOfferPayload = {
        callId,
        callType,
        senderDid: myDid,
        senderDisplayName: myName,
        conversationId,
        sdp: sdpOffer,
        sdpType: 'offer',
      };
      sendSignal(remoteDid, JSON.stringify(offerPayload), 'call_offer');

      // Start ring timeout
      ringTimeoutRef.current = setTimeout(() => {
        if (callManagerRef.current) {
          const endPayload: CallEndPayload = {
            callId,
            senderDid: myDid,
            reason: 'timeout',
          };
          sendSignal(remoteDid, JSON.stringify(endPayload), 'call_end');
          cleanup();
        }
      }, RING_TIMEOUT_MS);

    } catch (err) {
      if (__DEV__) dbg.error('call', 'Failed to start call', err, SRC);
      cleanup();
    }
  }, [activeCall, myDid, myName, sendSignal, clearRingTimeout, cleanup, makeParticipant]);

  // ── Accept Incoming Call ─────────────────────────────────────────────────

  const acceptCall = useCallback(async () => {
    if (!activeCall || activeCall.status !== 'incoming') return;

    clearRingTimeout();

    // Group call: create GroupCallManager, get media, join the relay room
    if (activeCall.isGroupCall && activeCall.roomId) {
      const isVideo = activeCall.callType === 'video';
      const gcManager = new GroupCallManager();
      groupCallManagerRef.current = gcManager;

      try {
        await gcManager.getUserMedia(isVideo);
      } catch (err) {
        if (__DEV__) dbg.error('call', 'Failed to get user media for group call accept', err, SRC);
        groupCallManagerRef.current = null;
        cleanup();
        return;
      }

      const localStream = gcManager.getLocalStream();
      VoiceStreamBridge.setLocalStream(localStream);
      VoiceStreamBridge.setActive(true);

      setActiveCall((prev) => {
        if (!prev) return prev;
        const updatedParticipants = new Map(prev.participants);
        const self = updatedParticipants.get(myDid);
        if (self) updatedParticipants.set(myDid, { ...self, stream: localStream });
        return { ...prev, status: 'connecting', localStream, participants: updatedParticipants };
      });

      service?.joinCallRoom(activeCall.roomId);
      return;
    }

    const manager = callManagerRef.current;
    if (!manager) return;

    try {
      setActiveCall((prev) => prev ? { ...prev, status: 'connecting' } : prev);

      // The offer SDP was stored when we received the call_offer
      const storedOffer = manager.pendingOfferSdp;
      if (!storedOffer) throw new Error('No pending offer SDP');
      if (__DEV__) dbg.debug('call', 'Accepting call', { offerSdpLength: storedOffer.length }, SRC);

      const isVideo = activeCall.callType === 'video';
      const sdpAnswer = await manager.acceptOffer(storedOffer, isVideo);
      const localStream = manager.getLocalStream();

      if (!localStream) {
        if (__DEV__) dbg.error('call', 'acceptOffer succeeded but localStream is null', undefined, SRC);
        cleanup();
        return;
      }

      setActiveCall((prev) => {
        if (!prev) return prev;
        const updatedParticipants = new Map(prev.participants);
        const local = updatedParticipants.get(myDid);
        if (local) {
          updatedParticipants.set(myDid, { ...local, stream: localStream });
        }
        return { ...prev, localStream, participants: updatedParticipants };
      });

      // Send answer via relay
      const answerPayload: CallAnswerPayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        sdp: sdpAnswer,
        sdpType: 'answer',
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(answerPayload), 'call_answer');

    } catch (err) {
      if (__DEV__) dbg.error('call', 'Failed to accept call', err, SRC);
      cleanup();
    }
  }, [activeCall, myDid, sendSignal, clearRingTimeout, cleanup, makeParticipant, service]);

  // ── End Call ─────────────────────────────────────────────────────────────

  const endCall = useCallback((reason: CallEndReason = 'completed') => {
    if (!activeCall) return;

    // Capture call metadata before cleanup destroys state
    const meta = {
      conversationId: activeCall.conversationId,
      callType: activeCall.callType,
      connectedAt: activeCall.connectedAt,
      endedAt: Date.now(),
      reason,
    };

    if (activeCall.isGroupCall) {
      // Group call: leave the relay room instead of sending 1:1 call_end
      if (activeCall.roomId && service) {
        service.leaveCallRoom(activeCall.roomId);
      }
    } else {
      const endPayload: CallEndPayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        reason,
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(endPayload), 'call_end');
    }
    playSound('call_leave');
    cleanup();

    // Send call event message so it appears in chat history (fire-and-forget)
    const durationSec = meta.connectedAt
      ? Math.floor((meta.endedAt - meta.connectedAt) / 1000)
      : 0;
    const statusMap: Record<string, string> = {
      completed: 'completed', declined: 'declined', timeout: 'missed',
      busy: 'missed', failed: 'missed', cancelled: 'cancelled',
    };
    const displayStatus = statusMap[meta.reason] ?? 'missed';
    const eventText = `[call:${meta.callType}:${displayStatus}:${durationSec}]`;
    if (service && !activeCall?.isGroupCall) {
      const relayWs = service.getRelayWs();
      service.sendMessage(meta.conversationId, eventText, relayWs)
        .then((msg) => service.dispatchMessageEvent({ type: 'messageSent', message: msg }))
        .catch((err) => { if (__DEV__) dbg.warn('call', 'Failed to send call event', err, SRC); });
    }
  }, [activeCall, myDid, sendSignal, cleanup, playSound, service]);

  // ── Toggle Mute ──────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const manager = groupCallManagerRef.current ?? callManagerRef.current;
    if (!manager) return;

    const isMuted = manager.toggleMute();
    setActiveCall((prev) => {
      if (!prev) return prev;
      const updatedParticipants = new Map(prev.participants);
      const local = updatedParticipants.get(myDid);
      if (local) {
        updatedParticipants.set(myDid, { ...local, isMuted });
      }
      return { ...prev, isMuted, participants: updatedParticipants };
    });
    playSound(isMuted ? 'call_mute' : 'call_unmute');

    // Notify remote peer
    if (activeCall) {
      const statePayload: CallStatePayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        isMuted,
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(statePayload), 'call_state');
    }
  }, [activeCall, myDid, sendSignal, playSound]);

  // ── Toggle Deafen ───────────────────────────────────────────────────────

  const toggleDeafen = useCallback(() => {
    const manager = groupCallManagerRef.current ?? callManagerRef.current;
    if (!manager) return;

    setActiveCall((prev) => {
      if (!prev) return prev;
      const nextDeafened = !prev.isDeafened;

      // When deafening, mute all incoming audio tracks
      if (prev.remoteStream) {
        prev.remoteStream.getAudioTracks().forEach((track) => {
          track.enabled = !nextDeafened;
        });
      }

      // When deafening, also mute mic if not already muted
      let nextMuted = prev.isMuted;
      if (nextDeafened && !prev.isMuted) {
        manager.toggleMute();
        nextMuted = true;

        // Notify remote about mic mute
        if (activeCall) {
          const statePayload: CallStatePayload = {
            callId: activeCall.callId,
            senderDid: myDid,
            isMuted: true,
          };
          sendSignal(activeCall.remoteDid, JSON.stringify(statePayload), 'call_state');
        }
      }

      // Update local participant
      const updatedParticipants = new Map(prev.participants);
      const local = updatedParticipants.get(myDid);
      if (local) {
        updatedParticipants.set(myDid, { ...local, isDeafened: nextDeafened, isMuted: nextMuted });
      }

      playSound(nextDeafened ? 'call_mute' : 'call_unmute');
      return { ...prev, isDeafened: nextDeafened, isMuted: nextMuted, participants: updatedParticipants };
    });
  }, [activeCall, myDid, sendSignal, playSound]);

  // ── Toggle Camera ────────────────────────────────────────────────────────

  const toggleCamera = useCallback(() => {
    const manager = groupCallManagerRef.current ?? callManagerRef.current;
    if (!manager) return;

    const isCameraOff = manager.toggleCamera();
    setActiveCall((prev) => {
      if (!prev) return prev;
      const updatedParticipants = new Map(prev.participants);
      const local = updatedParticipants.get(myDid);
      if (local) {
        // When re-enabling camera, wrap the stream in a new MediaStream so the
        // Wisp VideoTile's useEffect (which depends on [stream]) re-fires and
        // re-attaches srcObject to the newly mounted <video> element.
        const stream = !isCameraOff && prev.localStream
          ? new MediaStream(prev.localStream.getTracks())
          : local.stream;
        updatedParticipants.set(myDid, { ...local, isCameraOff, stream });
      }
      return { ...prev, isCameraOff, participants: updatedParticipants };
    });

    if (activeCall) {
      const statePayload: CallStatePayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        isCameraOff,
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(statePayload), 'call_state');
    }
  }, [activeCall, myDid, sendSignal]);

  // ── Video Quality ────────────────────────────────────────────────────────

  const setVideoQuality = useCallback((quality: VideoQuality) => {
    setVideoQualityState(quality);
    const manager = callManagerRef.current;
    if (manager) {
      manager.setVideoQuality(quality).catch((err) => {
        if (__DEV__) dbg.warn('call', 'Failed to set video quality', err, SRC);
      });
    }
  }, []);

  // ── Audio Quality ────────────────────────────────────────────────────────

  const setAudioQuality = useCallback((quality: AudioQuality) => {
    setAudioQualityState(quality);
    const manager = callManagerRef.current;
    if (manager) {
      manager.setAudioQuality(quality);
    }
  }, []);

  // ── Opus Configuration ──────────────────────────────────────────────────

  const setOpusConfig = useCallback((config: OpusConfig) => {
    setOpusConfigState(config);
    const manager = callManagerRef.current;
    if (manager) {
      manager.setOpusConfig(config);
    }
  }, []);

  // ── Input Volume (Microphone GainNode) ──────────────────────────────────

  const setInputVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setInputVolumeState(clamped);
    if (inputGainNodeRef.current) {
      inputGainNodeRef.current.gain.value = clamped / 100;
    }
  }, []);

  // ── Switch Camera ────────────────────────────────────────────────────────

  const switchCamera = useCallback((deviceId?: string) => {
    const manager = callManagerRef.current;
    if (!manager) return;

    manager.switchCamera(deviceId).then(() => {
      // Update the local stream reference
      const newStream = manager.getLocalStream();
      setActiveCall((prev) => {
        if (!prev) return prev;
        const updatedParticipants = new Map(prev.participants);
        const local = updatedParticipants.get(myDid);
        if (local) {
          updatedParticipants.set(myDid, { ...local, stream: newStream });
        }
        return { ...prev, localStream: newStream, participants: updatedParticipants };
      });
    }).catch((err) => {
      if (__DEV__) dbg.warn('call', 'Failed to switch camera', err, SRC);
    });
  }, [myDid]);

  // ── Screen Sharing ────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    const manager = callManagerRef.current;
    if (!manager) return;

    try {
      const stream = await manager.startScreenShare();
      setScreenShareStream(stream);
      setIsScreenSharing(true);
    } catch (err) {
      if (__DEV__) dbg.warn('call', 'Failed to start screen share', err, SRC);
      setIsScreenSharing(false);
      setScreenShareStream(null);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    const manager = callManagerRef.current;
    if (!manager) return;

    manager.stopScreenShare();
    setScreenShareStream(null);
    setIsScreenSharing(false);
  }, []);

  // ── Audio Processing ─────────────────────────────────────────────────────

  const reacquireAudioTrack = useCallback(async (constraints: { noiseSuppression: boolean; echoCancellation: boolean; autoGainControl: boolean }) => {
    const manager = callManagerRef.current;
    if (!manager) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: constraints.noiseSuppression,
          echoCancellation: constraints.echoCancellation,
          autoGainControl: constraints.autoGainControl,
        },
      });
      const newTrack = stream.getAudioTracks()[0];
      if (newTrack) {
        const pc = manager.getPeerConnection();
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
          if (sender) {
            await sender.replaceTrack(newTrack);
          }
        }
        // Update the local stream's audio track
        const localStream = manager.getLocalStream();
        if (localStream) {
          const oldTrack = localStream.getAudioTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(newTrack);
        }
      }
    } catch (err) {
      if (__DEV__) dbg.warn('call', 'Failed to reacquire audio track', err, SRC);
    }
  }, []);

  const setNoiseSuppression = useCallback((enabled: boolean) => {
    setNoiseSuppressionState(enabled);
    reacquireAudioTrack({ noiseSuppression: enabled, echoCancellation, autoGainControl });
  }, [reacquireAudioTrack, echoCancellation, autoGainControl]);

  const setEchoCancellation = useCallback((enabled: boolean) => {
    setEchoCancellationState(enabled);
    reacquireAudioTrack({ noiseSuppression, echoCancellation: enabled, autoGainControl });
  }, [reacquireAudioTrack, noiseSuppression, autoGainControl]);

  const setAutoGainControl = useCallback((enabled: boolean) => {
    setAutoGainControlState(enabled);
    reacquireAudioTrack({ noiseSuppression, echoCancellation, autoGainControl: enabled });
  }, [reacquireAudioTrack, noiseSuppression, echoCancellation]);

  // ── Volume Control (Web Audio GainNode) ────────────────────────────────────

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setVolumeState(clamped);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped / 100;
    }
  }, []);

  // Apply GainNode to remote audio when connected
  useEffect(() => {
    const remoteStream = activeCall?.remoteStream;
    if (!remoteStream || activeCall?.status !== 'connected') {
      // Cleanup previous audio context
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        gainNodeRef.current = null;
      }
      return;
    }

    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
      // Resume suspended AudioContext (browsers require user interaction first)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const source = ctx.createMediaStreamSource(remoteStream);
      const gain = ctx.createGain();
      gain.gain.value = volume / 100;
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    } catch {
      // Web Audio not available — clean up partially created context
      ctx?.close().catch(() => {});
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        gainNodeRef.current = null;
      }
    };
  }, [activeCall?.remoteStream, activeCall?.status]);

  // Apply GainNode to local audio (input volume) when connected
  useEffect(() => {
    const localStream = activeCall?.localStream;
    if (!localStream || activeCall?.status !== 'connected') {
      if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close().catch(() => {});
        inputAudioCtxRef.current = null;
        inputGainNodeRef.current = null;
      }
      return;
    }

    let inputCtx: AudioContext | null = null;
    try {
      inputCtx = new AudioContext();
      const source = inputCtx.createMediaStreamSource(localStream);
      const gain = inputCtx.createGain();
      gain.gain.value = inputVolume / 100;

      // Create a destination to pipe gained audio into a new MediaStream
      const dest = inputCtx.createMediaStreamDestination();
      source.connect(gain);
      gain.connect(dest);

      // Replace the audio track on the peer connection sender with the gained track
      const manager = callManagerRef.current;
      if (manager) {
        const pc = manager.getPeerConnection();
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
          const gainedTrack = dest.stream.getAudioTracks()[0];
          if (sender && gainedTrack) {
            sender.replaceTrack(gainedTrack).catch(() => {});
          }
        }
      }

      inputAudioCtxRef.current = inputCtx;
      inputGainNodeRef.current = gain;
    } catch {
      // Web Audio not available — clean up partially created context
      inputCtx?.close().catch(() => {});
    }

    return () => {
      if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close().catch(() => {});
        inputAudioCtxRef.current = null;
        inputGainNodeRef.current = null;
      }
    };
  }, [activeCall?.localStream, activeCall?.status]);

  // Play remote audio for group call participants via hidden <audio> elements.
  // In 1:1 calls, remoteStream is piped through AudioContext above.
  // In group calls, each participant has their own stream that needs playback.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!activeCall?.isGroupCall || activeCall?.status !== 'connected') {
      // Cleanup all audio elements
      for (const [, el] of groupAudioElementsRef.current) {
        el.pause();
        el.srcObject = null;
        el.remove();
      }
      groupAudioElementsRef.current.clear();
      return;
    }

    const participants = activeCall.participants;
    if (!participants) return;

    const currentDids = new Set<string>();

    for (const [did, participant] of participants) {
      if (did === myDid) continue; // Skip self
      currentDids.add(did);

      const stream = participant.stream;
      if (!stream) continue;

      // Check if we already have an audio element for this peer with this stream
      const existing = groupAudioElementsRef.current.get(did);
      if (existing && existing.srcObject === stream) continue;

      // Create or update audio element
      if (existing) {
        existing.pause();
        existing.srcObject = null;
        existing.remove();
      }

      if (__DEV__) {
        const audioTracks = stream.getAudioTracks();
        dbg.info('call', 'Creating audio element for group peer', {
          did: did.slice(0, 20),
          audioTracks: audioTracks.length,
          trackStates: audioTracks.map(t => `${t.kind}:${t.readyState}:enabled=${t.enabled}`),
          streamActive: stream.active,
        }, SRC);
      }

      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.srcObject = stream;
      // Attach to DOM (hidden) so browser will play it
      audio.style.display = 'none';
      document.body.appendChild(audio);
      // Try to play; if autoplay policy blocks it, pipe through AudioContext
      // (which was already resumed during the user-gesture call start).
      audio.play().then(() => {
        if (__DEV__) dbg.info('call', 'Audio element playing for group peer', { did: did.slice(0, 20) }, SRC);
      }).catch(() => {
        if (__DEV__) dbg.warn('call', 'Autoplay blocked, piping through AudioContext', { did: did.slice(0, 20) }, SRC);
        try {
          const ctx = audioCtxRef.current || new AudioContext();
          if (!audioCtxRef.current) audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
          const source = ctx.createMediaStreamSource(stream);
          source.connect(ctx.destination);
          if (__DEV__) dbg.info('call', 'AudioContext fallback playing for group peer', { did: did.slice(0, 20), ctxState: ctx.state }, SRC);
        } catch (e) {
          if (__DEV__) dbg.warn('call', 'AudioContext fallback failed', { did: did.slice(0, 20), err: String(e) }, SRC);
        }
      });
      groupAudioElementsRef.current.set(did, audio);
    }

    // Remove audio elements for peers that left
    for (const [did, el] of groupAudioElementsRef.current) {
      if (!currentDids.has(did)) {
        el.pause();
        el.srcObject = null;
        el.remove();
        groupAudioElementsRef.current.delete(did);
      }
    }
  }, [activeCall?.isGroupCall, activeCall?.status, activeCall?.participants, myDid]);

  // Cleanup group audio elements on unmount
  useEffect(() => {
    return () => {
      for (const [, el] of groupAudioElementsRef.current) {
        el.pause();
        el.srcObject = null;
        el.remove();
      }
      groupAudioElementsRef.current.clear();
    };
  }, []);

  // ── Stats Collection ──────────────────────────────────────────────────────

  useEffect(() => {
    const manager = callManagerRef.current;
    if (!activeCall || activeCall.status !== 'connected' || !manager) {
      setCallStats(null);
      return;
    }

    manager.onStatsUpdate = (stats) => {
      setCallStats(stats);
    };
    manager.onDataChannelMessage = (data) => {
      if (data?.type === 'ghost-metadata') {
        setGhostMetadata(data);
      } else if (data?.type === 'screen-share-state') {
        // Remote peer started or stopped screen sharing — update participant state
        setActiveCall((prev) => {
          if (!prev) return prev;
          const updatedParticipants = new Map(prev.participants);
          const remote = updatedParticipants.get(prev.remoteDid);
          if (remote) {
            updatedParticipants.set(prev.remoteDid, {
              ...remote,
              isScreenSharing: !!data.isScreenSharing,
            });
          }
          return { ...prev, participants: updatedParticipants };
        });
      }
    };
    manager.startStats(1000);

    return () => {
      manager.stopStats();
      manager.onStatsUpdate = null;
      manager.onDataChannelMessage = null;
      setGhostMetadata(null);
    };
  }, [activeCall?.status]);

  // Send diagnostic config to bot via data channel when settings change
  useEffect(() => {
    const manager = callManagerRef.current;
    if (!manager || activeCall?.status !== 'connected' || !devSettings.diagnosticsEnabled) return;

    manager.sendDataChannelMessage({
      type: 'diagnostic-config',
      settings: {
        frameTimingAlerts: devSettings.frameTimingAlerts,
        ringBufferLogging: devSettings.ringBufferLogging,
        rawMediaCapture: devSettings.rawMediaCapture,
        codecNegotiationLog: devSettings.codecNegotiationLog,
        degradationDetection: devSettings.degradationDetection,
        referenceSignalMode: devSettings.referenceSignalMode,
      },
    });
  }, [
    activeCall?.status,
    devSettings.diagnosticsEnabled,
    devSettings.frameTimingAlerts,
    devSettings.ringBufferLogging,
    devSettings.rawMediaCapture,
    devSettings.codecNegotiationLog,
    devSettings.degradationDetection,
    devSettings.referenceSignalMode,
  ]);

  // ── Handle Incoming Call Events ──────────────────────────────────────────

  /**
   * Attempt to decrypt an incoming call signaling payload.
   * If the payload has an `encrypted` field, decrypt it; otherwise return as-is.
   */
  const maybeDecryptPayload = useCallback(async <T,>(payload: any): Promise<T> => {
    if (payload && typeof payload.encrypted === 'string' && payload.nonce && payload.senderDid) {
      try {
        return await decryptSignal<T>(
          payload.senderDid,
          payload.encrypted,
          payload.nonce,
          payload.timestamp ?? 0,
          payload.callId ?? '',
        );
      } catch (err) {
        if (__DEV__) dbg.warn('call', 'Failed to decrypt signal, using as-is', err, SRC);
        return payload as T;
      }
    }
    return payload as T;
  }, []);

  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onCallEvent(async (event: CallEvent) => {
      // Decrypt payload if encrypted — replace in the event object
      const rawPayload = (event as any).payload;
      const decryptedPayload = await maybeDecryptPayload<any>(rawPayload);
      // Overwrite event.payload with decrypted version for all handlers below
      (event as any).payload = decryptedPayload;

      // Use refs to avoid stale closure — activeCall state may lag behind
      const currentCall = activeCallRef.current;
      const currentCallId = currentCall?.callId ?? pendingCallIdRef.current;

      switch (event.type) {
        case 'callOffer': {
          const { payload } = event;

          // If we're already in a call, send busy
          if (currentCall) {
            const endPayload: CallEndPayload = {
              callId: payload.callId,
              senderDid: myDid,
              reason: 'busy',
            };
            sendSignal(payload.senderDid, JSON.stringify(endPayload), 'call_end');
            return;
          }

          if (__DEV__) dbg.debug('call', 'Incoming call offer', { senderDid: payload.senderDid, callId: payload.callId, callType: payload.callType }, SRC);

          // Set pendingCallIdRef synchronously so ICE candidates arriving
          // before setActiveCall propagates are not dropped
          pendingCallIdRef.current = payload.callId;

          // Create a manager and store the offer for later acceptance
          const manager = new CallManager();
          manager.pendingOfferSdp = payload.sdp;
          callManagerRef.current = manager;

          // Set up handlers
          manager.onIceCandidate = (candidate) => {
            const icePayload: CallIceCandidatePayload = {
              callId: payload.callId,
              senderDid: myDid,
              candidate: candidate.candidate!,
              sdpMid: candidate.sdpMid ?? null,
              sdpMLineIndex: candidate.sdpMLineIndex ?? null,
            };
            sendSignal(payload.senderDid, JSON.stringify(icePayload), 'call_ice_candidate');
          };

          manager.onRemoteStream = (stream) => {
            const hasVideoTrack = stream.getVideoTracks().length > 0;
            setActiveCall((prev) => {
              if (!prev) return prev;
              const updatedParticipants = new Map(prev.participants);
              const remote = updatedParticipants.get(payload.senderDid);
              if (remote) {
                updatedParticipants.set(payload.senderDid, {
                  ...remote,
                  stream,
                  isCameraOff: hasVideoTrack ? false : remote.isCameraOff,
                });
              }
              return { ...prev, remoteStream: stream, participants: updatedParticipants };
            });
            VoiceStreamBridge.setPeerStream(payload.senderDid, stream);
          };

          // Set up renegotiation handler (for screen sharing)
          manager.onRenegotiationNeeded = async (offer) => {
            const reofferPayload = {
              callId: payload.callId,
              senderDid: myDid,
              sdp: JSON.stringify(offer),
            };
            sendSignal(payload.senderDid, JSON.stringify(reofferPayload), 'call_reoffer');
          };

          // Set up remote screen share handler
          manager.onRemoteScreenShareStream = (stream) => {
            setRemoteScreenShareStream(stream);
          };

          manager.onConnectionStateChange = (state) => {
            if (__DEV__) dbg.debug('call', 'Connection state changed', { state }, SRC);
            if (state === 'connected') {
              clearRingTimeout();
              if (disconnectedTimeoutRef.current) {
                clearTimeout(disconnectedTimeoutRef.current);
                disconnectedTimeoutRef.current = null;
              }
              setActiveCall((prev) => prev ? {
                ...prev,
                status: 'connected',
                connectedAt: Date.now(),
              } : prev);
            } else if (state === 'failed' || state === 'closed') {
              if (state === 'failed') {
                const pc = manager.getPeerConnection();
                if (pc) {
                  if (__DEV__) dbg.error('call', 'Connection FAILED', { iceConnectionState: pc.iceConnectionState, iceGatheringState: pc.iceGatheringState, signalingState: pc.signalingState }, SRC);
                }
              }
              endCallFromRef(state === 'failed' ? 'failed' : 'completed');
            } else if (state === 'disconnected') {
              setActiveCall((prev) => prev ? { ...prev, status: 'reconnecting' } : prev);
              if (disconnectedTimeoutRef.current) clearTimeout(disconnectedTimeoutRef.current);
              disconnectedTimeoutRef.current = setTimeout(() => {
                if (__DEV__) dbg.warn('call', 'Disconnected timeout — ending call', undefined, SRC);
                endCallFromRef('timeout');
              }, 30_000);
            }
          };

          // Register on VoiceStreamBridge for plugin access
          VoiceStreamBridge.setActive(true);
          VoiceStreamBridge.addParticipant({ did: myDid, displayName: myName });
          VoiceStreamBridge.addParticipant({ did: payload.senderDid, displayName: payload.senderDisplayName });

          // Set incoming call state
          const incomingParticipants = new Map<string, CallParticipant>();
          incomingParticipants.set(myDid, makeParticipant(myDid, myName, null, payload.callType === 'voice'));
          incomingParticipants.set(payload.senderDid, makeParticipant(payload.senderDid, payload.senderDisplayName, null, true));

          const call: ActiveCall = {
            callId: payload.callId,
            conversationId: payload.conversationId,
            callType: payload.callType,
            direction: 'incoming',
            status: 'incoming',
            remoteDid: payload.senderDid,
            remoteDisplayName: payload.senderDisplayName,
            startedAt: Date.now(),
            connectedAt: null,
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isDeafened: false,
            isCameraOff: payload.callType === 'voice',
            participants: incomingParticipants,
            selfViewVisible: true,
          };

          setActiveCall(call);

          // Auto-end after ring timeout
          ringTimeoutRef.current = setTimeout(() => {
            cleanup();
          }, RING_TIMEOUT_MS);

          break;
        }

        case 'callAnswer': {
          const { payload } = event;
          if (!currentCallId || currentCallId !== payload.callId) return;

          const manager = callManagerRef.current;
          if (!manager) return;

          if (__DEV__) dbg.debug('call', 'Call answer received', { sdpLength: payload.sdp?.length }, SRC);
          clearRingTimeout();
          setActiveCall((prev) => prev ? { ...prev, status: 'connecting' } : prev);

          manager.completeHandshake(payload.sdp).catch((err) => {
            if (__DEV__) dbg.error('call', 'Handshake failed', err, SRC);
            cleanup();
          });

          break;
        }

        case 'callIceCandidate': {
          const { payload } = event;

          // Use pendingCallIdRef as fallback — ICE candidates can arrive
          // before setActiveCall state propagates from callOffer handler
          if (!currentCallId || currentCallId !== payload.callId) {
            if (__DEV__) dbg.warn('call', 'Dropping ICE candidate: no matching call', { callId: payload.callId, current: currentCallId }, SRC);
            return;
          }

          const manager = callManagerRef.current;
          if (!manager) {
            if (__DEV__) dbg.warn('call', 'Dropping ICE candidate: no CallManager', undefined, SRC);
            return;
          }

          manager.addIceCandidate({
            candidate: payload.candidate,
            sdpMid: payload.sdpMid,
            sdpMLineIndex: payload.sdpMLineIndex,
          }).catch((err) => {
            if (__DEV__) dbg.warn('call', 'Failed to add ICE candidate', err, SRC);
          });

          break;
        }

        case 'callEnd': {
          const { payload } = event;
          if (currentCallId && currentCallId === payload.callId) {
            if (__DEV__) dbg.debug('call', 'Call ended by remote', { reason: payload.reason }, SRC);
            cleanup();
          }
          break;
        }

        case 'callState': {
          const { payload } = event;
          if (!currentCallId || currentCallId !== payload.callId) return;

          setActiveCall((prev) => {
            if (!prev) return prev;
            const updatedParticipants = new Map(prev.participants);
            const remote = updatedParticipants.get(payload.senderDid);
            if (remote) {
              updatedParticipants.set(payload.senderDid, {
                ...remote,
                ...(payload.isMuted !== undefined ? { isMuted: payload.isMuted } : {}),
                ...(payload.isCameraOff !== undefined ? { isCameraOff: payload.isCameraOff } : {}),
              });
            }
            return { ...prev, participants: updatedParticipants };
          });
          break;
        }

        case 'callReoffer': {
          const { payload } = event;
          if (!currentCallId || currentCallId !== payload.callId) return;
          const manager = callManagerRef.current;
          if (!manager) break;
          try {
            const answerSdp = await manager.handleReoffer(payload.sdp);
            const reanswerPayload = {
              callId: payload.callId,
              senderDid: myDid,
              sdp: answerSdp,
            };
            sendSignal(payload.senderDid, JSON.stringify(reanswerPayload), 'call_reanswer');
          } catch (err) {
            if (__DEV__) dbg.error('call', 'Failed to handle reoffer', err, SRC);
          }
          break;
        }

        case 'callReanswer': {
          const { payload } = event;
          if (!currentCallId || currentCallId !== payload.callId) return;
          const manager = callManagerRef.current;
          if (!manager) break;
          try {
            await manager.handleReanswer(payload.sdp);
          } catch (err) {
            if (__DEV__) dbg.error('call', 'Failed to handle reanswer', err, SRC);
          }
          break;
        }

        // ── Group Call Relay Room Events ──────────────────────────────────

        case 'callRoomCreated': {
          const { roomId: createdRoomId, groupId } = event.payload;
          if (__DEV__) dbg.info('call', 'callRoomCreated received', { roomId: createdRoomId, groupId, pendingGroupId: pendingGroupIdRef.current }, SRC);
          if (groupId !== pendingGroupIdRef.current) break;

          pendingGroupIdRef.current = null;
          setActiveCall((prev) => prev ? { ...prev, roomId: createdRoomId, status: 'connecting' } : prev);
          // NOTE: Do NOT call service.joinCallRoom() here — the creator is
          // already added as a participant by create_call_room on the relay.
          // Calling joinCallRoom causes a duplicate-join that notifies wisps
          // who joined in the meantime, triggering WebRTC "glare" (both sides
          // create offers simultaneously, breaking the handshake).

          // Send group_call_invite to all ONLINE relay DIDs (unencrypted).
          // WASM getFriends()/getMembers() return encryption-derived DIDs that
          // don't match the relay-registered DIDs peers actually connect with.
          // _onlineDids (from incoming from_did fields) are the correct relay DIDs.
          const call = activeCallRef.current;
          if (call?.isGroupCall) {
            const invitePayload: GroupCallInvitePayload = {
              callId: call.callId,
              roomId: createdRoomId,
              groupId: groupId,
              callType: call.callType,
              senderDid: myDid,
              senderDisplayName: myName,
              conversationId: call.conversationId,
            };
            // Use online relay DIDs only — these come from incoming `from_did` fields
            // and are always the correct relay-registered DIDs. Do NOT include
            // encryption-derived member DIDs from getMembers() as they may differ
            // from relay DIDs, causing duplicate participants and failed signaling.
            const onlineDids = getOnlineRelayDids();
            const targetDids = new Set(onlineDids);
            if (__DEV__) dbg.info('call', 'Sending group_call_invite', {
              roomId: createdRoomId, groupId,
              onlineCount: onlineDids.size,
              totalTargets: targetDids.size,
              targets: [...targetDids].map(d => d.slice(0, 20)),
            }, SRC);
            if (targetDids.size === 0) {
              dbg.warn('call', 'NO target DIDs found! Group call invites will not be sent.', undefined, SRC);
            }
            const payloadStr = JSON.stringify({
              envelope: 'group_call_invite',
              version: 1,
              payload: invitePayload,
            });
            for (const targetDid of targetDids) {
              if (targetDid !== myDid) {
                const relayMessage = JSON.stringify({
                  type: 'send',
                  to_did: targetDid,
                  payload: payloadStr,
                });
                service.sendCallSignal(targetDid, relayMessage);
              }
            }
          }
          break;
        }

        case 'callParticipantJoined': {
          const { did } = event.payload;
          if (__DEV__) dbg.info('call', 'callParticipantJoined', { did: did?.slice(0, 20), isSelf: did === myDid, isGroupCall: currentCall?.isGroupCall, hasRoomId: !!currentCall?.roomId }, SRC);
          if (did === myDid) break;
          if (!currentCall?.isGroupCall) break;

          const gcm = groupCallManagerRef.current;
          if (!gcm || !currentCall.roomId) break;

          // Add participant to active call
          setActiveCall((prev) => {
            if (!prev) return prev;
            const updatedParticipants = new Map(prev.participants);
            if (!updatedParticipants.has(did)) {
              updatedParticipants.set(did, makeParticipant(did, did.slice(0, 16), null, true));
            }
            return { ...prev, status: 'connected', connectedAt: prev.connectedAt ?? Date.now(), participants: updatedParticipants };
          });
          clearRingTimeout();

          // Always create offer to new peer — we are the existing participant
          // and the relay only notifies existing members about new joiners.
          gcm.createOfferForPeer(did, currentCall.callType === 'video').then((offerSdp) => {
            if (currentCall.roomId) {
              service.sendCallRoomSignal(currentCall.roomId, did, JSON.stringify({
                type: 'offer',
                sdp: offerSdp,
              }));
              if (__DEV__) dbg.info('call', 'Sent WebRTC offer to peer', { did: did?.slice(0, 20) }, SRC);
            }
          }).catch((err) => {
            if (__DEV__) dbg.warn('call', 'Failed to create offer for peer', err, SRC);
          });
          break;
        }

        case 'callParticipantLeft': {
          const { did } = event.payload;
          if (!currentCall?.isGroupCall) break;

          groupCallManagerRef.current?.removePeer(did);
          VoiceStreamBridge.removePeerStream(did);

          setActiveCall((prev) => {
            if (!prev) return prev;
            const updatedParticipants = new Map(prev.participants);
            updatedParticipants.delete(did);
            return { ...prev, participants: updatedParticipants };
          });
          break;
        }

        case 'callSignalForward': {
          const { fromDid, payload } = event.payload;
          if (__DEV__) dbg.info('call', 'callSignalForward received', { fromDid: fromDid?.slice(0, 20), isGroupCall: currentCall?.isGroupCall, hasGcm: !!groupCallManagerRef.current }, SRC);
          if (!currentCall?.isGroupCall) break;

          const gcm = groupCallManagerRef.current;
          if (!gcm) break;

          try {
            const signal = JSON.parse(payload);
            if (__DEV__) dbg.info('call', 'Group call signal', { fromDid: fromDid?.slice(0, 20), signalType: signal.type }, SRC);

            // Forward plugin signals to VoiceStreamBridge
            if (signal.type === 'plugin-signal') {
              VoiceStreamBridge.emitSignal(signal.payload);
              break;
            }

            if (signal.type === 'offer') {
              if (__DEV__) dbg.info('call', 'Accepting group offer from peer', { fromDid: fromDid?.slice(0, 20) }, SRC);
              gcm.acceptOfferFromPeer(fromDid, signal.sdp, currentCall.callType === 'video').then((answerSdp) => {
                if (currentCall.roomId) {
                  service.sendCallRoomSignal(currentCall.roomId, fromDid, JSON.stringify({
                    type: 'answer',
                    sdp: answerSdp,
                  }));
                  if (__DEV__) dbg.info('call', 'Sent answer to group peer', { fromDid: fromDid?.slice(0, 20) }, SRC);
                }
              }).catch((err) => {
                if (__DEV__) dbg.warn('call', 'Failed to accept group offer', err, SRC);
              });
            } else if (signal.type === 'answer') {
              if (__DEV__) dbg.info('call', 'Completing handshake with group peer', { fromDid: fromDid?.slice(0, 20) }, SRC);
              gcm.completeHandshakeForPeer(fromDid, signal.sdp).catch((err) => {
                if (__DEV__) dbg.warn('call', 'Failed to complete group handshake', err, SRC);
              });
            } else if (signal.type === 'ice-candidate') {
              gcm.addIceCandidateForPeer(fromDid, signal.candidate).catch((err) => {
                if (__DEV__) dbg.warn('call', 'Failed to add group ICE candidate', err, SRC);
              });
            }
          } catch (err) {
            if (__DEV__) dbg.warn('call', 'Failed to parse group signal', err, SRC);
          }
          break;
        }

        case 'groupCallInvite': {
          const { payload } = event;
          // If we're already in a call, ignore the invite
          if (currentCall) break;

          if (__DEV__) dbg.debug('call', 'Incoming group call invite', { callId: payload.callId, groupId: payload.groupId, senderDid: payload.senderDid }, SRC);

          pendingCallIdRef.current = payload.callId;

          const incomingParticipants = new Map<string, CallParticipant>();
          incomingParticipants.set(myDid, makeParticipant(myDid, myName, null, payload.callType === 'voice'));
          incomingParticipants.set(payload.senderDid, makeParticipant(payload.senderDid, payload.senderDisplayName, null, true));

          const incomingCall: ActiveCall = {
            callId: payload.callId,
            conversationId: payload.conversationId,
            callType: payload.callType,
            direction: 'incoming',
            status: 'incoming',
            remoteDid: payload.senderDid,
            remoteDisplayName: payload.senderDisplayName,
            startedAt: Date.now(),
            connectedAt: null,
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isDeafened: false,
            isCameraOff: payload.callType === 'voice',
            participants: incomingParticipants,
            selfViewVisible: true,
            isGroupCall: true,
            groupId: payload.groupId,
            roomId: payload.roomId,
          };

          setActiveCall(incomingCall);

          // Auto-end after ring timeout
          ringTimeoutRef.current = setTimeout(() => {
            cleanup();
          }, RING_TIMEOUT_MS);
          break;
        }
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps — activeCall accessed via ref
  }, [service, myDid, myName, sendSignal, clearRingTimeout, cleanup, maybeDecryptPayload, makeParticipant]);

  // ── Cleanup on unmount — send call_end before tearing down ──────────────

  useEffect(() => {
    return () => {
      // Use endCallFromRef to notify the remote peer before cleanup
      endCallFromRef('completed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps — intentionally run only on unmount
  }, [endCallFromRef]);

  // ── beforeunload (web) — end call when the user closes or navigates away ─

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      endCallFromRef('completed');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endCallFromRef]);

  // ── AppState (mobile) — end call when the app goes to background ──────────

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      // End the call if the app is sent to background or becomes inactive
      if (nextState !== 'active' && activeCallRef.current) {
        if (__DEV__) dbg.debug('call', 'App state changed — ending active call', { nextState }, SRC);
        endCallFromRef('completed');
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [endCallFromRef]);

  // ── Group Call Manager Callbacks ─────────────────────────────────────────

  const setupGroupManagerCallbacks = useCallback((manager: GroupCallManager, currentRoomId: string) => {
    manager.onIceCandidate = (toDid, candidate) => {
      service?.sendCallRoomSignal(currentRoomId, toDid, JSON.stringify({
        type: 'ice-candidate',
        candidate,
      }));
    };

    manager.onRemoteStream = (did, stream) => {
      if (__DEV__) dbg.info('call', 'Group remote stream received', { did }, SRC);
      manager.setupPeerAudioAnalysis(did, stream);
      VoiceStreamBridge.setPeerStream(did, stream);

      // Update participant stream in active call
      setActiveCall((prev) => {
        if (!prev) return prev;
        const updatedParticipants = new Map(prev.participants);
        const existing = updatedParticipants.get(did);
        if (existing) {
          updatedParticipants.set(did, { ...existing, stream });
        } else {
          updatedParticipants.set(did, makeParticipant(did, did.slice(0, 16), stream, true));
        }
        return { ...prev, participants: updatedParticipants };
      });
    };

    manager.onRemoteStreamRemoved = (did) => {
      if (__DEV__) dbg.info('call', 'Group remote stream removed', { did }, SRC);
      VoiceStreamBridge.removePeerStream(did);
    };

    manager.onConnectionStateChange = (did, state) => {
      if (__DEV__) dbg.info('call', 'Group peer connection state changed', { did: did.slice(0, 20), state }, SRC);
      if (state === 'failed') {
        dbg.error('call', 'Group peer connection FAILED — ICE connectivity issue', { did: did.slice(0, 20) }, SRC);
      }
    };
  }, [service, makeParticipant]);

  // Wire up group manager callbacks when activeCall gets a roomId
  useEffect(() => {
    const call = activeCall;
    if (call?.isGroupCall && call.roomId && groupCallManagerRef.current) {
      setupGroupManagerCallbacks(groupCallManagerRef.current, call.roomId);
    }
  }, [activeCall?.roomId, activeCall?.isGroupCall, setupGroupManagerCallbacks]);

  // ── Start Group Call ───────────────────────────────────────────────────

  const startGroupCall = useCallback(async (
    conversationId: string,
    groupId: string,
    memberDids: string[],
    memberNames: Record<string, string>,
    callType: CallType,
  ) => {
    if (activeCall) return;

    // Resume/create AudioContext during user gesture so remote audio can play
    // later without hitting browser autoplay restrictions.
    if (Platform.OS === 'web') {
      try {
        const ctx = audioCtxRef.current || new AudioContext();
        if (!audioCtxRef.current) audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();
      } catch { /* ok — will retry when streams arrive */ }
    }

    const callId = `gcall-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isVideo = callType === 'video';
    const manager = new GroupCallManager();
    groupCallManagerRef.current = manager;
    pendingGroupIdRef.current = groupId;

    try {
      await manager.getUserMedia(isVideo);
    } catch (err) {
      if (__DEV__) dbg.error('call', 'Failed to get user media for group call', err, SRC);
      groupCallManagerRef.current = null;
      pendingGroupIdRef.current = null;
      return;
    }

    const localStream = manager.getLocalStream();

    // Set up VoiceStreamBridge
    VoiceStreamBridge.setLocalStream(localStream);
    VoiceStreamBridge.setActive(true);

    // Build participants map — only add self initially.
    // Other participants will be added via callParticipantJoined relay events
    // with their correct relay DIDs. Pre-populating with memberDids causes
    // duplicates because getMembers() returns encryption-derived DIDs that
    // differ from the relay-registered DIDs peers actually connect with.
    const participants = new Map<string, CallParticipant>();
    participants.set(myDid, makeParticipant(myDid, myName, localStream, !isVideo));

    // Set active call
    const call: ActiveCall = {
      callId,
      conversationId,
      callType,
      direction: 'outgoing',
      status: 'connecting',
      remoteDid: memberDids[0] || '',
      remoteDisplayName: memberNames[memberDids[0]] || 'Group',
      startedAt: Date.now(),
      connectedAt: null,
      localStream,
      remoteStream: null,
      isMuted: false,
      isDeafened: false,
      isCameraOff: !isVideo,
      participants,
      selfViewVisible: true,
      isGroupCall: true,
      groupId,
    };
    setActiveCall(call);
    // Set ref immediately so callRoomCreated handler can read participants
    // (the useEffect that syncs activeCallRef won't fire before the relay responds)
    activeCallRef.current = call;

    // Create relay call room (groupId links the room to the group)
    service?.createCallRoom(groupId);

    // Ring timeout (45s -- if no one joins)
    ringTimeoutRef.current = setTimeout(() => {
      endCallFromRef('timeout');
    }, RING_TIMEOUT_MS);
  }, [activeCall, myDid, myName, makeParticipant, service, endCallFromRef]);

  // ── Join Group Call (from incoming invite) ─────────────────────────────

  const joinGroupCall = useCallback(async (payload: GroupCallInvitePayload) => {
    if (activeCall) return;

    const isVideo = payload.callType === 'video';
    const manager = new GroupCallManager();
    groupCallManagerRef.current = manager;

    try {
      await manager.getUserMedia(isVideo);
    } catch (err) {
      if (__DEV__) dbg.error('call', 'Failed to get user media for group call join', err, SRC);
      groupCallManagerRef.current = null;
      return;
    }

    const localStream = manager.getLocalStream();

    VoiceStreamBridge.setLocalStream(localStream);
    VoiceStreamBridge.setActive(true);

    const participants = new Map<string, CallParticipant>();
    participants.set(myDid, makeParticipant(myDid, myName, localStream, !isVideo));

    const call: ActiveCall = {
      callId: payload.callId,
      conversationId: payload.conversationId,
      callType: payload.callType,
      direction: 'incoming',
      status: 'connecting',
      remoteDid: payload.senderDid,
      remoteDisplayName: payload.senderDisplayName,
      startedAt: Date.now(),
      connectedAt: null,
      localStream,
      remoteStream: null,
      isMuted: false,
      isDeafened: false,
      isCameraOff: !isVideo,
      participants,
      selfViewVisible: true,
      isGroupCall: true,
      groupId: payload.groupId,
      roomId: payload.roomId,
    };
    setActiveCall(call);

    // Join the existing relay room directly
    service?.joinCallRoom(payload.roomId);
  }, [activeCall, myDid, myName, makeParticipant, service]);

  // ── Sound on call connect / incoming ring ────────────────────────────────

  const prevCallStatusRef = useRef<CallStatus | null>(null);
  useEffect(() => {
    const prevStatus = prevCallStatusRef.current;
    const status = activeCall?.status ?? null;
    prevCallStatusRef.current = status;

    if (status === 'connected' && prevStatus !== 'connected') {
      playSound('call_join');
      // Send a "call started" event message into the chat
      if (activeCall && service) {
        const startText = `[call:${activeCall.callType}:started:0]`;
        const relayWs = service.getRelayWs();
        service.sendMessage(activeCall.conversationId, startText, relayWs)
          .then((msg) => service.dispatchMessageEvent({ type: 'messageSent', message: msg }))
          .catch((err) => { if (__DEV__) dbg.warn('call', 'Failed to send call-started event', err, SRC); });
      }
    } else if (status === 'incoming' && prevStatus !== 'incoming') {
      playSound('call_ringing');
    } else if (
      (status === 'outgoing' && prevStatus !== 'outgoing') ||
      (status === 'connecting' && prevStatus !== 'connecting')
    ) {
      // Play ringing sound for outgoing calls (1:1 and group)
      playSound('call_ringing');
    }
  }, [activeCall?.status, activeCall, service, playSound]);

  // ── Context Value ────────────────────────────────────────────────────────

  const value: CallContextValue = {
    activeCall,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    videoQuality,
    audioQuality,
    setVideoQuality,
    setAudioQuality,
    switchCamera,
    callStats,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    screenShareStream,
    noiseSuppression,
    echoCancellation,
    autoGainControl,
    setNoiseSuppression,
    setEchoCancellation,
    setAutoGainControl,
    volume,
    setVolume,
    inputVolume,
    setInputVolume,
    opusConfig,
    setOpusConfig,
    ghostMetadata,
    selfViewVisible,
    toggleSelfView,
    remoteScreenShareStream,
    startGroupCall,
    joinGroupCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCallContext(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within a CallProvider');
  return ctx;
}
