/**
 * VoiceStreamBridge — Singleton registry for voice call streams.
 *
 * Both VoiceChannelContext (group) and CallContext (1:1) write streams here.
 * Plugins read streams via the PluginAPI voice methods.
 */

type ParticipantInfo = { did: string; displayName: string };
type ParticipantEvent = { type: 'joined' | 'left'; did: string; displayName: string };
type ParticipantCallback = (event: ParticipantEvent) => void;
type SignalCallback = (event: any) => void;

class VoiceStreamBridgeImpl {
  private localStream: MediaStream | null = null;
  private peerStreams = new Map<string, MediaStream>();
  private screenShareStream: MediaStream | null = null;
  private participants: ParticipantInfo[] = [];
  private active = false;

  private participantListeners = new Set<ParticipantCallback>();
  private signalListeners = new Set<SignalCallback>();
  private signalSender: ((payload: any) => void) | null = null;

  // ── Streams ──────────────────────────────────────────────────────────────

  setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  setPeerStream(did: string, stream: MediaStream): void {
    this.peerStreams.set(did, stream);
  }

  getPeerStream(did: string): MediaStream | null {
    return this.peerStreams.get(did) ?? null;
  }

  removePeerStream(did: string): void {
    this.peerStreams.delete(did);
  }

  getAllPeerStreams(): Map<string, MediaStream> {
    return new Map(this.peerStreams);
  }

  setScreenShareStream(stream: MediaStream | null): void {
    this.screenShareStream = stream;
  }

  getScreenShareStream(): MediaStream | null {
    return this.screenShareStream;
  }

  // ── Participants ─────────────────────────────────────────────────────────

  setParticipants(participants: ParticipantInfo[]): void {
    this.participants = [...participants];
  }

  addParticipant(info: ParticipantInfo): void {
    if (!this.participants.find((p) => p.did === info.did)) {
      this.participants.push(info);
      this.emitParticipant({ type: 'joined', ...info });
    }
  }

  removeParticipant(did: string): void {
    const idx = this.participants.findIndex((p) => p.did === did);
    if (idx !== -1) {
      const removed = this.participants.splice(idx, 1)[0];
      this.emitParticipant({ type: 'left', did, displayName: removed.displayName });
    }
  }

  getParticipants(): ParticipantInfo[] {
    return [...this.participants];
  }

  // ── Active state ─────────────────────────────────────────────────────────

  setActive(active: boolean): void {
    this.active = active;
  }

  isActive(): boolean {
    return this.active;
  }

  // ── Events: participant changes ──────────────────────────────────────────

  onParticipantChange(cb: ParticipantCallback): () => void {
    this.participantListeners.add(cb);
    return () => { this.participantListeners.delete(cb); };
  }

  private emitParticipant(event: ParticipantEvent): void {
    for (const cb of this.participantListeners) {
      try { cb(event); } catch { /* ignore */ }
    }
  }

  // ── Call room signal forwarding ──────────────────────────────────────────

  setSignalSender(fn: (payload: any) => void): void {
    this.signalSender = fn;
  }

  sendSignal(payload: any): void {
    if (this.signalSender) {
      this.signalSender(payload);
    }
  }

  onSignal(cb: SignalCallback): () => void {
    this.signalListeners.add(cb);
    return () => { this.signalListeners.delete(cb); };
  }

  emitSignal(event: any): void {
    for (const cb of this.signalListeners) {
      try { cb(event); } catch { /* ignore */ }
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  clear(): void {
    this.localStream = null;
    this.peerStreams.clear();
    this.screenShareStream = null;
    this.participants = [];
    this.active = false;
    this.signalSender = null;
  }
}

/** Global singleton */
export const VoiceStreamBridge = new VoiceStreamBridgeImpl();
