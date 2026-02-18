/**
 * VoiceChannelContext — Manages community voice channel state.
 *
 * When a user clicks a voice channel, this context:
 * 1. Creates/joins a relay CallRoom (using channel ID as group_id)
 * 2. Sets up WebRTC mesh via GroupCallManager
 * 3. Broadcasts join/leave events via community sync
 * 4. Tracks participants across all voice channels
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { GroupCallManager } from '@/services/GroupCallManager';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityEvent } from '@umbra/service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceChannelState {
  /** Currently connected voice channel ID, or null */
  activeChannelId: string | null;
  /** Community ID of the active voice channel */
  activeCommunityId: string | null;
  /** Room ID from the relay */
  roomId: string | null;
  /** Connected participants (DIDs) in the current channel */
  participants: string[];
  /** Whether our mic is muted */
  isMuted: boolean;
  /** Whether we're deafened (can't hear others) */
  isDeafened: boolean;
  /** Whether we're currently connecting */
  isConnecting: boolean;
}

interface VoiceChannelContextValue extends VoiceChannelState {
  /** Join a voice channel. Leaves current channel if already in one. */
  joinVoiceChannel: (communityId: string, channelId: string) => Promise<void>;
  /** Leave the current voice channel */
  leaveVoiceChannel: () => void;
  /** Toggle microphone mute */
  toggleMute: () => void;
  /** Toggle deafen (mute incoming audio) */
  toggleDeafen: () => void;
  /** Map of channelId → Set of participant DIDs (for sidebar display) */
  voiceParticipants: Map<string, Set<string>>;
  /** Channel name for the active voice channel */
  activeChannelName: string | null;
  /** Set of DIDs currently speaking (audio above threshold) */
  speakingDids: Set<string>;
}

const VoiceChannelContext = createContext<VoiceChannelContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VoiceChannelProvider({ children }: { children: React.ReactNode }) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';

  // State
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Voice participants map for sidebar display (channelId → DIDs)
  const [voiceParticipants, setVoiceParticipants] = useState<Map<string, Set<string>>>(new Map());

  // Speaking detection
  const [speakingDids, setSpeakingDids] = useState<Set<string>>(new Set());
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs
  const groupCallManagerRef = useRef<GroupCallManager | null>(null);
  const pendingChannelIdRef = useRef<string | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubCommunityRef = useRef<(() => void) | null>(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      // Clean up when provider unmounts
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
      }
      if (groupCallManagerRef.current) {
        groupCallManagerRef.current.close();
        groupCallManagerRef.current = null;
      }
      unsubCallRef.current?.();
      unsubCommunityRef.current?.();
    };
  }, []);

  // ── Subscribe to call events (relay room messages) ──────────────────────────

  useEffect(() => {
    if (!service) return;

    const unsub = service.onCallEvent((event: any) => {
      switch (event.type) {
        case 'callRoomCreated': {
          // If this matches our pending channel join, store roomId and join
          const { roomId: createdRoomId, groupId } = event.payload;
          if (groupId === pendingChannelIdRef.current) {
            setRoomId(createdRoomId);
            service.joinCallRoom(createdRoomId);
            pendingChannelIdRef.current = null;
          }
          break;
        }

        case 'callParticipantJoined': {
          const { did } = event.payload;
          if (did === myDid) break; // Skip self
          setParticipants((prev) => (prev.includes(did) ? prev : [...prev, did]));

          // Set up WebRTC connection with the new peer
          const manager = groupCallManagerRef.current;
          if (manager && roomId) {
            manager.createOfferForPeer(did, false).then((offerSdp) => {
              service.sendCallRoomSignal(roomId, did, JSON.stringify({
                type: 'offer',
                sdp: offerSdp,
              }));
            }).catch((err) => {
              console.warn('[VoiceChannel] Failed to create offer for peer:', err);
            });
          }
          break;
        }

        case 'callParticipantLeft': {
          const { did } = event.payload;
          setParticipants((prev) => prev.filter((p) => p !== did));
          groupCallManagerRef.current?.removePeer(did);
          break;
        }

        case 'callSignalForward': {
          // Handle WebRTC signaling from other participants
          const { fromDid, payload } = event.payload;
          const manager = groupCallManagerRef.current;
          if (!manager) break;

          try {
            const signal = JSON.parse(payload);
            if (signal.type === 'offer') {
              manager.acceptOfferFromPeer(fromDid, signal.sdp, false).then((answerSdp) => {
                if (roomId) {
                  service.sendCallRoomSignal(roomId, fromDid, JSON.stringify({
                    type: 'answer',
                    sdp: answerSdp,
                  }));
                }
              }).catch((err) => {
                console.warn('[VoiceChannel] Failed to accept offer:', err);
              });
            } else if (signal.type === 'answer') {
              manager.completeHandshakeForPeer(fromDid, signal.sdp).catch((err) => {
                console.warn('[VoiceChannel] Failed to complete handshake:', err);
              });
            } else if (signal.type === 'ice-candidate') {
              manager.addIceCandidateForPeer(fromDid, signal.candidate).catch((err) => {
                console.warn('[VoiceChannel] Failed to add ICE candidate:', err);
              });
            }
          } catch (err) {
            console.warn('[VoiceChannel] Failed to parse signal:', err);
          }
          break;
        }
      }
    });

    unsubCallRef.current = unsub;
    return unsub;
  }, [service, myDid, roomId]);

  // ── Subscribe to community events (voice join/leave from other clients) ────

  useEffect(() => {
    if (!service) return;

    const unsub = service.onCommunityEvent((event: CommunityEvent) => {
      if (event.type === 'voiceChannelJoined') {
        setVoiceParticipants((prev) => {
          const next = new Map(prev);
          const channelSet = next.get(event.channelId) ?? new Set();
          channelSet.add(event.memberDid);
          next.set(event.channelId, channelSet);
          return next;
        });
      } else if (event.type === 'voiceChannelLeft') {
        setVoiceParticipants((prev) => {
          const next = new Map(prev);
          const channelSet = next.get(event.channelId);
          if (channelSet) {
            channelSet.delete(event.memberDid);
            if (channelSet.size === 0) {
              next.delete(event.channelId);
            }
          }
          return next;
        });
      }
    });

    unsubCommunityRef.current = unsub;
    return unsub;
  }, [service]);

  // ── ICE candidate forwarding callback ──────────────────────────────────────

  // ── Speaking detection polling ─────────────────────────────────────────────

  const SPEAKING_THRESHOLD = 0.05; // Audio level threshold (0–1) to count as speaking
  const SPEAKING_POLL_MS = 100; // Poll every 100ms

  const startSpeakingDetection = useCallback(() => {
    if (speakingIntervalRef.current) return; // Already running
    speakingIntervalRef.current = setInterval(() => {
      const manager = groupCallManagerRef.current;
      if (!manager) return;

      const levels = manager.getAllAudioLevels();
      const newSpeaking = new Set<string>();

      // Check local level
      const localLevel = levels.get('local') ?? 0;
      if (localLevel > SPEAKING_THRESHOLD) {
        newSpeaking.add(myDid);
      }

      // Check peer levels
      for (const [did, level] of levels) {
        if (did === 'local') continue;
        if (level > SPEAKING_THRESHOLD) {
          newSpeaking.add(did);
        }
      }

      setSpeakingDids((prev) => {
        // Only update if the set changed
        if (prev.size !== newSpeaking.size) return newSpeaking;
        for (const did of newSpeaking) {
          if (!prev.has(did)) return newSpeaking;
        }
        return prev;
      });
    }, SPEAKING_POLL_MS);
  }, [myDid]);

  const stopSpeakingDetection = useCallback(() => {
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setSpeakingDids(new Set());
  }, []);

  const setupManagerCallbacks = useCallback((manager: GroupCallManager, currentRoomId: string) => {
    manager.onIceCandidate = (toDid, candidate) => {
      service?.sendCallRoomSignal(currentRoomId, toDid, JSON.stringify({
        type: 'ice-candidate',
        candidate,
      }));
    };

    manager.onRemoteStream = (did, stream) => {
      console.log('[VoiceChannel] Remote stream from', did);
      // Set up audio analysis for the new remote stream
      manager.setupPeerAudioAnalysis(did, stream);
    };

    manager.onRemoteStreamRemoved = (did) => {
      console.log('[VoiceChannel] Remote stream removed from', did);
    };

    manager.onConnectionStateChange = (did, state) => {
      console.log('[VoiceChannel] Peer', did, 'connection state:', state);
    };
  }, [service]);

  // ── Join voice channel ─────────────────────────────────────────────────────

  const joinVoiceChannel = useCallback(async (communityId: string, channelId: string) => {
    if (!service) return;

    // If already in a channel, leave first
    if (activeChannelId) {
      leaveVoiceChannelInternal();
    }

    setIsConnecting(true);
    setActiveChannelId(channelId);
    setActiveCommunityId(communityId);
    pendingChannelIdRef.current = channelId;

    // Get channel name for display
    try {
      const channel = await service.getChannel(channelId);
      setActiveChannelName(channel.name);
    } catch {
      setActiveChannelName(channelId);
    }

    // Initialize GroupCallManager
    const manager = new GroupCallManager();
    groupCallManagerRef.current = manager;

    // Get local audio stream
    try {
      await manager.getUserMedia(false); // audio only
    } catch (err) {
      console.warn('[VoiceChannel] Failed to get user media:', err);
      setIsConnecting(false);
      setActiveChannelId(null);
      setActiveCommunityId(null);
      setActiveChannelName(null);
      groupCallManagerRef.current = null;
      return;
    }

    // Create call room on relay (uses channelId as group_id)
    // The `callRoomCreated` event handler will store the roomId and join
    service.createCallRoom(channelId);

    setIsConnecting(false);
    setIsMuted(false);
    setIsDeafened(false);

    // Start speaking detection polling
    startSpeakingDetection();

    // Add ourselves to voice participants map
    setVoiceParticipants((prev) => {
      const next = new Map(prev);
      const channelSet = next.get(channelId) ?? new Set();
      channelSet.add(myDid);
      next.set(channelId, channelSet);
      return next;
    });

    // Broadcast join event to other community members
    const relayWs = service.getRelayWs();
    service.broadcastCommunityEvent(
      communityId,
      { type: 'voiceChannelJoined', communityId, channelId, memberDid: myDid },
      myDid,
      relayWs,
    ).catch((err) => console.warn('[VoiceChannel] Failed to broadcast join:', err));

    // Also dispatch locally for this client's UI
    service.dispatchCommunityEvent({
      type: 'voiceChannelJoined',
      communityId,
      channelId,
      memberDid: myDid,
    });
  }, [service, myDid, activeChannelId, startSpeakingDetection]);

  // ── Leave voice channel (internal, no dependency on leaveVoiceChannel) ─────

  const leaveVoiceChannelInternal = useCallback(() => {
    if (!service) return;

    const currentRoomId = roomId;
    const currentChannelId = activeChannelId;
    const currentCommunityId = activeCommunityId;

    // Leave relay room
    if (currentRoomId) {
      service.leaveCallRoom(currentRoomId);
    }

    // Close WebRTC connections
    if (groupCallManagerRef.current) {
      groupCallManagerRef.current.close();
      groupCallManagerRef.current = null;
    }

    // Remove ourselves from voice participants map
    if (currentChannelId) {
      setVoiceParticipants((prev) => {
        const next = new Map(prev);
        const channelSet = next.get(currentChannelId);
        if (channelSet) {
          channelSet.delete(myDid);
          if (channelSet.size === 0) {
            next.delete(currentChannelId);
          }
        }
        return next;
      });
    }

    // Broadcast leave event
    if (currentCommunityId && currentChannelId) {
      const relayWs = service.getRelayWs();
      service.broadcastCommunityEvent(
        currentCommunityId,
        { type: 'voiceChannelLeft', communityId: currentCommunityId, channelId: currentChannelId, memberDid: myDid },
        myDid,
        relayWs,
      ).catch((err) => console.warn('[VoiceChannel] Failed to broadcast leave:', err));

      service.dispatchCommunityEvent({
        type: 'voiceChannelLeft',
        communityId: currentCommunityId,
        channelId: currentChannelId,
        memberDid: myDid,
      });
    }

    // Stop speaking detection
    stopSpeakingDetection();

    // Reset state
    setActiveChannelId(null);
    setActiveCommunityId(null);
    setActiveChannelName(null);
    setRoomId(null);
    setParticipants([]);
    setIsMuted(false);
    setIsDeafened(false);
    setIsConnecting(false);
    pendingChannelIdRef.current = null;
  }, [service, myDid, roomId, activeChannelId, activeCommunityId, stopSpeakingDetection]);

  // ── Public leave (delegates to internal) ────────────────────────────────────

  const leaveVoiceChannel = useCallback(() => {
    leaveVoiceChannelInternal();
  }, [leaveVoiceChannelInternal]);

  // ── Setup manager callbacks when roomId becomes available ──────────────────

  useEffect(() => {
    if (roomId && groupCallManagerRef.current) {
      setupManagerCallbacks(groupCallManagerRef.current, roomId);
    }
  }, [roomId, setupManagerCallbacks]);

  // ── Toggle mute ─────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const manager = groupCallManagerRef.current;
    if (manager) {
      const muted = manager.toggleMute();
      setIsMuted(muted);
    }
  }, []);

  // ── Toggle deafen ───────────────────────────────────────────────────────────

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const next = !prev;
      // When deafening, also mute if not already muted
      if (next && !isMuted) {
        const manager = groupCallManagerRef.current;
        if (manager) {
          manager.toggleMute();
          setIsMuted(true);
        }
      }
      return next;
    });
  }, [isMuted]);

  // ── Context value ───────────────────────────────────────────────────────────

  const value: VoiceChannelContextValue = {
    activeChannelId,
    activeCommunityId,
    roomId,
    participants,
    isMuted,
    isDeafened,
    isConnecting,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    voiceParticipants,
    activeChannelName,
    speakingDids,
  };

  return (
    <VoiceChannelContext.Provider value={value}>
      {children}
    </VoiceChannelContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceChannel(): VoiceChannelContextValue {
  const ctx = useContext(VoiceChannelContext);
  if (!ctx) {
    throw new Error('useVoiceChannel must be used within a VoiceChannelProvider');
  }
  return ctx;
}
