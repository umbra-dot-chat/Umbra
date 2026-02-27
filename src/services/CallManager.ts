/**
 * CallManager — WebRTC media peer connection manager for voice/video calls.
 *
 * Manages a single RTCPeerConnection for 1:1 calls with audio/video tracks.
 * Separate from the existing libp2p data-channel connections.
 */

import type {
  AudioQuality,
  CallStats,
  IceServer,
  OpusConfig,
  StunTestResult,
  TurnTestResult,
  VideoQuality,
  VideoQualityPreset,
} from '@/types/call';
import { DEFAULT_ICE_SERVERS, DEFAULT_OPUS_CONFIG, VIDEO_QUALITY_PRESETS } from '@/types/call';
import { generateTurnCredentials, resolveTurnCredentials } from '@/config/network';

// ─── Inline E2EE Worker (Blob URL) ──────────────────────────────────────────
// Metro bundler doesn't support import.meta.url, so we inline the worker code
// and create it via a Blob URL at runtime. This worker handles frame-level
// AES-256-GCM encryption/decryption for RTCRtpScriptTransform.
function createE2EEWorker(): Worker {
  const workerCode = `
let encryptionKey = null;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

self.onmessage = (event) => {
  if (event.data.type === 'setKey') {
    encryptionKey = event.data.key;
  }
};

self.onrtctransform = (event) => {
  const { readable, writable } = event.transformer;
  const direction = event.transformer.options?.direction || 'send';
  if (direction === 'send') {
    transformStream(readable, writable, encryptFrame);
  } else {
    transformStream(readable, writable, decryptFrame);
  }
};

async function transformStream(readable, writable, transform) {
  const reader = readable.getReader();
  const writer = writable.getWriter();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      try {
        const transformed = await transform(value);
        await writer.write(transformed);
      } catch (err) {
        await writer.write(value);
      }
    }
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}

async function encryptFrame(frame) {
  if (!encryptionKey) return frame;
  const data = new Uint8Array(frame.data);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
    encryptionKey,
    data,
  );
  const result = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), IV_LENGTH);
  frame.data = result.buffer;
  return frame;
}

async function decryptFrame(frame) {
  if (!encryptionKey) return frame;
  const data = new Uint8Array(frame.data);
  if (data.length <= IV_LENGTH) return frame;
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
    encryptionKey,
    ciphertext,
  );
  frame.data = decrypted;
  return frame;
}
`;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export class CallManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private lastBytesSent = 0;
  private lastBytesReceived = 0;
  private lastStatsTimestamp = 0;
  private _videoQuality: VideoQuality = 'auto';
  private _audioQuality: AudioQuality = 'opus-voice';
  private _opusConfig: OpusConfig = { ...DEFAULT_OPUS_CONFIG };
  private _currentVideoDeviceId: string | null = null;
  private screenShareStream: MediaStream | null = null;
  private _isScreenSharing = false;
  private e2eeWorker: Worker | null = null;

  // TURN credential secret (shared with coturn)
  private turnSecret: string | null = null;

  // Callbacks
  onRemoteStream: ((stream: MediaStream) => void) | null = null;
  onIceCandidate: ((candidate: RTCIceCandidateInit) => void) | null = null;
  onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  onStatsUpdate: ((stats: CallStats) => void) | null = null;

  /**
   * Set the TURN shared secret for credential generation.
   */
  setTurnSecret(secret: string): void {
    this.turnSecret = secret;
  }

  /**
   * Build ICE servers with dynamic TURN credentials.
   *
   * Credential resolution order:
   * 1. Credentials already on the IceServer entry
   * 2. Manual turnSecret (set via setTurnSecret)
   * 3. Auto-resolved from relay or env var via resolveTurnCredentials()
   */
  private async buildIceServers(iceServers: IceServer[] = DEFAULT_ICE_SERVERS): Promise<RTCIceServer[]> {
    const servers: RTCIceServer[] = [];

    // Pre-resolve TURN credentials once (shared cache)
    let resolvedCreds: { username: string; credential: string } | null = null;

    for (const s of iceServers) {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      const hasTurn = urls.some((u) => u.startsWith('turn:') || u.startsWith('turns:'));

      if (hasTurn && !s.credential) {
        // Need credentials — try manual secret first, then auto-resolve
        if (this.turnSecret) {
          const creds = await generateTurnCredentials(this.turnSecret);
          servers.push({ urls: s.urls, username: creds.username, credential: creds.credential });
        } else {
          // Auto-resolve from relay or env var (cached)
          if (resolvedCreds === null) {
            resolvedCreds = (await resolveTurnCredentials()) ?? undefined as any;
          }
          if (resolvedCreds) {
            servers.push({ urls: s.urls, username: resolvedCreds.username, credential: resolvedCreds.credential });
          } else {
            // No credentials available — skip to avoid Chrome InvalidAccessError
            console.warn('[CallManager] Skipping TURN server (no credentials):', urls[0]);
            continue;
          }
        }
      } else {
        servers.push({ urls: s.urls, username: s.username, credential: s.credential });
      }
    }

    return servers;
  }

  /**
   * Initialize a peer connection with optional ICE servers.
   */
  private async createPeerConnection(iceServers: IceServer[] = DEFAULT_ICE_SERVERS): Promise<RTCPeerConnection> {
    const resolvedServers = await this.buildIceServers(iceServers);
    const pc = new RTCPeerConnection({
      iceServers: resolvedServers,
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
  async getUserMedia(video: boolean, deviceId?: string): Promise<MediaStream> {
    const preset = this._videoQuality !== 'auto'
      ? VIDEO_QUALITY_PRESETS[this._videoQuality]
      : null;

    const videoConstraints: MediaTrackConstraints | false = video
      ? {
          width: { ideal: preset?.width ?? 1280 },
          height: { ideal: preset?.height ?? 720 },
          frameRate: { ideal: preset?.frameRate ?? 30 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
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

    // Track the current video device
    if (video) {
      const vt = this.localStream.getVideoTracks()[0];
      if (vt) {
        this._currentVideoDeviceId = vt.getSettings().deviceId ?? null;
      }
    }

    return this.localStream;
  }

  /**
   * Create an SDP offer for an outgoing call.
   * Returns the SDP offer string.
   *
   * @param video - Whether to include video
   * @param iceServers - Optional ICE server configuration
   * @param mediaE2EE - Optional: enable frame-level E2EE via RTCRtpScriptTransform
   * @param sharedKeyBytes - Required when mediaE2EE is true: 32-byte shared key for AES-256-GCM
   */
  async createOffer(
    video: boolean,
    iceServers?: IceServer[],
    mediaE2EE = false,
    sharedKeyBytes?: Uint8Array,
  ): Promise<string> {
    const pc = await this.createPeerConnection(iceServers);
    const stream = await this.getUserMedia(video);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    // Apply frame-level E2EE transforms if requested
    if (mediaE2EE && sharedKeyBytes) {
      await this.setupMediaE2EE(pc, sharedKeyBytes);
    }

    const offer = await pc.createOffer();

    // Apply Opus SDP munging if using an Opus quality mode
    let sdp = offer.sdp ?? '';
    if (this._audioQuality !== 'pcm') {
      sdp = this.mungeOpusSdp(sdp, this._opusConfig);
    }

    const mungedOffer = { ...offer, sdp };
    await pc.setLocalDescription(mungedOffer as RTCSessionDescriptionInit);

    return JSON.stringify({
      sdp,
      type: offer.type,
    });
  }

  /**
   * Accept an incoming SDP offer and return an SDP answer.
   *
   * @param offerSdp - The remote SDP offer string
   * @param video - Whether to include video
   * @param iceServers - Optional ICE server configuration
   * @param mediaE2EE - Optional: enable frame-level E2EE via RTCRtpScriptTransform
   * @param sharedKeyBytes - Required when mediaE2EE is true: 32-byte shared key for AES-256-GCM
   */
  async acceptOffer(
    offerSdp: string,
    video: boolean,
    iceServers?: IceServer[],
    mediaE2EE = false,
    sharedKeyBytes?: Uint8Array,
  ): Promise<string> {
    const pc = await this.createPeerConnection(iceServers);
    const stream = await this.getUserMedia(video);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    // Apply frame-level E2EE transforms if requested
    if (mediaE2EE && sharedKeyBytes) {
      await this.setupMediaE2EE(pc, sharedKeyBytes);
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

    // Apply Opus SDP munging if using an Opus quality mode
    let answerSdpStr = answer.sdp ?? '';
    if (this._audioQuality !== 'pcm') {
      answerSdpStr = this.mungeOpusSdp(answerSdpStr, this._opusConfig);
    }

    const mungedAnswer = { ...answer, sdp: answerSdpStr };
    await pc.setLocalDescription(mungedAnswer as RTCSessionDescriptionInit);

    return JSON.stringify({
      sdp: answerSdpStr,
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
   * Change video quality mid-call by adjusting sender encoding parameters.
   * Takes effect immediately — no renegotiation needed.
   */
  async setVideoQuality(quality: VideoQuality): Promise<void> {
    this._videoQuality = quality;
    if (!this.pc) return;

    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (!sender) return;

    const preset = quality !== 'auto' ? VIDEO_QUALITY_PRESETS[quality] : null;
    const params = sender.getParameters();

    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    if (preset) {
      params.encodings[0].maxBitrate = preset.maxBitrate * 1000; // kbps → bps
      params.encodings[0].maxFramerate = preset.frameRate;
    } else {
      // Auto: remove constraints
      delete params.encodings[0].maxBitrate;
      delete params.encodings[0].maxFramerate;
    }

    await sender.setParameters(params);
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
   * Set audio quality preference. Applies on next call (SDP munging for codec).
   */
  setAudioQuality(quality: AudioQuality): void {
    this._audioQuality = quality;
  }

  /**
   * Get the current Opus configuration.
   */
  get opusConfig(): OpusConfig {
    return this._opusConfig;
  }

  /**
   * Set granular Opus configuration. Applies on next call via SDP munging.
   */
  setOpusConfig(config: OpusConfig): void {
    this._opusConfig = { ...config };
  }

  /**
   * Munge SDP to set Opus parameters (maxaveragebitrate, stereo, useinbandfec, usedtx, maxplaybackrate).
   * This modifies the fmtp line for the Opus codec in the SDP.
   */
  private mungeOpusSdp(sdp: string, config: OpusConfig): string {
    const lines = sdp.split('\r\n');
    const result: string[] = [];

    // Find the Opus payload type from rtpmap
    let opusPayloadType: string | null = null;
    for (const line of lines) {
      const match = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i);
      if (match) {
        opusPayloadType = match[1];
        break;
      }
    }

    if (!opusPayloadType) {
      // No Opus codec found in SDP, return unchanged
      return sdp;
    }

    // Build the Opus parameter string
    const maxPlaybackRate = config.application === 'voip' ? 24000 : 48000;
    const stereo = config.application === 'audio' ? 1 : 0;
    const opusParams = [
      `maxaveragebitrate=${config.bitrate * 1000}`,
      `stereo=${stereo}`,
      `sprop-stereo=${stereo}`,
      `useinbandfec=${config.fec ? 1 : 0}`,
      `usedtx=${config.dtx ? 1 : 0}`,
      `maxplaybackrate=${maxPlaybackRate}`,
    ].join(';');

    let foundFmtp = false;
    for (const line of lines) {
      if (line.startsWith(`a=fmtp:${opusPayloadType} `)) {
        // Replace existing fmtp line, preserving any non-opus params
        const existingParams = line.substring(line.indexOf(' ') + 1);
        // Filter out params we're setting, keep others
        const keepParams = existingParams
          .split(';')
          .filter((p) => {
            const key = p.split('=')[0].trim();
            return !['maxaveragebitrate', 'stereo', 'sprop-stereo', 'useinbandfec', 'usedtx', 'maxplaybackrate'].includes(key);
          })
          .filter((p) => p.trim().length > 0);

        const allParams = [...keepParams, ...opusParams.split(';')].join(';');
        result.push(`a=fmtp:${opusPayloadType} ${allParams}`);
        foundFmtp = true;
      } else {
        result.push(line);
      }
    }

    // If no existing fmtp line for Opus, add one after the rtpmap line
    if (!foundFmtp) {
      const final: string[] = [];
      for (const line of result) {
        final.push(line);
        if (line.startsWith(`a=rtpmap:${opusPayloadType} `)) {
          final.push(`a=fmtp:${opusPayloadType} ${opusParams}`);
        }
      }
      return final.join('\r\n');
    }

    return result.join('\r\n');
  }

  /**
   * Switch to a different camera by device ID.
   * Replaces the video track on the sender without renegotiation.
   */
  async switchCamera(deviceId?: string): Promise<void> {
    if (!this.pc || !this.localStream) return;

    // If no deviceId provided, cycle to the next available camera
    let targetDeviceId = deviceId;
    if (!targetDeviceId) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      if (cameras.length <= 1) return; // No other camera

      const currentIdx = cameras.findIndex((c) => c.deviceId === this._currentVideoDeviceId);
      const nextIdx = (currentIdx + 1) % cameras.length;
      targetDeviceId = cameras[nextIdx].deviceId;
    }

    // Get a new video track from the target camera
    const preset = this._videoQuality !== 'auto'
      ? VIDEO_QUALITY_PRESETS[this._videoQuality]
      : null;

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: targetDeviceId },
        width: { ideal: preset?.width ?? 1280 },
        height: { ideal: preset?.height ?? 720 },
        frameRate: { ideal: preset?.frameRate ?? 30 },
      },
    });

    const newTrack = newStream.getVideoTracks()[0];
    if (!newTrack) return;

    // Re-check after async getUserMedia — pc or localStream may have been closed
    if (!this.pc || !this.localStream) {
      newTrack.stop();
      return;
    }

    // Replace the track on the sender
    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) {
      // Stop the old track
      const oldTrack = this.localStream.getVideoTracks()[0];
      if (oldTrack) {
        oldTrack.stop();
        this.localStream.removeTrack(oldTrack);
      }
      // Add new track to local stream and replace on sender
      this.localStream.addTrack(newTrack);
      await sender.replaceTrack(newTrack);
      this._currentVideoDeviceId = newTrack.getSettings().deviceId ?? null;
    } else {
      // No video sender found — stop the track we just acquired
      newTrack.stop();
    }
  }

  /**
   * Start sharing the screen. Adds the screen video track to the peer connection.
   */
  async startScreenShare(): Promise<MediaStream> {
    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    this.screenShareStream = screenShareStream;
    this._isScreenSharing = true;

    if (this.pc) {
      const videoTrack = screenShareStream.getVideoTracks()[0];
      if (videoTrack) {
        this.pc.addTrack(videoTrack, screenShareStream);
        videoTrack.onended = () => this.stopScreenShare();
      }
    }

    return screenShareStream;
  }

  /**
   * Stop sharing the screen and remove the track from the peer connection.
   */
  stopScreenShare(): void {
    if (!this.screenShareStream) return;

    for (const track of this.screenShareStream.getTracks()) {
      track.stop();
    }

    if (this.pc) {
      const screenVideoTrack = this.screenShareStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        const sender = this.pc.getSenders().find((s) => s.track === screenVideoTrack);
        if (sender) {
          this.pc.removeTrack(sender);
        }
      }
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
   * Get the current screen share stream, if any.
   */
  getScreenShareStream(): MediaStream | null {
    return this.screenShareStream;
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
      packetsLost: null,
      fractionLost: null,
      candidateType: null,
      localCandidateType: null,
      remoteCandidateType: null,
      availableOutgoingBitrate: null,
      audioLevel: null,
      framesDecoded: null,
      framesDropped: null,
      audioBitrate: null,
    };

    if (!this.pc) return result;

    try {
      const stats = await this.pc.getStats();
      const now = Date.now();
      let audioBytesSent = 0;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          result.frameRate = report.framesPerSecond ?? null;
          result.jitter = report.jitter ? report.jitter * 1000 : null;
          result.framesDecoded = report.framesDecoded ?? null;
          result.framesDropped = report.framesDropped ?? null;

          if (report.frameWidth && report.frameHeight) {
            result.resolution = {
              width: report.frameWidth,
              height: report.frameHeight,
            };
          }

          // Calculate packet loss
          if (report.packetsLost != null && report.packetsReceived != null) {
            result.packetsLost = report.packetsLost;
            const total = report.packetsLost + report.packetsReceived;
            result.packetLoss = total > 0 ? (report.packetsLost / total) * 100 : 0;
          }
        }

        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          // Audio jitter (use audio jitter if no video jitter)
          if (result.jitter == null && report.jitter) {
            result.jitter = report.jitter * 1000;
          }
          result.audioLevel = report.audioLevel ?? null;
          // Audio packet loss
          if (report.packetsLost != null && report.packetsReceived != null) {
            if (result.packetsLost == null) {
              result.packetsLost = report.packetsLost;
              const total = report.packetsLost + report.packetsReceived;
              result.packetLoss = total > 0 ? (report.packetsLost / total) * 100 : 0;
            }
          }
        }

        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          // Calculate video bitrate
          if (report.bytesSent != null && this.lastBytesSent > 0) {
            const elapsed = (now - this.lastStatsTimestamp) / 1000;
            if (elapsed > 0) {
              result.bitrate = Math.round(((report.bytesSent - this.lastBytesSent) * 8) / elapsed / 1000);
            }
          }
          this.lastBytesSent = report.bytesSent ?? 0;
        }

        if (report.type === 'outbound-rtp' && report.kind === 'audio') {
          audioBytesSent = report.bytesSent ?? 0;
        }

        if (report.type === 'remote-inbound-rtp') {
          // roundTripTime and fractionLost from remote peer report
          if (report.roundTripTime != null) {
            result.roundTripTime = report.roundTripTime * 1000;
          }
          if (report.fractionLost != null) {
            result.fractionLost = report.fractionLost;
          }
        }

        if (report.type === 'codec') {
          result.codec = report.mimeType ?? null;
        }

        if (report.type === 'candidate-pair' && report.nominated) {
          result.roundTripTime = report.currentRoundTripTime
            ? report.currentRoundTripTime * 1000
            : result.roundTripTime;
          result.availableOutgoingBitrate = report.availableOutgoingBitrate
            ? Math.round(report.availableOutgoingBitrate / 1000)
            : null;

          // Resolve candidate types from the pair
          const localId = report.localCandidateId;
          const remoteId = report.remoteCandidateId;
          if (localId) {
            const localCandidate = stats.get(localId);
            if (localCandidate) {
              result.localCandidateType = localCandidate.candidateType ?? null;
              result.candidateType = localCandidate.candidateType ?? null;
            }
          }
          if (remoteId) {
            const remoteCandidate = stats.get(remoteId);
            if (remoteCandidate) {
              result.remoteCandidateType = remoteCandidate.candidateType ?? null;
            }
          }
        }
      });

      // Calculate audio bitrate from the last sample
      if (audioBytesSent > 0 && (this as any)._lastAudioBytesSent > 0) {
        const elapsed = (now - this.lastStatsTimestamp) / 1000;
        if (elapsed > 0) {
          result.audioBitrate = Math.round(((audioBytesSent - (this as any)._lastAudioBytesSent) * 8) / elapsed / 1000);
        }
      }
      (this as any)._lastAudioBytesSent = audioBytesSent;

      this.lastStatsTimestamp = now;
    } catch {
      // Stats collection failed — return defaults
    }

    return result;
  }

  /**
   * Set up frame-level E2EE on all senders and receivers of a peer connection
   * using RTCRtpScriptTransform. This encrypts/decrypts individual media frames
   * with AES-256-GCM inside a dedicated Web Worker.
   *
   * No-op if the browser does not support RTCRtpScriptTransform.
   */
  private async setupMediaE2EE(pc: RTCPeerConnection, sharedKeyBytes: Uint8Array): Promise<void> {
    // Feature detection — RTCRtpScriptTransform is not available in all browsers
    if (typeof (globalThis as any).RTCRtpScriptTransform === 'undefined') return;

    // Create the E2EE worker via Blob URL (Metro doesn't support import.meta.url)
    const worker = createE2EEWorker();
    this.e2eeWorker = worker;

    // Derive AES-256-GCM CryptoKey from the shared key bytes
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      sharedKeyBytes.buffer as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );

    // Send the key to the worker
    worker.postMessage({ type: 'setKey', key: cryptoKey });

    // Apply transforms to all senders (outgoing frames)
    const ScriptTransform = (globalThis as any).RTCRtpScriptTransform;
    for (const sender of pc.getSenders()) {
      if (sender.track) {
        (sender as any).transform = new ScriptTransform(worker, { direction: 'send' });
      }
    }

    // Apply transforms to all receivers (incoming frames)
    for (const receiver of pc.getReceivers()) {
      (receiver as any).transform = new ScriptTransform(worker, { direction: 'receive' });
    }
  }

  /**
   * Derive a 32-byte AES-256 key from our identity, the peer's public key, and an
   * optional call ID. Uses SHA-256 over the concatenation as a simplified KDF.
   *
   * In production this should use ECDH key agreement + HKDF, but this simplified
   * approach works for an initial implementation.
   *
   * @param peerPublicKeyHex - The remote peer's public key in hex encoding
   * @param ourIdentityBytes - Our local identity/public key bytes
   * @param callId - Optional call identifier for domain separation
   * @returns 32-byte Uint8Array suitable for AES-256-GCM
   */
  async deriveMediaKey(
    peerPublicKeyHex: string,
    ourIdentityBytes: Uint8Array,
    callId?: string,
  ): Promise<Uint8Array> {
    // Decode the peer's hex public key to bytes
    const peerKeyBytes = new Uint8Array(
      (peerPublicKeyHex.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16)),
    );

    // Build the input: our identity || peer key || call ID (if provided)
    const callIdBytes = callId ? new TextEncoder().encode(callId) : new Uint8Array(0);
    const combined = new Uint8Array(
      ourIdentityBytes.length + peerKeyBytes.length + callIdBytes.length,
    );
    combined.set(ourIdentityBytes, 0);
    combined.set(peerKeyBytes, ourIdentityBytes.length);
    combined.set(callIdBytes, ourIdentityBytes.length + peerKeyBytes.length);

    // SHA-256 produces 32 bytes — perfect for AES-256
    const hash = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hash);
  }

  // ── Static Connectivity Tests ─────────────────────────────────────────────

  /**
   * Test TURN server connectivity by creating a temporary peer connection
   * and gathering ICE candidates. Returns success if a relay candidate is found.
   */
  static async testTurnConnectivity(
    turnUrl: string,
    username: string,
    credential: string,
  ): Promise<TurnTestResult> {
    const startTime = Date.now();
    let pc: RTCPeerConnection | null = null;

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: turnUrl, username, credential }],
        iceTransportPolicy: 'relay', // Force relay candidates only
      });

      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('turn-test');

      const result = await new Promise<TurnTestResult>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, rtt: 0, candidateType: '', error: 'Timeout (10s)' });
        }, 10_000);

        pc!.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateStr = event.candidate.candidate;
            if (candidateStr.includes('relay') || candidateStr.includes('typ relay')) {
              clearTimeout(timeout);
              resolve({
                success: true,
                rtt: Date.now() - startTime,
                candidateType: 'relay',
              });
            }
          }
        };

        // Start gathering
        pc!.createOffer().then((offer) => pc!.setLocalDescription(offer));
      });

      return result;
    } catch (err) {
      return { success: false, rtt: 0, candidateType: '', error: String(err) };
    } finally {
      if (pc) pc.close();
    }
  }

  /**
   * Test STUN server connectivity by gathering ICE candidates and
   * extracting the server-reflexive (srflx) candidate's public IP.
   */
  static async testStunConnectivity(stunUrl: string): Promise<StunTestResult> {
    const startTime = Date.now();
    let pc: RTCPeerConnection | null = null;

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: stunUrl }],
      });

      pc.createDataChannel('stun-test');

      const result = await new Promise<StunTestResult>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, publicIp: '', rtt: 0, error: 'Timeout (10s)' });
        }, 10_000);

        pc!.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateStr = event.candidate.candidate;
            if (candidateStr.includes('srflx') || candidateStr.includes('typ srflx')) {
              clearTimeout(timeout);
              // Extract IP from candidate string: "... <ip> <port> typ srflx ..."
              const parts = candidateStr.split(' ');
              const ipIndex = parts.indexOf('srflx') - 2;
              const publicIp = ipIndex >= 0 ? parts[ipIndex] : '';
              resolve({
                success: true,
                publicIp,
                rtt: Date.now() - startTime,
              });
            }
          }
        };

        pc!.createOffer().then((offer) => pc!.setLocalDescription(offer));
      });

      return result;
    } catch (err) {
      return { success: false, publicIp: '', rtt: 0, error: String(err) };
    } finally {
      if (pc) pc.close();
    }
  }

  /**
   * Close the peer connection and release all media tracks.
   */
  close(): void {
    this.stopStats();

    // Terminate the E2EE worker if it exists
    if (this.e2eeWorker) {
      this.e2eeWorker.terminate();
      this.e2eeWorker = null;
    }

    if (this.screenShareStream) {
      for (const track of this.screenShareStream.getTracks()) {
        track.stop();
      }
      this.screenShareStream = null;
    }
    this._isScreenSharing = false;

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
