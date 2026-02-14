/**
 * CallManager — WebRTC media peer connection manager for voice/video calls.
 *
 * Manages a single RTCPeerConnection for 1:1 calls with audio/video tracks.
 * Separate from the existing libp2p data-channel connections.
 */

import type {
  CallStats,
  IceServer,
  VideoQuality,
  VideoQualityPreset,
} from '@/types/call';
import { DEFAULT_ICE_SERVERS, VIDEO_QUALITY_PRESETS } from '@/types/call';

export class CallManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private lastBytesSent = 0;
  private lastBytesReceived = 0;
  private lastStatsTimestamp = 0;

  // Callbacks
  onRemoteStream: ((stream: MediaStream) => void) | null = null;
  onIceCandidate: ((candidate: RTCIceCandidateInit) => void) | null = null;
  onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  onStatsUpdate: ((stats: CallStats) => void) | null = null;

  /**
   * Initialize a peer connection with optional ICE servers.
   */
  private createPeerConnection(iceServers: IceServer[] = DEFAULT_ICE_SERVERS): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: iceServers.map((s) => ({
        urls: s.urls,
        username: s.username,
        credential: s.credential,
      })),
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(pc.connectionState);
    };

    this.pc = pc;
    return pc;
  }

  /**
   * Get the user's media stream (audio only for voice, audio+video for video calls).
   */
  async getUserMedia(video: boolean): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.localStream;
  }

  /**
   * Create an SDP offer for an outgoing call.
   * Returns the SDP offer string.
   */
  async createOffer(video: boolean, iceServers?: IceServer[]): Promise<string> {
    const pc = this.createPeerConnection(iceServers);
    const stream = await this.getUserMedia(video);

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
   * Accept an incoming SDP offer and return an SDP answer.
   */
  async acceptOffer(offerSdp: string, video: boolean, iceServers?: IceServer[]): Promise<string> {
    const pc = this.createPeerConnection(iceServers);
    const stream = await this.getUserMedia(video);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    const offer = JSON.parse(offerSdp);
    await pc.setRemoteDescription(new RTCSessionDescription({
      sdp: offer.sdp,
      type: offer.type,
    }));

    // Apply any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return JSON.stringify({
      sdp: answer.sdp,
      type: answer.type,
    });
  }

  /**
   * Complete the handshake by setting the remote answer on the offerer side.
   */
  async completeHandshake(answerSdp: string): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');

    const answer = JSON.parse(answerSdp);
    await this.pc.setRemoteDescription(new RTCSessionDescription({
      sdp: answer.sdp,
      type: answer.type,
    }));

    // Apply any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];
  }

  /**
   * Add a remote ICE candidate.
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc && this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      // Queue candidates until remote description is set
      this.pendingCandidates.push(candidate);
    }
  }

  /**
   * Toggle local microphone mute.
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
   * Toggle local camera on/off.
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
   * Get the current local stream.
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get the current remote stream.
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Start collecting WebRTC stats periodically.
   */
  startStats(intervalMs = 2000): void {
    this.stopStats();
    this.lastStatsTimestamp = Date.now();
    this.lastBytesSent = 0;
    this.lastBytesReceived = 0;

    this.statsInterval = setInterval(async () => {
      const stats = await this.getStats();
      this.onStatsUpdate?.(stats);
    }, intervalMs);
  }

  /**
   * Stop collecting stats.
   */
  stopStats(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Get current call statistics.
   */
  async getStats(): Promise<CallStats> {
    const result: CallStats = {
      resolution: null,
      frameRate: null,
      bitrate: null,
      packetLoss: null,
      codec: null,
      roundTripTime: null,
      jitter: null,
    };

    if (!this.pc) return result;

    try {
      const stats = await this.pc.getStats();
      const now = Date.now();

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          result.frameRate = report.framesPerSecond ?? null;
          result.jitter = report.jitter ? report.jitter * 1000 : null;

          if (report.frameWidth && report.frameHeight) {
            result.resolution = {
              width: report.frameWidth,
              height: report.frameHeight,
            };
          }

          // Calculate packet loss
          if (report.packetsLost != null && report.packetsReceived != null) {
            const total = report.packetsLost + report.packetsReceived;
            result.packetLoss = total > 0 ? (report.packetsLost / total) * 100 : 0;
          }
        }

        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          // Calculate bitrate
          if (report.bytesSent != null && this.lastBytesSent > 0) {
            const elapsed = (now - this.lastStatsTimestamp) / 1000;
            if (elapsed > 0) {
              result.bitrate = Math.round(((report.bytesSent - this.lastBytesSent) * 8) / elapsed / 1000);
            }
          }
          this.lastBytesSent = report.bytesSent ?? 0;
        }

        if (report.type === 'codec') {
          result.codec = report.mimeType ?? null;
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.roundTripTime = report.currentRoundTripTime
            ? report.currentRoundTripTime * 1000
            : null;
        }
      });

      this.lastStatsTimestamp = now;
    } catch {
      // Stats collection failed — return defaults
    }

    return result;
  }

  /**
   * Close the peer connection and release all media tracks.
   */
  close(): void {
    this.stopStats();

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }

    this.remoteStream = null;

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.pendingCandidates = [];
    this.onRemoteStream = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
    this.onStatsUpdate = null;
  }
}
