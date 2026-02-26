/**
 * CallContext — Manages call state machine and coordinates signaling.
 *
 * State machine: idle → outgoing/incoming → connecting → connected → ended → idle
 * 45s ring timeout, sessionStorage reconnect, busy notification.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CallManager } from '@/services/CallManager';
import type {
  ActiveCall,
  AudioQuality,
  CallAnswerPayload,
  CallEndPayload,
  CallEvent,
  CallIceCandidatePayload,
  CallOfferPayload,
  CallStatePayload,
  CallStats,
  CallStatus,
  CallType,
  CallEndReason,
  OpusConfig,
  VideoQuality,
} from '@/types/call';
import { DEFAULT_OPUS_CONFIG } from '@/types/call';
import type { EncryptedCallPayload } from '@/types/call';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { VoiceStreamBridge } from '@/services/VoiceStreamBridge';
import { encryptSignal, decryptSignal, isSignalEncryptionAvailable } from '@/services/callCrypto';

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
}

const CallContext = createContext<CallContextValue | null>(null);

// ─── Ring Timeout ────────────────────────────────────────────────────────────

const RING_TIMEOUT_MS = 45_000;

// ─── Provider ────────────────────────────────────────────────────────────────

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const myDid = identity?.did ?? '';
  const myName = identity?.displayName ?? '';

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [videoQuality, setVideoQualityState] = useState<VideoQuality>('auto');
  const [audioQuality, setAudioQualityState] = useState<AudioQuality>('opus-voice');
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [noiseSuppression, setNoiseSuppressionState] = useState(true);
  const [echoCancellation, setEchoCancellationState] = useState(true);
  const [autoGainControl, setAutoGainControlState] = useState(true);
  const [volume, setVolumeState] = useState(100);
  const [inputVolume, setInputVolumeState] = useState(100);
  const [opusConfig, setOpusConfigState] = useState<OpusConfig>({ ...DEFAULT_OPUS_CONFIG });
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
    if (callManagerRef.current) {
      callManagerRef.current.close();
      callManagerRef.current = null;
    }
    pendingCallIdRef.current = null;
    setActiveCall(null);
    setIsScreenSharing(false);
    setScreenShareStream(null);
    VoiceStreamBridge.clear();
    try {
      sessionStorage.removeItem('umbra_active_call');
    } catch { /* not available */ }
  }, [clearRingTimeout]);

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
          console.warn('[CallContext] Signal encryption failed, sending unencrypted:', encErr);
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
      console.warn('[CallContext] Failed to send signal:', err);
    }
  }, [service]);

  // ── Start Outgoing Call ──────────────────────────────────────────────────

  const startCall = useCallback(async (
    conversationId: string,
    remoteDid: string,
    remoteDisplayName: string,
    callType: CallType,
  ) => {
    if (activeCall) {
      console.warn('[CallContext] Already in a call');
      return;
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log('[CallContext] Starting', callType, 'call to', remoteDid, 'callId:', callId);
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
      setActiveCall((prev) => prev ? { ...prev, remoteStream: stream } : prev);
      VoiceStreamBridge.setPeerStream(remoteDid, stream);
    };

    // Set up connection state handler
    manager.onConnectionStateChange = (state) => {
      console.log('[CallContext] Outgoing connection state →', state, 'at', new Date().toISOString());
      if (state === 'connected') {
        clearRingTimeout();
        setActiveCall((prev) => prev ? {
          ...prev,
          status: 'connected',
          connectedAt: Date.now(),
        } : prev);
      } else if (state === 'failed' || state === 'disconnected') {
        if (state === 'failed') {
          const pc = (manager as any).pc as RTCPeerConnection | undefined;
          if (pc) {
            console.error('[CallContext] Outgoing call FAILED — iceConnectionState:', pc.iceConnectionState,
              'iceGatheringState:', pc.iceGatheringState, 'signalingState:', pc.signalingState);
          }
        }
        setActiveCall((prev) => {
          if (!prev) return prev;
          if (state === 'failed') {
            cleanup();
            return null;
          }
          return { ...prev, status: 'reconnecting' };
        });
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
        isCameraOff: !isVideo,
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
      console.error('[CallContext] Failed to start call:', err);
      cleanup();
    }
  }, [activeCall, myDid, myName, sendSignal, clearRingTimeout, cleanup]);

  // ── Accept Incoming Call ─────────────────────────────────────────────────

  const acceptCall = useCallback(async () => {
    if (!activeCall || activeCall.status !== 'incoming') return;

    const manager = callManagerRef.current;
    if (!manager) return;

    clearRingTimeout();

    try {
      setActiveCall((prev) => prev ? { ...prev, status: 'connecting' } : prev);

      // The offer SDP was stored when we received the call_offer
      const storedOffer = (manager as any)._pendingOfferSdp;
      if (!storedOffer) throw new Error('No pending offer SDP');
      console.log('[CallContext] Accepting call, offer SDP length:', storedOffer.length);

      const isVideo = activeCall.callType === 'video';
      const sdpAnswer = await manager.acceptOffer(storedOffer, isVideo);
      const localStream = manager.getLocalStream();

      if (!localStream) {
        console.error('[CallContext] acceptOffer succeeded but localStream is null');
        cleanup();
        return;
      }

      setActiveCall((prev) => prev ? { ...prev, localStream } : prev);

      // Send answer via relay
      const answerPayload: CallAnswerPayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        sdp: sdpAnswer,
        sdpType: 'answer',
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(answerPayload), 'call_answer');

    } catch (err) {
      console.error('[CallContext] Failed to accept call:', err);
      cleanup();
    }
  }, [activeCall, myDid, sendSignal, clearRingTimeout, cleanup]);

  // ── End Call ─────────────────────────────────────────────────────────────

  const endCall = useCallback((reason: CallEndReason = 'completed') => {
    if (!activeCall) return;

    const endPayload: CallEndPayload = {
      callId: activeCall.callId,
      senderDid: myDid,
      reason,
    };
    sendSignal(activeCall.remoteDid, JSON.stringify(endPayload), 'call_end');
    playSound('call_leave');
    cleanup();
  }, [activeCall, myDid, sendSignal, cleanup, playSound]);

  // ── Toggle Mute ──────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const manager = callManagerRef.current;
    if (!manager) return;

    const isMuted = manager.toggleMute();
    setActiveCall((prev) => prev ? { ...prev, isMuted } : prev);
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

  // ── Toggle Camera ────────────────────────────────────────────────────────

  const toggleCamera = useCallback(() => {
    const manager = callManagerRef.current;
    if (!manager) return;

    const isCameraOff = manager.toggleCamera();
    setActiveCall((prev) => prev ? { ...prev, isCameraOff } : prev);

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
        console.warn('[CallContext] Failed to set video quality:', err);
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
      setActiveCall((prev) => prev ? { ...prev, localStream: manager.getLocalStream() } : prev);
    }).catch((err) => {
      console.warn('[CallContext] Failed to switch camera:', err);
    });
  }, []);

  // ── Screen Sharing ────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    const manager = callManagerRef.current;
    if (!manager) return;

    try {
      const stream = await manager.startScreenShare();
      setScreenShareStream(stream);
      setIsScreenSharing(true);
    } catch (err) {
      console.warn('[CallContext] Failed to start screen share:', err);
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
        const pc = (manager as any)._pc as RTCPeerConnection | undefined;
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
      console.warn('[CallContext] Failed to reacquire audio track:', err);
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

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(remoteStream);
      const gain = ctx.createGain();
      gain.gain.value = volume / 100;
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    } catch {
      // Web Audio not available
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

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(localStream);
      const gain = ctx.createGain();
      gain.gain.value = inputVolume / 100;

      // Create a destination to pipe gained audio into a new MediaStream
      const dest = ctx.createMediaStreamDestination();
      source.connect(gain);
      gain.connect(dest);

      // Replace the audio track on the peer connection sender with the gained track
      const manager = callManagerRef.current;
      if (manager) {
        const pc = (manager as any).pc as RTCPeerConnection | undefined;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
          const gainedTrack = dest.stream.getAudioTracks()[0];
          if (sender && gainedTrack) {
            sender.replaceTrack(gainedTrack).catch(() => {});
          }
        }
      }

      inputAudioCtxRef.current = ctx;
      inputGainNodeRef.current = gain;
    } catch {
      // Web Audio not available
    }

    return () => {
      if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close().catch(() => {});
        inputAudioCtxRef.current = null;
        inputGainNodeRef.current = null;
      }
    };
  }, [activeCall?.localStream, activeCall?.status]);

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
    manager.startStats(2000);

    return () => {
      manager.stopStats();
      manager.onStatsUpdate = null;
    };
  }, [activeCall?.status]);

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
        console.warn('[CallContext] Failed to decrypt signal, using as-is:', err);
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

          console.log('[CallContext] Incoming call offer from', payload.senderDid, 'callId:', payload.callId, 'type:', payload.callType);

          // Set pendingCallIdRef synchronously so ICE candidates arriving
          // before setActiveCall propagates are not dropped
          pendingCallIdRef.current = payload.callId;

          // Create a manager and store the offer for later acceptance
          const manager = new CallManager();
          (manager as any)._pendingOfferSdp = payload.sdp;
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
            setActiveCall((prev) => prev ? { ...prev, remoteStream: stream } : prev);
            VoiceStreamBridge.setPeerStream(payload.senderDid, stream);
          };

          manager.onConnectionStateChange = (state) => {
            console.log('[CallContext] Connection state →', state, 'at', new Date().toISOString());
            if (state === 'connected') {
              clearRingTimeout();
              setActiveCall((prev) => prev ? {
                ...prev,
                status: 'connected',
                connectedAt: Date.now(),
              } : prev);
            } else if (state === 'failed') {
              const pc = (manager as any).pc as RTCPeerConnection | undefined;
              if (pc) {
                console.error('[CallContext] Connection FAILED — iceConnectionState:', pc.iceConnectionState,
                  'iceGatheringState:', pc.iceGatheringState, 'signalingState:', pc.signalingState);
              }
              cleanup();
            } else if (state === 'disconnected') {
              setActiveCall((prev) => prev ? { ...prev, status: 'reconnecting' } : prev);
            }
          };

          // Register on VoiceStreamBridge for plugin access
          VoiceStreamBridge.setActive(true);
          VoiceStreamBridge.addParticipant({ did: myDid, displayName: myName });
          VoiceStreamBridge.addParticipant({ did: payload.senderDid, displayName: payload.senderDisplayName });

          // Set incoming call state
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
            isCameraOff: payload.callType === 'voice',
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

          console.log('[CallContext] Call answer received, SDP length:', payload.sdp?.length);
          clearRingTimeout();
          setActiveCall((prev) => prev ? { ...prev, status: 'connecting' } : prev);

          manager.completeHandshake(payload.sdp).catch((err) => {
            console.error('[CallContext] Handshake failed:', err);
            cleanup();
          });

          break;
        }

        case 'callIceCandidate': {
          const { payload } = event;

          // Use pendingCallIdRef as fallback — ICE candidates can arrive
          // before setActiveCall state propagates from callOffer handler
          if (!currentCallId || currentCallId !== payload.callId) {
            console.warn('[CallContext] Dropping ICE candidate: no matching call. callId:', payload.callId, 'current:', currentCallId);
            return;
          }

          const manager = callManagerRef.current;
          if (!manager) {
            console.warn('[CallContext] Dropping ICE candidate: no CallManager');
            return;
          }

          manager.addIceCandidate({
            candidate: payload.candidate,
            sdpMid: payload.sdpMid,
            sdpMLineIndex: payload.sdpMLineIndex,
          }).catch((err) => {
            console.warn('[CallContext] Failed to add ICE candidate:', err);
          });

          break;
        }

        case 'callEnd': {
          const { payload } = event;
          if (currentCallId && currentCallId === payload.callId) {
            console.log('[CallContext] Call ended by remote, reason:', payload.reason);
            cleanup();
          }
          break;
        }

        case 'callState': {
          const { payload } = event;
          if (!currentCallId || currentCallId !== payload.callId) return;

          setActiveCall((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              ...(payload.isMuted !== undefined ? {} : {}),
              // Remote peer state updates would go here for the participant model
            };
          });
          break;
        }
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps — activeCall accessed via ref
  }, [service, myDid, sendSignal, clearRingTimeout, cleanup, maybeDecryptPayload]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ── Sound on call connect / incoming ring ────────────────────────────────

  const prevCallStatusRef = useRef<CallStatus | null>(null);
  useEffect(() => {
    const prevStatus = prevCallStatusRef.current;
    const status = activeCall?.status ?? null;
    prevCallStatusRef.current = status;

    if (status === 'connected' && prevStatus !== 'connected') {
      playSound('call_join');
    } else if (status === 'incoming' && prevStatus !== 'incoming') {
      playSound('call_ringing');
    }
  }, [activeCall?.status, playSound]);

  // ── Context Value ────────────────────────────────────────────────────────

  const value: CallContextValue = {
    activeCall,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
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
