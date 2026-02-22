/**
 * GroupCallManager — Mesh-topology WebRTC manager for group calls.
 *
 * Manages one RTCPeerConnection per remote participant (up to 6 peers in mesh).
 * For larger groups (7-50), the SfuClient should be used instead.
 */

import type {
  AudioQuality,
  CallStats,
  IceServer,
  VideoQuality,
  VideoQualityPreset,
} from '@/types/call';
import { DEFAULT_ICE_SERVERS, VIDEO_QUALITY_PRESETS } from '@/types/call';
import { resolveTurnCredentials } from '@/config/network';
import { Platform } from 'react-native';

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream | null;
  pendingCandidates: RTCIceCandidateInit[];
}

interface AudioAnalysis {
  analyser: AnalyserNode;
  dataArray: Uint8Array<ArrayBuffer>;
  source: MediaStreamAudioSourceNode;
}

export class GroupCallManager {
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private _videoQuality: VideoQuality = 'auto';
  private _audioQuality: AudioQuality = 'opus-voice';
  private _isScreenSharing = false;

  // Audio level monitoring
  private audioContext: AudioContext | null = null;
  private localAnalysis: AudioAnalysis | null = null;
  private peerAnalysis: Map<string, AudioAnalysis> = new Map();

  // Callbacks
  onRemoteStream: ((did: string, stream: MediaStream) => void) | null = null;
  onRemoteStreamRemoved: ((did: string) => void) | null = null;
  onIceCandidate: ((toDid: string, candidate: RTCIceCandidateInit) => void) | null = null;
  onConnectionStateChange: ((did: string, state: RTCPeerConnectionState) => void) | null = null;

  /**
   * Build ICE servers with dynamic TURN credentials.
   *
   * Credential resolution order:
   * 1. Credentials already on the IceServer entry
   * 2. Auto-resolved from relay or env var via resolveTurnCredentials()
   */
  private async buildIceServers(iceServers: IceServer[] = DEFAULT_ICE_SERVERS): Promise<RTCIceServer[]> {
    const servers: RTCIceServer[] = [];
    let resolvedCreds: { username: string; credential: string } | null = null;

    for (const s of iceServers) {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      const hasTurn = urls.some((u) => u.startsWith('turn:') || u.startsWith('turns:'));

      if (hasTurn && !s.credential) {
        // Auto-resolve from relay or env var (cached)
        if (resolvedCreds === null) {
          resolvedCreds = (await resolveTurnCredentials()) ?? (undefined as any);
        }
        if (resolvedCreds) {
          servers.push({ urls: s.urls, username: resolvedCreds.username, credential: resolvedCreds.credential });
        } else {
          // No credentials available — skip to avoid Chrome InvalidAccessError
          console.warn('[GroupCallManager] Skipping TURN server (no credentials):', urls[0]);
          continue;
        }
      } else {
        servers.push({ urls: s.urls, username: s.username, credential: s.credential });
      }
    }

    return servers;
  }

  /**
   * Ensure AudioContext exists (lazy init). Returns null on non-web platforms
   * where AudioContext / AnalyserNode are unavailable.
   */
  private ensureAudioContext(): AudioContext | null {
    if (Platform.OS !== 'web') return null;
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Create an AnalyserNode for a media stream. Used for audio level detection.
   */
  private createAnalysisForStream(stream: MediaStream): AudioAnalysis | null {
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return null; // Not available on mobile
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      return { analyser, dataArray, source };
    } catch {
      return null;
    }
  }

  /**
   * Set up local audio analysis after getUserMedia.
   */
  private setupLocalAudioAnalysis(): void {
    if (!this.localStream) return;
    this.localAnalysis = this.createAnalysisForStream(this.localStream);
  }

  /**
   * Set up remote audio analysis for a peer stream.
   */
  setupPeerAudioAnalysis(did: string, stream: MediaStream): void {
    // Clean up existing analysis for this peer
    this.cleanupPeerAnalysis(did);
    const analysis = this.createAnalysisForStream(stream);
    if (analysis) {
      this.peerAnalysis.set(did, analysis);
    }
  }

  /**
   * Clean up audio analysis for a specific peer.
   */
  private cleanupPeerAnalysis(did: string): void {
    const analysis = this.peerAnalysis.get(did);
    if (analysis) {
      analysis.source.disconnect();
      this.peerAnalysis.delete(did);
    }
  }

  /**
   * Get the current audio level (0–1) from an AnalyserNode.
   */
  private getLevel(analysis: AudioAnalysis): number {
    analysis.analyser.getByteFrequencyData(analysis.dataArray);
    let sum = 0;
    for (let i = 0; i < analysis.dataArray.length; i++) {
      sum += analysis.dataArray[i];
    }
    return sum / (analysis.dataArray.length * 255);
  }

  /**
   * Get the current local audio level (0–1). Returns 0 if not available.
   */
  getLocalAudioLevel(): number {
    if (!this.localAnalysis) return 0;
    return this.getLevel(this.localAnalysis);
  }

  /**
   * Get the current audio level (0–1) for a specific remote peer.
   */
  getPeerAudioLevel(did: string): number {
    const analysis = this.peerAnalysis.get(did);
    if (!analysis) return 0;
    return this.getLevel(analysis);
  }

  /**
   * Get all current audio levels: 'local' key for self, DID keys for peers.
   */
  getAllAudioLevels(): Map<string, number> {
    const levels = new Map<string, number>();
    levels.set('local', this.getLocalAudioLevel());
    for (const [did] of this.peerAnalysis) {
      levels.set(did, this.getPeerAudioLevel(did));
    }
    return levels;
  }

  /**
   * Create and store an RTCPeerConnection for a specific remote peer.
   */
  private async createPeerConnectionForPeer(
    did: string,
    iceServers: IceServer[] = DEFAULT_ICE_SERVERS,
  ): Promise<RTCPeerConnection> {
    const resolvedServers = await this.buildIceServers(iceServers);
    const pc = new RTCPeerConnection({
      iceServers: resolvedServers,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(did, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        const peer = this.peers.get(did);
        if (peer) {
          peer.remoteStream = event.streams[0];
        }
        this.onRemoteStream?.(did, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(did, pc.connectionState);

      // Clean up the remote stream reference when the peer disconnects
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        const peer = this.peers.get(did);
        if (peer?.remoteStream) {
          peer.remoteStream = null;
          this.onRemoteStreamRemoved?.(did);
        }
      }
    };

    this.peers.set(did, {
      pc,
      remoteStream: null,
      pendingCandidates: [],
    });

    return pc;
  }

  /**
   * Get the user's media stream (audio only for voice, audio+video for video calls).
   */
  async getUserMedia(video: boolean): Promise<MediaStream> {
    const preset = this._videoQuality !== 'auto'
      ? VIDEO_QUALITY_PRESETS[this._videoQuality]
      : null;

    const videoConstraints: MediaTrackConstraints | false = video
      ? {
          width: { ideal: preset?.width ?? 1280 },
          height: { ideal: preset?.height ?? 720 },
          frameRate: { ideal: preset?.frameRate ?? 30 },
        }
      : false;

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: videoConstraints,
    };

    if (Platform.OS === 'web') {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } else {
      // Mobile: use react-native-webrtc
      try {
        const { mediaDevices } = await import('react-native-webrtc');
        this.localStream = await (mediaDevices as any).getUserMedia(constraints);
      } catch {
        throw new Error('react-native-webrtc is not available');
      }
    }
    this.setupLocalAudioAnalysis();
    return this.localStream;
  }

  /**
   * Create an SDP offer for a specific peer.
   * Reuses the existing local stream if already acquired, otherwise acquires it.
   * Returns the SDP offer string.
   */
  async createOfferForPeer(
    did: string,
    video: boolean,
    iceServers?: IceServer[],
  ): Promise<string> {
    const pc = await this.createPeerConnectionForPeer(did, iceServers);
    const stream = this.localStream ?? await this.getUserMedia(video);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return JSON.stringify({
      sdp: offer.sdp,
      type: offer.type,
    });
  }

  /**
   * Accept an incoming SDP offer from a specific peer and return an SDP answer.
   * Reuses the existing local stream if already acquired, otherwise acquires it.
   */
  async acceptOfferFromPeer(
    did: string,
    offerSdp: string,
    video: boolean,
    iceServers?: IceServer[],
  ): Promise<string> {
    const pc = await this.createPeerConnectionForPeer(did, iceServers);
    const stream = this.localStream ?? await this.getUserMedia(video);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    const offer = JSON.parse(offerSdp);
    await pc.setRemoteDescription(new RTCSessionDescription({
      sdp: offer.sdp,
      type: offer.type,
    }));

    // Apply any pending ICE candidates
    const peer = this.peers.get(did);
    if (peer) {
      for (const candidate of peer.pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      peer.pendingCandidates = [];
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return JSON.stringify({
      sdp: answer.sdp,
      type: answer.type,
    });
  }

  /**
   * Complete the handshake by setting the remote answer on the offerer side
   * for a specific peer.
   */
  async completeHandshakeForPeer(did: string, answerSdp: string): Promise<void> {
    const peer = this.peers.get(did);
    if (!peer) throw new Error(`No peer connection for ${did}`);

    const answer = JSON.parse(answerSdp);
    await peer.pc.setRemoteDescription(new RTCSessionDescription({
      sdp: answer.sdp,
      type: answer.type,
    }));

    // Apply any pending ICE candidates
    for (const candidate of peer.pendingCandidates) {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    peer.pendingCandidates = [];
  }

  /**
   * Add a remote ICE candidate for a specific peer.
   */
  async addIceCandidateForPeer(did: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(did);
    if (peer && peer.pc.remoteDescription) {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else if (peer) {
      // Queue candidates until remote description is set
      peer.pendingCandidates.push(candidate);
    }
  }

  /**
   * Close and remove a single peer's connection.
   */
  removePeer(did: string): void {
    const peer = this.peers.get(did);
    if (!peer) return;

    peer.pc.close();
    this.peers.delete(did);
    this.cleanupPeerAnalysis(did);
    this.onRemoteStreamRemoved?.(did);
  }

  /**
   * Toggle local microphone mute. Affects all peers since they share
   * the same local stream.
   */
  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // true = muted
    }
    return false;
  }

  /**
   * Toggle local camera on/off. Affects all peers since they share
   * the same local stream.
   */
  toggleCamera(): boolean {
    if (!this.localStream) return true;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // true = camera off
    }
    return true;
  }

  /**
   * Change video quality mid-call by adjusting sender encoding parameters
   * on all peer connections. Takes effect immediately -- no renegotiation needed.
   */
  async setVideoQuality(quality: VideoQuality): Promise<void> {
    this._videoQuality = quality;

    const preset = quality !== 'auto' ? VIDEO_QUALITY_PRESETS[quality] : null;

    for (const [, peer] of this.peers) {
      const sender = peer.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (!sender) continue;

      const params = sender.getParameters();

      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      if (preset) {
        params.encodings[0].maxBitrate = preset.maxBitrate * 1000; // kbps -> bps
        params.encodings[0].maxFramerate = preset.frameRate;
      } else {
        // Auto: remove constraints
        delete params.encodings[0].maxBitrate;
        delete params.encodings[0].maxFramerate;
      }

      await sender.setParameters(params);
    }
  }

  /**
   * Set audio quality preference. Applies on next call (SDP munging for codec).
   */
  setAudioQuality(quality: AudioQuality): void {
    this._audioQuality = quality;
  }

  /**
   * Get the current video quality setting.
   */
  get videoQuality(): VideoQuality {
    return this._videoQuality;
  }

  /**
   * Get the current audio quality setting.
   */
  get audioQuality(): AudioQuality {
    return this._audioQuality;
  }

  /**
   * Start sharing the screen. Adds the screen share track to all peer connections.
   */
  async startScreenShare(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    this.screenShareStream = stream;
    this._isScreenSharing = true;

    // Add screen share tracks to all existing peer connections
    for (const [, peer] of this.peers) {
      for (const track of stream.getTracks()) {
        peer.pc.addTrack(track, stream);
      }
    }

    return stream;
  }

  /**
   * Stop sharing the screen. Removes the screen share tracks from all peer
   * connections and stops the tracks.
   */
  async stopScreenShare(): Promise<void> {
    if (!this.screenShareStream) return;

    // Remove screen share tracks from all peer connections
    for (const [, peer] of this.peers) {
      const senders = peer.pc.getSenders();
      for (const sender of senders) {
        if (
          sender.track &&
          this.screenShareStream.getTracks().includes(sender.track)
        ) {
          peer.pc.removeTrack(sender);
        }
      }
    }

    // Stop all screen share tracks
    for (const track of this.screenShareStream.getTracks()) {
      track.stop();
    }

    this.screenShareStream = null;
    this._isScreenSharing = false;
  }

  /**
   * Whether the user is currently sharing their screen.
   */
  get isScreenSharing(): boolean {
    return this._isScreenSharing;
  }

  /**
   * Get the current local media stream.
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get the current screen share stream.
   */
  getScreenShareStream(): MediaStream | null {
    return this.screenShareStream;
  }

  /**
   * Get the remote stream for a specific peer.
   */
  getPeerStream(did: string): MediaStream | null {
    return this.peers.get(did)?.remoteStream ?? null;
  }

  /**
   * Get all peer remote streams (non-null only).
   */
  getAllPeerStreams(): Map<string, MediaStream> {
    const streams = new Map<string, MediaStream>();
    for (const [did, peer] of this.peers) {
      if (peer.remoteStream) {
        streams.set(did, peer.remoteStream);
      }
    }
    return streams;
  }

  /**
   * Total number of participants including self.
   */
  get participantCount(): number {
    return this.peers.size + 1;
  }

  /**
   * Close all peer connections, stop all tracks, and reset everything.
   */
  close(): void {
    // Close all peer connections
    for (const [, peer] of this.peers) {
      peer.pc.close();
    }
    this.peers.clear();

    // Stop local stream tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }

    // Stop screen share tracks
    if (this.screenShareStream) {
      for (const track of this.screenShareStream.getTracks()) {
        track.stop();
      }
      this.screenShareStream = null;
    }

    this._isScreenSharing = false;
    this.roomId = null;

    // Clean up audio analysis
    if (this.localAnalysis) {
      this.localAnalysis.source.disconnect();
      this.localAnalysis = null;
    }
    for (const [did] of this.peerAnalysis) {
      this.cleanupPeerAnalysis(did);
    }
    this.peerAnalysis.clear();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    // Reset callbacks
    this.onRemoteStream = null;
    this.onRemoteStreamRemoved = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }
}
