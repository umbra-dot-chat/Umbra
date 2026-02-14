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

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream | null;
  pendingCandidates: RTCIceCandidateInit[];
}

export class GroupCallManager {
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private _videoQuality: VideoQuality = 'auto';
  private _audioQuality: AudioQuality = 'opus';
  private _isScreenSharing = false;

  // Callbacks
  onRemoteStream: ((did: string, stream: MediaStream) => void) | null = null;
  onRemoteStreamRemoved: ((did: string) => void) | null = null;
  onIceCandidate: ((toDid: string, candidate: RTCIceCandidateInit) => void) | null = null;
  onConnectionStateChange: ((did: string, state: RTCPeerConnectionState) => void) | null = null;

  /**
   * Create and store an RTCPeerConnection for a specific remote peer.
   */
  private createPeerConnectionForPeer(
    did: string,
    iceServers: IceServer[] = DEFAULT_ICE_SERVERS,
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: iceServers.map((s) => ({
        urls: s.urls,
        username: s.username,
        credential: s.credential,
      })),
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

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
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
    const pc = this.createPeerConnectionForPeer(did, iceServers);
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
    const pc = this.createPeerConnectionForPeer(did, iceServers);
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

    // Reset callbacks
    this.onRemoteStream = null;
    this.onRemoteStreamRemoved = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }
}
