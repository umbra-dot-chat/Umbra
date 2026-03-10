/**
 * CallHandler — manages WebRTC voice/video calls for Ghost AI.
 *
 * Ghost answers incoming calls, streams audio/video media on loop,
 * supports upgrade/downgrade, data channel metadata, and chat commands.
 */

import { readFileSync } from 'fs';
import { AudioSource, resolveFfmpegPath } from '../media/audio-source.js';
import { VideoSource, parseResolution } from '../media/video-source.js';
import { MediaManager, type MediaFile } from '../media/manager.js';
import { encryptMessage, uuid, type GhostIdentity } from '../crypto.js';
import type { RelayClient } from '../relay.js';
import type { ContextStore, StoredFriend } from '../context/store.js';
import type { GhostConfig, IceServer, Logger } from '../config.js';

// ── Call signaling types ─────────────────────────────────────────────────────

interface CallOfferPayload {
  callId: string;
  sdp: string;
  type: 'offer';
  callType: 'voice' | 'video';
  callerDid: string;
  conversationId: string;
}

interface CallAnswerPayload {
  callId: string;
  sdp: string;
  type: 'answer';
}

interface CallIceCandidatePayload {
  callId: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

interface CallEndPayload {
  callId: string;
  reason: string;
}

interface CallStatePayload {
  callId: string;
  state: string;
}

// ── Active call state ────────────────────────────────────────────────────────

interface ActiveCall {
  callId: string;
  peerDid: string;
  conversationId: string;
  callType: 'voice' | 'video';
  peer: any; // RTCPeerConnection
  dataChannel: any; // RTCDataChannel
  audioSource: AudioSource | null;
  videoSource: VideoSource | null;
  videoSender: any | null; // RTCRtpSender
  startedAt: number;
  statsInterval: ReturnType<typeof setInterval> | null;
  metadataInterval: ReturnType<typeof setInterval> | null;
  stats: CallStats;
}

interface CallStats {
  audioBitrate: number;
  videoBitrate: number;
  packetLoss: number;
  jitter: number;
  roundTripTime: number;
  bytesSent: number;
  bytesReceived: number;
  lastStatsAt: number;
  prevBytesSent: number;
}

export interface ActiveCallInfo {
  callId: string;
  peerDid: string;
  callType: 'voice' | 'video';
  duration: number;
  audioTrack: string | null;
  videoTrack: string | null;
  stats: CallStats;
}

// ── CallHandler ──────────────────────────────────────────────────────────────

export class CallHandler {
  private config: GhostConfig;
  private identity: GhostIdentity;
  private relay: RelayClient;
  private store: ContextStore;
  private log: Logger;
  private mediaManager: MediaManager;

  private wrtc: any = null;
  private ffmpegPath: string;
  private activeCalls = new Map<string, ActiveCall>();

  constructor(
    config: GhostConfig,
    identity: GhostIdentity,
    relay: RelayClient,
    store: ContextStore,
    mediaManager: MediaManager,
    log: Logger,
  ) {
    this.config = config;
    this.identity = identity;
    this.relay = relay;
    this.store = store;
    this.mediaManager = mediaManager;
    this.log = log;
    this.ffmpegPath = resolveFfmpegPath();
  }

  /** Load the wrtc module. Returns false if unavailable. */
  async initialize(): Promise<boolean> {
    try {
      this.wrtc = await (import('@roamhq/wrtc' as string) as Promise<any>);
      this.log.info('[CALL] WebRTC module loaded (@roamhq/wrtc)');
      return true;
    } catch (err) {
      this.log.error('[CALL] Failed to load @roamhq/wrtc — calls disabled:', err);
      return false;
    }
  }

  get enabled(): boolean {
    return this.wrtc !== null;
  }

  // ── Signaling handlers ────────────────────────────────────────────────────

  async handleCallOffer(payload: CallOfferPayload): Promise<void> {
    const { callId, callerDid, callType } = payload;
    this.log.info(`[CALL] Incoming ${callType} call: ${callId} from ${callerDid.slice(0, 24)}...`);

    const friend = this.store.getFriend(callerDid);
    if (!friend) {
      this.log.warn(`[CALL] Rejecting call from unknown DID: ${callerDid.slice(0, 24)}...`);
      this.sendCallEnd(callerDid, callId, 'rejected');
      return;
    }

    // Send ringing state
    this.sendCallState(callerDid, callId, 'ringing');
    this.sendChatNotification(friend, `📞 Incoming ${callType} call...`);

    // Fake ring delay
    await new Promise((r) => setTimeout(r, this.config.callRingDelayMs));

    // Create and answer the call
    try {
      await this.createCallFromOffer(payload, friend);
      this.sendChatNotification(friend, `✅ Call connected! Use /ghost help for call commands.`);
    } catch (err) {
      this.log.error(`[CALL] Failed to answer call ${callId}:`, err);
      this.sendCallEnd(callerDid, callId, 'error');
      this.sendChatNotification(friend, `❌ Failed to connect call.`);
    }
  }

  handleCallIceCandidate(payload: CallIceCandidatePayload): void {
    const call = this.activeCalls.get(payload.callId);
    if (!call) return;

    try {
      call.peer.addIceCandidate(new this.wrtc.RTCIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex,
      }));
    } catch (err) {
      this.log.debug(`[CALL] ICE candidate error:`, err);
    }
  }

  handleCallEnd(payload: CallEndPayload): void {
    const call = this.activeCalls.get(payload.callId);
    if (!call) return;

    this.log.info(`[CALL] Call ended: ${payload.callId} (${payload.reason})`);
    this.cleanupCall(call);

    const friend = this.store.getFriend(call.peerDid);
    if (friend) {
      this.sendChatNotification(friend, `📞 Call ended (${payload.reason}).`);
    }
  }

  handleCallState(payload: CallStatePayload): void {
    this.log.debug(`[CALL] Remote state: ${payload.callId} → ${payload.state}`);
  }

  // ── Call creation ─────────────────────────────────────────────────────────

  private async createCallFromOffer(offer: CallOfferPayload, friend: StoredFriend): Promise<void> {
    const { RTCPeerConnection, nonstandard } = this.wrtc;
    const { RTCAudioSource, RTCVideoSource } = nonstandard;

    const peer = new RTCPeerConnection({
      iceServers: this.config.iceServers.map((s: IceServer) => ({
        urls: s.urls,
        username: s.username,
        credential: s.credential,
      })),
    });

    const call: ActiveCall = {
      callId: offer.callId,
      peerDid: offer.callerDid,
      conversationId: offer.conversationId,
      callType: offer.callType,
      peer,
      dataChannel: null,
      audioSource: null,
      videoSource: null,
      videoSender: null,
      startedAt: Date.now(),
      statsInterval: null,
      metadataInterval: null,
      stats: {
        audioBitrate: 0, videoBitrate: 0, packetLoss: 0, jitter: 0,
        roundTripTime: 0, bytesSent: 0, bytesReceived: 0,
        lastStatsAt: Date.now(), prevBytesSent: 0,
      },
    };

    this.activeCalls.set(offer.callId, call);

    // ICE candidate forwarding
    peer.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.relay.sendEnvelope(friend.did, {
          envelope: 'call_ice_candidate',
          version: 1,
          payload: {
            callId: offer.callId,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    peer.onconnectionstatechange = () => {
      this.log.debug(`[CALL] Connection state: ${peer.connectionState}`);
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        this.log.warn(`[CALL] Connection ${peer.connectionState} for ${offer.callId}`);
        this.cleanupCall(call);
      }
    };

    // Create audio track
    const audioSrc = new RTCAudioSource();
    const audioTrack = audioSrc.createTrack();
    call.audioSource = new AudioSource(audioSrc, this.ffmpegPath, this.log);

    peer.addTrack(audioTrack);

    // Start playing first available audio
    const firstAudio = this.mediaManager.getAudioTrack();
    if (firstAudio) {
      call.audioSource.start(firstAudio.path, {
        loop: true,
        onTrackEnded: () => {
          const next = this.mediaManager.getNextAudioTrack();
          if (next && call.audioSource) call.audioSource.switchTrack(next.path);
        },
      });
    }

    // Create video track if video call
    if (offer.callType === 'video') {
      this.createVideoTrack(call);
    }

    // Create data channel
    call.dataChannel = peer.createDataChannel('ghost-metadata', { ordered: true });
    call.dataChannel.onopen = () => {
      this.log.debug(`[CALL] Data channel opened for ${offer.callId}`);
    };

    // Set remote offer and create answer
    await peer.setRemoteDescription(new this.wrtc.RTCSessionDescription({
      type: 'offer',
      sdp: offer.sdp,
    }));

    const answer = await peer.createAnswer();

    // Prefer high quality codecs
    answer.sdp = this.preferHighQualityCodecs(answer.sdp);

    await peer.setLocalDescription(answer);

    // Send answer
    this.relay.sendEnvelope(friend.did, {
      envelope: 'call_answer',
      version: 1,
      payload: {
        callId: offer.callId,
        sdp: peer.localDescription.sdp,
        type: 'answer',
      },
    });

    this.sendCallState(friend.did, offer.callId, 'connected');

    // Start stats and metadata
    this.startStatsCollection(call);
    this.startMetadataBroadcast(call);

    this.log.info(`[CALL] Answered ${offer.callType} call: ${offer.callId}`);
  }

  private createVideoTrack(call: ActiveCall): void {
    const { nonstandard } = this.wrtc;
    const { RTCVideoSource } = nonstandard;

    const videoSrc = new RTCVideoSource();
    const videoTrack = videoSrc.createTrack();
    call.videoSource = new VideoSource(videoSrc, this.ffmpegPath, this.log);

    call.videoSender = call.peer.addTrack(videoTrack);

    const firstVideo = this.mediaManager.getVideoFile();
    if (firstVideo) {
      const res = firstVideo.resolution ? parseResolution(firstVideo.resolution) : null;
      call.videoSource.start(firstVideo.path, {
        width: res?.width ?? 1920,
        height: res?.height ?? 1080,
        fps: 30,
        loop: true,
        onTrackEnded: () => {
          const next = this.mediaManager.getNextVideoFile();
          if (next && call.videoSource) {
            const nextRes = next.resolution ? parseResolution(next.resolution) : null;
            call.videoSource.switchVideo(next.path, {
              width: nextRes?.width,
              height: nextRes?.height,
            });
          }
        },
      });
    }
  }

  // ── Call upgrade/downgrade ────────────────────────────────────────────────

  private async addVideoToCall(call: ActiveCall): Promise<string> {
    if (call.videoSource) return 'Video is already active.';
    if (!this.wrtc) return 'WebRTC not available.';

    this.createVideoTrack(call);
    call.callType = 'video';

    // Renegotiate
    const offer = await call.peer.createOffer();
    await call.peer.setLocalDescription(offer);

    const friend = this.store.getFriend(call.peerDid);
    if (friend) {
      this.relay.sendEnvelope(friend.did, {
        envelope: 'call_offer',
        version: 1,
        payload: {
          callId: call.callId,
          sdp: call.peer.localDescription.sdp,
          type: 'offer',
          callType: 'video',
          callerDid: this.identity.did,
          conversationId: call.conversationId,
        },
      });
    }

    return '📹 Video added to call. Streaming video content.';
  }

  private removeVideoFromCall(call: ActiveCall): string {
    if (!call.videoSource) return 'Video is not active.';

    call.videoSource.stop();
    call.videoSource = null;

    if (call.videoSender) {
      try {
        call.peer.removeTrack(call.videoSender);
      } catch {
        // May fail if already removed
      }
      call.videoSender = null;
    }

    call.callType = 'voice';
    return '🔊 Video removed. Audio-only call.';
  }

  // ── SDP manipulation ──────────────────────────────────────────────────────

  private preferHighQualityCodecs(sdp: string): string {
    // Boost Opus maxaveragebitrate for highest quality audio
    if (sdp.includes('opus/48000')) {
      sdp = sdp.replace(
        /(a=fmtp:\d+ .*?)([\r\n])/g,
        (match, fmtp, nl) => {
          if (fmtp.includes('opus') || !fmtp.includes('maxaveragebitrate')) {
            return `${fmtp};maxaveragebitrate=128000;stereo=1;sprop-stereo=1${nl}`;
          }
          return match;
        },
      );
    }
    return sdp;
  }

  // ── Stats collection ──────────────────────────────────────────────────────

  private startStatsCollection(call: ActiveCall): void {
    call.statsInterval = setInterval(async () => {
      try {
        const stats = await call.peer.getStats();
        let totalBytesSent = 0;
        let totalBytesReceived = 0;

        stats.forEach((report: any) => {
          if (report.type === 'outbound-rtp') {
            totalBytesSent += report.bytesSent || 0;
            if (report.kind === 'audio') {
              call.stats.jitter = report.jitter || 0;
            }
          }
          if (report.type === 'inbound-rtp') {
            totalBytesReceived += report.bytesReceived || 0;
            call.stats.packetLoss = report.packetsLost || 0;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            call.stats.roundTripTime = report.currentRoundTripTime || 0;
          }
        });

        const now = Date.now();
        const elapsed = (now - call.stats.lastStatsAt) / 1000;
        if (elapsed > 0) {
          const bitrate = ((totalBytesSent - call.stats.prevBytesSent) * 8) / elapsed;
          call.stats.audioBitrate = Math.round(bitrate);
        }
        call.stats.prevBytesSent = totalBytesSent;
        call.stats.bytesSent = totalBytesSent;
        call.stats.bytesReceived = totalBytesReceived;
        call.stats.lastStatsAt = now;
      } catch {
        // Stats may fail during teardown
      }
    }, this.config.callStatsIntervalMs);
  }

  // ── Metadata broadcasting ─────────────────────────────────────────────────

  private startMetadataBroadcast(call: ActiveCall): void {
    call.metadataInterval = setInterval(() => {
      if (!call.dataChannel || call.dataChannel.readyState !== 'open') return;

      try {
        const metadata = {
          type: 'ghost-metadata',
          callId: call.callId,
          callType: call.callType,
          uptime: Math.round((Date.now() - call.startedAt) / 1000),
          audio: call.audioSource ? {
            playing: call.audioSource.isPlaying,
            file: call.audioSource.currentFile,
          } : null,
          video: call.videoSource ? {
            playing: call.videoSource.isPlaying,
            file: call.videoSource.currentFile,
          } : null,
          stats: {
            bitrate: call.stats.audioBitrate,
            packetLoss: call.stats.packetLoss,
            rtt: call.stats.roundTripTime,
          },
        };
        call.dataChannel.send(JSON.stringify(metadata));
      } catch {
        // Ignore send errors
      }
    }, this.config.metadataBroadcastMs);
  }

  // ── Chat commands ─────────────────────────────────────────────────────────

  async handleCommand(command: string, args: string[], senderDid: string): Promise<string> {
    const cmd = command.toLowerCase();

    switch (cmd) {
      case 'status':
        return this.cmdStatus();

      case 'tracks':
        return this.cmdListTracks();

      case 'play': {
        const id = args[0];
        if (!id) return 'Usage: /ghost play <track-id>';
        return this.cmdPlayTrack(id, senderDid);
      }

      case 'next':
        return this.cmdNextTrack(senderDid);

      case 'pause':
        return this.cmdPause(senderDid);

      case 'resume':
        return this.cmdResume(senderDid);

      case 'videos':
        return this.cmdListVideos();

      case 'play-video': {
        const id = args[0];
        if (!id) return 'Usage: /ghost play-video <video-id>';
        return this.cmdPlayVideo(id, senderDid);
      }

      case 'next-video':
        return this.cmdNextVideo(senderDid);

      case 'upgrade':
        return this.cmdUpgrade(senderDid);

      case 'downgrade':
        return this.cmdDowngrade(senderDid);

      case 'end':
        return this.cmdEndCall(senderDid);

      case 'files':
        return this.cmdListFiles(args[0]);

      case 'send': {
        const query = args.join(' ');
        if (!query) return 'Usage: /ghost send <file-id or name>';
        return this.cmdSendFile(query, senderDid);
      }

      case 'help':
        return this.cmdHelp();

      default:
        return `Unknown command: ${cmd}. Use /ghost help for available commands.`;
    }
  }

  private cmdStatus(): string {
    if (this.activeCalls.size === 0) return '📞 No active calls.';

    const lines: string[] = ['📞 Active calls:'];
    for (const [id, call] of this.activeCalls) {
      const duration = Math.round((Date.now() - call.startedAt) / 1000);
      const friend = this.store.getFriend(call.peerDid);
      lines.push(`  ${call.callType.toUpperCase()} with ${friend?.displayName ?? call.peerDid.slice(0, 16)} — ${duration}s`);
      lines.push(`    Audio: ${call.audioSource?.currentFile ?? 'none'} (${call.audioSource?.isPlaying ? 'playing' : 'paused'})`);
      if (call.videoSource) {
        lines.push(`    Video: ${call.videoSource.currentFile ?? 'none'} (${call.videoSource.isPlaying ? 'playing' : 'paused'})`);
      }
      lines.push(`    Bitrate: ${call.stats.audioBitrate}bps | RTT: ${(call.stats.roundTripTime * 1000).toFixed(0)}ms`);
    }
    return lines.join('\n');
  }

  private cmdListTracks(): string {
    const tracks = this.mediaManager.getAudioTracks();
    if (tracks.length === 0) return '🎵 No audio tracks available.';
    const lines = ['🎵 Available audio tracks:'];
    for (const t of tracks) {
      lines.push(`  ${t.id} — ${t.name} (${t.format})`);
    }
    lines.push('\nUse: /ghost play <track-id>');
    return lines.join('\n');
  }

  private cmdPlayTrack(id: string, senderDid: string): string {
    const track = this.mediaManager.getAudioTrack(id);
    if (!track) return `Track not found: ${id}. Use /ghost tracks to list available.`;

    const call = this.findCallForPeer(senderDid);
    if (!call?.audioSource) return 'No active call with audio.';

    call.audioSource.switchTrack(track.path);
    return `🎵 Now playing: ${track.name}`;
  }

  private cmdNextTrack(senderDid: string): string {
    const next = this.mediaManager.getNextAudioTrack();
    if (!next) return 'No more audio tracks.';

    const call = this.findCallForPeer(senderDid);
    if (!call?.audioSource) return 'No active call with audio.';

    call.audioSource.switchTrack(next.path);
    return `🎵 Now playing: ${next.name}`;
  }

  private cmdPause(senderDid: string): string {
    const call = this.findCallForPeer(senderDid);
    if (!call) return 'No active call.';
    call.audioSource?.pause();
    call.videoSource?.pause();
    return '⏸️ Paused.';
  }

  private cmdResume(senderDid: string): string {
    const call = this.findCallForPeer(senderDid);
    if (!call) return 'No active call.';
    call.audioSource?.resume();
    call.videoSource?.resume();
    return '▶️ Resumed.';
  }

  private cmdListVideos(): string {
    const videos = this.mediaManager.getVideoFiles();
    if (videos.length === 0) return '📹 No video files available.';
    const lines = ['📹 Available videos:'];
    for (const v of videos) {
      lines.push(`  ${v.id} — ${v.name} (${v.resolution ?? '?'})`);
    }
    lines.push('\nUse: /ghost play-video <video-id>');
    return lines.join('\n');
  }

  private cmdPlayVideo(id: string, senderDid: string): string {
    const video = this.mediaManager.getVideoFile(id);
    if (!video) return `Video not found: ${id}. Use /ghost videos to list available.`;

    const call = this.findCallForPeer(senderDid);
    if (!call?.videoSource) return 'No active video call.';

    const res = video.resolution ? parseResolution(video.resolution) : null;
    call.videoSource.switchVideo(video.path, {
      width: res?.width,
      height: res?.height,
    });
    return `📹 Now playing: ${video.name}`;
  }

  private cmdNextVideo(senderDid: string): string {
    const next = this.mediaManager.getNextVideoFile();
    if (!next) return 'No more video files.';

    const call = this.findCallForPeer(senderDid);
    if (!call?.videoSource) return 'No active video call.';

    const res = next.resolution ? parseResolution(next.resolution) : null;
    call.videoSource.switchVideo(next.path, {
      width: res?.width,
      height: res?.height,
    });
    return `📹 Now playing: ${next.name}`;
  }

  private async cmdUpgrade(senderDid: string): Promise<string> {
    const call = this.findCallForPeer(senderDid);
    if (!call) return 'No active call.';
    return this.addVideoToCall(call);
  }

  private cmdDowngrade(senderDid: string): string {
    const call = this.findCallForPeer(senderDid);
    if (!call) return 'No active call.';
    return this.removeVideoFromCall(call);
  }

  private cmdEndCall(senderDid: string): string {
    const call = this.findCallForPeer(senderDid);
    if (!call) return 'No active call.';

    this.sendCallEnd(call.peerDid, call.callId, 'ended');
    this.cleanupCall(call);
    return '📞 Call ended.';
  }

  private cmdListFiles(category?: string): string {
    const files = this.mediaManager.listFiles(category);
    if (files.length === 0) return '📁 No files available.';
    const lines = ['📁 Available files:'];
    for (const f of files) {
      lines.push(`  ${f.id} — ${f.name} (${f.format}, ${f.category ?? 'general'})`);
    }
    lines.push('\nUse: /ghost send <file-id>');
    return lines.join('\n');
  }

  private cmdSendFile(query: string, senderDid: string): string {
    const file = this.mediaManager.getFile(query);
    if (!file) return `File not found: ${query}. Use /ghost files to list available.`;

    const friend = this.store.getFriend(senderDid);
    if (!friend) return 'Unknown sender.';

    // Read file and send via relay as base64
    try {
      const data = readFileSync(file.path);
      const base64 = data.toString('base64');

      // Send file via relay envelope
      const messageId = uuid();
      const timestamp = Date.now();

      const filePayload = JSON.stringify({
        type: 'file',
        filename: `${file.id}.${file.format}`,
        mimeType: getMimeType(file.format),
        size: data.length,
        data: base64,
      });

      const { ciphertext, nonce } = encryptMessage(
        filePayload,
        this.identity.encryptionPrivateKey,
        friend.encryptionKey,
        this.identity.did,
        friend.did,
        timestamp,
        friend.conversationId,
      );

      this.relay.sendEnvelope(friend.did, {
        envelope: 'chat_message',
        version: 1,
        payload: {
          messageId,
          conversationId: friend.conversationId,
          senderDid: this.identity.did,
          contentEncrypted: ciphertext,
          nonce,
          timestamp,
          attachments: [{
            filename: `${file.id}.${file.format}`,
            mimeType: getMimeType(file.format),
            size: data.length,
          }],
        },
      });

      this.store.saveMessage({
        id: messageId,
        conversationId: friend.conversationId,
        role: 'assistant',
        content: `[File: ${file.name}]`,
        timestamp,
      });

      return `📎 Sent: ${file.name} (${(data.length / 1024).toFixed(1)}KB)`;
    } catch (err) {
      this.log.error(`[CALL] Failed to send file ${file.id}:`, err);
      return `Failed to send file: ${file.name}`;
    }
  }

  private cmdHelp(): string {
    return [
      '🤖 Ghost Call Commands:',
      '',
      '📞 Call Control:',
      '  /ghost status — Show active calls',
      '  /ghost end — End current call',
      '  /ghost upgrade — Add video to voice call',
      '  /ghost downgrade — Remove video from call',
      '',
      '🎵 Audio:',
      '  /ghost tracks — List audio tracks',
      '  /ghost play <id> — Play specific track',
      '  /ghost next — Next audio track',
      '  /ghost pause — Pause playback',
      '  /ghost resume — Resume playback',
      '',
      '📹 Video:',
      '  /ghost videos — List video files',
      '  /ghost play-video <id> — Play specific video',
      '  /ghost next-video — Next video',
      '',
      '📁 Files:',
      '  /ghost files [category] — List files',
      '  /ghost send <id|name> — Send a file',
    ].join('\n');
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private findCallForPeer(peerDid: string): ActiveCall | undefined {
    for (const call of this.activeCalls.values()) {
      if (call.peerDid === peerDid) return call;
    }
    return undefined;
  }

  private sendCallState(toDid: string, callId: string, state: string): void {
    this.relay.sendEnvelope(toDid, {
      envelope: 'call_state',
      version: 1,
      payload: { callId, state },
    });
  }

  private sendCallEnd(toDid: string, callId: string, reason: string): void {
    this.relay.sendEnvelope(toDid, {
      envelope: 'call_end',
      version: 1,
      payload: { callId, reason },
    });
  }

  private sendChatNotification(friend: StoredFriend, text: string): void {
    const messageId = uuid();
    const timestamp = Date.now();

    const { ciphertext, nonce } = encryptMessage(
      text,
      this.identity.encryptionPrivateKey,
      friend.encryptionKey,
      this.identity.did,
      friend.did,
      timestamp,
      friend.conversationId,
    );

    this.relay.sendEnvelope(friend.did, {
      envelope: 'chat_message',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        contentEncrypted: ciphertext,
        nonce,
        timestamp,
      },
    });

    this.store.saveMessage({
      id: messageId,
      conversationId: friend.conversationId,
      role: 'assistant',
      content: text,
      timestamp,
    });
  }

  private cleanupCall(call: ActiveCall): void {
    call.audioSource?.stop();
    call.videoSource?.stop();

    if (call.statsInterval) clearInterval(call.statsInterval);
    if (call.metadataInterval) clearInterval(call.metadataInterval);

    try { call.peer.close(); } catch { /* ignore */ }

    this.activeCalls.delete(call.callId);
    this.log.info(`[CALL] Cleaned up call: ${call.callId}`);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  endAllCalls(): void {
    for (const call of this.activeCalls.values()) {
      this.sendCallEnd(call.peerDid, call.callId, 'shutdown');
      this.cleanupCall(call);
    }
  }

  getActiveCalls(): ActiveCallInfo[] {
    const result: ActiveCallInfo[] = [];
    for (const call of this.activeCalls.values()) {
      result.push({
        callId: call.callId,
        peerDid: call.peerDid,
        callType: call.callType,
        duration: Math.round((Date.now() - call.startedAt) / 1000),
        audioTrack: call.audioSource?.currentFile ?? null,
        videoTrack: call.videoSource?.currentFile ?? null,
        stats: { ...call.stats },
      });
    }
    return result;
  }

  getCallCount(): number {
    return this.activeCalls.size;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMimeType(format: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    txt: 'text/plain',
    json: 'application/json',
    pdf: 'application/pdf',
    zip: 'application/zip',
  };
  return types[format] ?? 'application/octet-stream';
}
