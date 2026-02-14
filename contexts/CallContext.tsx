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
  CallAnswerPayload,
  CallEndPayload,
  CallEvent,
  CallIceCandidatePayload,
  CallOfferPayload,
  CallStatePayload,
  CallStatus,
  CallType,
  CallEndReason,
} from '@/types/call';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';

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
}

const CallContext = createContext<CallContextValue | null>(null);

// ─── Ring Timeout ────────────────────────────────────────────────────────────

const RING_TIMEOUT_MS = 45_000;

// ─── Provider ────────────────────────────────────────────────────────────────

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';
  const myName = identity?.displayName ?? '';

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const callManagerRef = useRef<CallManager | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setActiveCall(null);
    try {
      sessionStorage.removeItem('umbra_active_call');
    } catch { /* not available */ }
  }, [clearRingTimeout]);

  const sendSignal = useCallback((toDid: string, envelope: string, envelopeType: string) => {
    if (!service) return;
    try {
      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: toDid,
        payload: JSON.stringify({
          envelope: envelopeType,
          version: 1,
          payload: JSON.parse(envelope),
        }),
      });
      // Access the relay WebSocket through the service's send method
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
    const isVideo = callType === 'video';
    const manager = new CallManager();
    callManagerRef.current = manager;

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
    };

    // Set up connection state handler
    manager.onConnectionStateChange = (state) => {
      if (state === 'connected') {
        clearRingTimeout();
        setActiveCall((prev) => prev ? {
          ...prev,
          status: 'connected',
          connectedAt: Date.now(),
        } : prev);
      } else if (state === 'failed' || state === 'disconnected') {
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

      const isVideo = activeCall.callType === 'video';
      const sdpAnswer = await manager.acceptOffer(storedOffer, isVideo);
      const localStream = manager.getLocalStream();

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
    cleanup();
  }, [activeCall, myDid, sendSignal, cleanup]);

  // ── Toggle Mute ──────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const manager = callManagerRef.current;
    if (!manager) return;

    const isMuted = manager.toggleMute();
    setActiveCall((prev) => prev ? { ...prev, isMuted } : prev);

    // Notify remote peer
    if (activeCall) {
      const statePayload: CallStatePayload = {
        callId: activeCall.callId,
        senderDid: myDid,
        isMuted,
      };
      sendSignal(activeCall.remoteDid, JSON.stringify(statePayload), 'call_state');
    }
  }, [activeCall, myDid, sendSignal]);

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

  // ── Handle Incoming Call Events ──────────────────────────────────────────

  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onCallEvent((event: CallEvent) => {
      switch (event.type) {
        case 'callOffer': {
          const { payload } = event;

          // If we're already in a call, send busy
          if (activeCall) {
            const endPayload: CallEndPayload = {
              callId: payload.callId,
              senderDid: myDid,
              reason: 'busy',
            };
            sendSignal(payload.senderDid, JSON.stringify(endPayload), 'call_end');
            return;
          }

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
          };

          manager.onConnectionStateChange = (state) => {
            if (state === 'connected') {
              clearRingTimeout();
              setActiveCall((prev) => prev ? {
                ...prev,
                status: 'connected',
                connectedAt: Date.now(),
              } : prev);
            } else if (state === 'failed') {
              cleanup();
            }
          };

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
          if (!activeCall || activeCall.callId !== payload.callId) return;

          const manager = callManagerRef.current;
          if (!manager) return;

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
          if (!activeCall || activeCall.callId !== payload.callId) return;

          const manager = callManagerRef.current;
          if (!manager) return;

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
          if (activeCall && activeCall.callId === payload.callId) {
            cleanup();
          }
          break;
        }

        case 'callState': {
          const { payload } = event;
          if (!activeCall || activeCall.callId !== payload.callId) return;

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
  }, [service, activeCall, myDid, sendSignal, clearRingTimeout, cleanup]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ── Context Value ────────────────────────────────────────────────────────

  const value: CallContextValue = {
    activeCall,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
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
