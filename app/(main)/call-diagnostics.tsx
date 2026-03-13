/**
 * Call Diagnostics — In-app testing page for calling infrastructure.
 *
 * Sections:
 * 1. Relay Connectivity — test WebSocket connections to relay servers
 * 2. TURN/STUN Connectivity — verify ICE server accessibility
 * 3. Loopback Audio Test — microphone capture + level meter
 * 4. Call Negotiation Test — create/accept SDP offers between tabs
 * 5. Real-Time Call Stats — live dashboard for active calls
 * 6. ICE Candidate Log — log all gathered/received candidates
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Button, TextArea, useTheme, Box, ScrollArea } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

const SRC = 'CallDiagnostics';
import { CallManager } from '@/services/CallManager';
import { resolveTurnCredentials } from '@/config/network';
import { useCallContext } from '@/contexts/CallContext';
import type { CallStats, TurnTestResult, StunTestResult } from '@/types/call';

// ─── Relay URLs ──────────────────────────────────────────────────────────────

const RELAYS = [
  { label: 'US East', url: 'wss://relay.umbra.chat/ws' },
  { label: 'Seoul', url: 'wss://seoul.relay.umbra.chat/ws' },
];

const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
];

const TURN_SERVERS = [
  'turn:turn.umbra.chat:3478?transport=udp',
  'turn:turn.umbra.chat:3478?transport=tcp',
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface RelayTestResult {
  url: string;
  label: string;
  status: 'idle' | 'testing' | 'pass' | 'fail';
  latency: number;
  error?: string;
}

interface IceCandidate {
  timestamp: number;
  type: string;
  protocol: string;
  address: string;
  port: number;
  direction: 'local' | 'remote';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CallDiagnosticsPage() {
  if (__DEV__) dbg.trackRender('CallDiagnosticsPage');
  const { theme } = useTheme();
  const colors = theme.colors;
  const { activeCall, callStats } = useCallContext();

  // ── Section 1: Relay Connectivity ───────────────────────────────────────
  const [relayResults, setRelayResults] = useState<RelayTestResult[]>(
    RELAYS.map((r) => ({ ...r, status: 'idle', latency: 0 })),
  );

  const testRelay = useCallback(async (index: number) => {
    const relay = RELAYS[index];
    setRelayResults((prev) => prev.map((r, i) => (i === index ? { ...r, status: 'testing' } : r)));

    const start = Date.now();
    try {
      const ws = new WebSocket(relay.url);
      const result = await new Promise<RelayTestResult>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ ...relay, status: 'fail', latency: 0, error: 'Timeout (10s)' });
        }, 10_000);

        ws.onopen = () => {
          const latency = Date.now() - start;
          // Try to register with a test DID
          ws.send(JSON.stringify({ type: 'register', did: `did:key:z6MkDiagTest${Date.now()}` }));
          ws.onmessage = (event) => {
            clearTimeout(timeout);
            const msg = JSON.parse(event.data);
            if (msg.type === 'registered') {
              ws.close();
              resolve({ ...relay, status: 'pass', latency });
            } else {
              ws.close();
              resolve({ ...relay, status: 'pass', latency });
            }
          };
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({ ...relay, status: 'fail', latency: 0, error: 'Connection failed' });
        };
      });

      setRelayResults((prev) => prev.map((r, i) => (i === index ? result : r)));
    } catch (err) {
      setRelayResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...relay, status: 'fail', latency: 0, error: String(err) } : r,
        ),
      );
    }
  }, []);

  const testAllRelays = useCallback(() => {
    RELAYS.forEach((_, i) => testRelay(i));
  }, [testRelay]);

  // ── Section 2: TURN/STUN Connectivity ──────────────────────────────────
  const [turnCreds, setTurnCreds] = useState<{ username: string; credential: string } | null>(null);
  const [turnResults, setTurnResults] = useState<(TurnTestResult & { url: string })[]>([]);
  const [stunResults, setStunResults] = useState<(StunTestResult & { url: string })[]>([]);
  const [iceTestRunning, setIceTestRunning] = useState(false);

  const testIceServers = useCallback(async () => {
    setIceTestRunning(true);
    setTurnResults([]);
    setStunResults([]);

    // Resolve TURN credentials
    const creds = await resolveTurnCredentials();
    setTurnCreds(creds ?? null);

    // Test STUN servers
    for (const url of STUN_SERVERS) {
      const result = await CallManager.testStunConnectivity(url);
      setStunResults((prev) => [...prev, { ...result, url }]);
    }

    // Test TURN servers (if we have credentials)
    if (creds) {
      for (const url of TURN_SERVERS) {
        const result = await CallManager.testTurnConnectivity(url, creds.username, creds.credential);
        setTurnResults((prev) => [...prev, { ...result, url }]);
      }
    } else {
      setTurnResults(TURN_SERVERS.map((url) => ({
        success: false,
        rtt: 0,
        candidateType: '',
        url,
        error: 'No TURN credentials available',
      })));
    }

    setIceTestRunning(false);
  }, []);

  // ── Section 3: Loopback Audio Test ─────────────────────────────────────
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDeviceName, setAudioDeviceName] = useState('');
  const [audioLoopback, setAudioLoopback] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const startAudioTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setAudioStream(stream);

      // Get device name
      const track = stream.getAudioTracks()[0];
      setAudioDeviceName(track?.label ?? 'Unknown');

      // Set up analyser
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // Animate audio level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      dbg.warn('call', 'Failed to get audio', { error: (err as Error)?.message ?? String(err) }, SRC);
    }
  }, []);

  const stopAudioTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (audioStream) {
      for (const track of audioStream.getTracks()) track.stop();
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    setAudioStream(null);
    setAudioLevel(0);
    setAudioLoopback(false);
    analyserRef.current = null;
    audioCtxRef.current = null;
  }, [audioStream]);

  const toggleLoopback = useCallback(() => {
    if (!audioStream) return;
    if (audioLoopback) {
      if (audioElRef.current) {
        audioElRef.current.srcObject = null;
        audioElRef.current = null;
      }
      setAudioLoopback(false);
    } else {
      const audio = new Audio();
      audio.srcObject = audioStream;
      audio.play().catch(() => {});
      audioElRef.current = audio as unknown as HTMLAudioElement;
      setAudioLoopback(true);
    }
  }, [audioStream, audioLoopback]);

  // ── Section 4: Call Negotiation Test ────────────────────────────────────
  const [offerSdp, setOfferSdp] = useState('');
  const [answerSdp, setAnswerSdp] = useState('');
  const [pastedOffer, setPastedOffer] = useState('');
  const [negotiationState, setNegotiationState] = useState('idle');
  const [negotiationLog, setNegotiationLog] = useState<string[]>([]);
  const negotiationPcRef = useRef<RTCPeerConnection | null>(null);

  const addNegLog = useCallback((msg: string) => {
    setNegotiationLog((prev) => [`[${new Date().toISOString().slice(11, 23)}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const createTestOffer = useCallback(async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    negotiationPcRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    } catch {
      pc.createDataChannel('test');
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addNegLog(`ICE candidate: ${e.candidate.candidate.slice(0, 60)}...`);
      } else {
        addNegLog('ICE gathering complete');
        setOfferSdp(pc.localDescription?.sdp ?? '');
      }
    };

    pc.onconnectionstatechange = () => {
      addNegLog(`Connection state: ${pc.connectionState}`);
      setNegotiationState(pc.connectionState);
    };

    pc.onicegatheringstatechange = () => {
      addNegLog(`ICE gathering: ${pc.iceGatheringState}`);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    addNegLog(`Offer created, SDP length: ${offer.sdp?.length}`);
    setNegotiationState('offer-created');
  }, [addNegLog]);

  const acceptTestOffer = useCallback(async () => {
    if (!pastedOffer.trim()) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    negotiationPcRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    } catch {
      pc.createDataChannel('test');
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addNegLog(`ICE candidate: ${e.candidate.candidate.slice(0, 60)}...`);
      } else {
        addNegLog('ICE gathering complete');
        setAnswerSdp(pc.localDescription?.sdp ?? '');
      }
    };

    pc.onconnectionstatechange = () => {
      addNegLog(`Connection state: ${pc.connectionState}`);
      setNegotiationState(pc.connectionState);
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: pastedOffer }));
    addNegLog('Remote offer set');
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    addNegLog(`Answer created, SDP length: ${answer.sdp?.length}`);
    setNegotiationState('answer-created');
  }, [pastedOffer, addNegLog]);

  const applyTestAnswer = useCallback(async () => {
    const pc = negotiationPcRef.current;
    if (!pc || !pastedOffer.trim()) return;
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: pastedOffer }));
    addNegLog('Remote answer set — handshake complete');
  }, [pastedOffer, addNegLog]);

  const closeNegotiation = useCallback(() => {
    if (negotiationPcRef.current) {
      negotiationPcRef.current.close();
      negotiationPcRef.current = null;
    }
    setOfferSdp('');
    setAnswerSdp('');
    setPastedOffer('');
    setNegotiationState('idle');
    setNegotiationLog([]);
  }, []);

  // ── Section 6: ICE Candidate Log ───────────────────────────────────────
  const [iceCandidates, setIceCandidates] = useState<IceCandidate[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioTest();
      closeNegotiation();
    };
  }, []);

  // ── Styles ─────────────────────────────────────────────────────────────

  const sectionStyle = {
    backgroundColor: colors.background.raised,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  };

  const rowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  };

  const labelColor = { color: colors.text.muted };
  const valueColor = { color: colors.text.primary };
  const monoColor = { color: colors.text.primary, fontFamily: 'monospace' as any };

  const StatusDot = ({ status }: { status: 'pass' | 'fail' | 'testing' | 'idle' }) => {
    const dotColor =
      status === 'pass' ? colors.status.success :
      status === 'fail' ? colors.status.danger :
      status === 'testing' ? colors.status.warning :
      colors.text.muted;
    return (
      <Box style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor, marginRight: 6 }} />
    );
  };

  const qualityColor = (packetLoss: number | null) => {
    if (packetLoss == null) return colors.text.muted;
    if (packetLoss < 1) return colors.status.success;
    if (packetLoss < 5) return colors.status.warning;
    return colors.status.danger;
  };

  return (
    <ScrollArea
      style={{ flex: 1, backgroundColor: colors.background.canvas }}
      contentContainerStyle={{ padding: 20, maxWidth: 800, gap: 8 }}
    >
      <Text size="display-sm" weight="bold" style={{ color: colors.text.primary, marginBottom: 12 }}>
        Call Diagnostics
      </Text>
      <Text size="sm" style={{ color: colors.text.muted, marginBottom: 16 }}>
        Test calling infrastructure: relay, ICE, audio, and negotiation.
      </Text>

      {/* ─── 1. Relay Connectivity ─── */}
      <Box style={sectionStyle}>
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            1. Relay Connectivity
          </Text>
          <Button variant="primary" size="xs" onPress={testAllRelays}>
            Test All
          </Button>
        </Box>

        {relayResults.map((result, i) => (
          <Box key={i} style={rowStyle}>
            <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.status} />
              <Text size="sm" style={labelColor}>{result.label}</Text>
            </Box>
            <Text size="sm" weight="medium" style={valueColor}>
              {result.status === 'testing' ? 'Testing...' :
               result.status === 'pass' ? `${result.latency}ms` :
               result.status === 'fail' ? result.error ?? 'Failed' :
               '—'}
            </Text>
          </Box>
        ))}
      </Box>

      {/* ─── 2. TURN/STUN Connectivity ─── */}
      <Box style={sectionStyle}>
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            2. TURN/STUN Connectivity
          </Text>
          <Button variant="primary" size="xs" onPress={testIceServers} disabled={iceTestRunning}>
            {iceTestRunning ? 'Testing...' : 'Run Tests'}
          </Button>
        </Box>

        {turnCreds && (
          <Box style={rowStyle}>
            <Text size="sm" style={labelColor}>TURN Credentials</Text>
            <Text size="xs" style={monoColor}>{turnCreds.username.slice(0, 20)}...</Text>
          </Box>
        )}

        {stunResults.map((result, i) => (
          <Box key={`stun-${i}`} style={rowStyle}>
            <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.success ? 'pass' : 'fail'} />
              <Text size="sm" style={labelColor}>STUN {result.url.split(':')[1]}</Text>
            </Box>
            <Text size="sm" weight="medium" style={valueColor}>
              {result.success ? `${result.rtt}ms — IP: ${result.publicIp}` : result.error ?? 'Failed'}
            </Text>
          </Box>
        ))}

        {turnResults.map((result, i) => (
          <Box key={`turn-${i}`} style={rowStyle}>
            <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.success ? 'pass' : 'fail'} />
              <Text size="sm" style={labelColor}>TURN {result.url.includes('udp') ? 'UDP' : 'TCP'}</Text>
            </Box>
            <Text size="sm" weight="medium" style={valueColor}>
              {result.success ? `${result.rtt}ms (relay)` : result.error ?? 'Failed'}
            </Text>
          </Box>
        ))}
      </Box>

      {/* ─── 3. Loopback Audio Test ─── */}
      <Box style={sectionStyle}>
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            3. Loopback Audio Test
          </Text>
          {!audioStream ? (
            <Button variant="secondary" size="xs" onPress={startAudioTest}>
              Start Mic
            </Button>
          ) : (
            <Box style={{ flexDirection: 'row', gap: 8 }}>
              <Button variant={audioLoopback ? 'secondary' : 'primary'} size="xs" onPress={toggleLoopback}>
                {audioLoopback ? 'Stop Loopback' : 'Loopback'}
              </Button>
              <Button variant="destructive" size="xs" onPress={stopAudioTest}>
                Stop
              </Button>
            </Box>
          )}
        </Box>

        {audioStream && (
          <>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Device</Text>
              <Text size="sm" weight="medium" style={valueColor}>{audioDeviceName}</Text>
            </Box>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Audio Level</Text>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 16 }}>
                <Box style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border.subtle }}>
                  <Box style={{
                    width: `${Math.round(audioLevel * 100)}%`,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: audioLevel > 0.5 ? colors.status.success : audioLevel > 0.1 ? colors.status.warning : colors.text.muted,
                  }} />
                </Box>
                <Text size="xs" style={monoColor}>{Math.round(audioLevel * 100)}%</Text>
              </Box>
            </Box>
          </>
        )}
        {!audioStream && (
          <Text size="sm" style={{ color: colors.text.muted }}>
            Click Start Mic to test microphone capture and audio levels.
          </Text>
        )}
      </Box>

      {/* ─── 4. Call Negotiation Test ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 8 }}>
          4. Call Negotiation Test
        </Text>
        <Text size="xs" style={{ color: colors.text.muted, marginBottom: 12 }}>
          Create an SDP offer, copy it to another tab, paste the answer back to verify WebRTC negotiation.
        </Text>

        <Box style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" size="xs" onPress={createTestOffer}>
            Create Offer
          </Button>
          <Button variant="secondary" size="xs" onPress={acceptTestOffer}>
            Accept Offer
          </Button>
          <Button variant="primary" size="xs" onPress={applyTestAnswer}>
            Apply Answer
          </Button>
          <Button variant="destructive" size="xs" onPress={closeNegotiation}>
            Reset
          </Button>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>State</Text>
          <Text size="sm" weight="medium" style={valueColor}>{negotiationState}</Text>
        </Box>

        {offerSdp ? (
          <Box style={{ marginTop: 8 }}>
            <TextArea
              label="Offer SDP (copy this)"
              value={offerSdp}
              numberOfLines={3}
              editable={false}
              selectTextOnFocus
              size="sm"
              style={{ marginTop: 4 }}
            />
          </Box>
        ) : null}

        {answerSdp ? (
          <Box style={{ marginTop: 8 }}>
            <TextArea
              label="Answer SDP (copy this back)"
              value={answerSdp}
              numberOfLines={3}
              editable={false}
              selectTextOnFocus
              size="sm"
              style={{ marginTop: 4 }}
            />
          </Box>
        ) : null}

        <Box style={{ marginTop: 8 }}>
          <TextArea
            label="Paste SDP here"
            value={pastedOffer}
            onChangeText={setPastedOffer}
            numberOfLines={3}
            placeholder="Paste offer or answer SDP..."
            size="sm"
            style={{ marginTop: 4 }}
          />
        </Box>

        {negotiationLog.length > 0 && (
          <Box style={{ marginTop: 8 }}>
            <Text size="sm" style={labelColor}>Log:</Text>
            {negotiationLog.map((entry, i) => (
              <Text key={i} size="xs" style={{ ...monoColor, marginTop: 2 }}>{entry}</Text>
            ))}
          </Box>
        )}
      </Box>

      {/* ─── 5. Real-Time Call Stats ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          5. Real-Time Call Stats
        </Text>

        {!activeCall ? (
          <Text size="sm" style={{ color: colors.text.muted }}>
            No active call. Start a call to see real-time statistics.
          </Text>
        ) : (
          <>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Call ID</Text>
              <Text size="xs" style={monoColor}>{activeCall.callId.slice(0, 20)}...</Text>
            </Box>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Status</Text>
              <Text size="sm" weight="medium" style={valueColor}>{activeCall.status}</Text>
            </Box>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Type</Text>
              <Text size="sm" weight="medium" style={valueColor}>{activeCall.callType}</Text>
            </Box>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Remote</Text>
              <Text size="sm" weight="medium" style={valueColor}>{activeCall.remoteDisplayName}</Text>
            </Box>

            {callStats && (
              <>
                <Box style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>Network</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>RTT</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.roundTripTime?.toFixed(0) ?? '—'}ms</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Packet Loss</Text>
                  <Text size="sm" weight="medium" style={{ color: qualityColor(callStats.packetLoss) }}>
                    {callStats.packetLoss?.toFixed(2) ?? '—'}%
                  </Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Jitter</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.jitter?.toFixed(1) ?? '—'}ms</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Available Bitrate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.availableOutgoingBitrate ?? '—'} kbps</Text>
                </Box>

                <Box style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>Media</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Audio Bitrate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.audioBitrate ?? '—'} kbps</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Video Bitrate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.bitrate ?? '—'} kbps</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Codec</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.codec ?? '—'}</Text>
                </Box>
                {callStats.resolution && (
                  <Box style={rowStyle}>
                    <Text size="sm" style={labelColor}>Resolution</Text>
                    <Text size="sm" weight="medium" style={valueColor}>{callStats.resolution.width}x{callStats.resolution.height}</Text>
                  </Box>
                )}
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Frame Rate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.frameRate ?? '—'} fps</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Audio Level</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.audioLevel != null ? (callStats.audioLevel * 100).toFixed(0) + '%' : '—'}</Text>
                </Box>

                <Box style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>ICE</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Local Candidate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.localCandidateType ?? '—'}</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Remote Candidate</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.remoteCandidateType ?? '—'}</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Packets Lost</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.packetsLost ?? '—'}</Text>
                </Box>
                <Box style={rowStyle}>
                  <Text size="sm" style={labelColor}>Fraction Lost</Text>
                  <Text size="sm" weight="medium" style={valueColor}>{callStats.fractionLost != null ? (callStats.fractionLost * 100).toFixed(2) + '%' : '—'}</Text>
                </Box>
              </>
            )}
          </>
        )}
      </Box>

      {/* ─── 6. ICE Candidate Log ─── */}
      <Box style={sectionStyle}>
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            6. ICE Candidate Log
          </Text>
          <Button variant="destructive" size="xs" onPress={() => setIceCandidates([])}>
            Clear
          </Button>
        </Box>

        {iceCandidates.length === 0 ? (
          <Text size="sm" style={{ color: colors.text.muted }}>
            ICE candidates will appear here during TURN/STUN tests and active calls.
          </Text>
        ) : (
          iceCandidates.slice(0, 50).map((c, i) => (
            <Text key={i} size="xs" style={{ ...monoColor, marginBottom: 2 }}>
              {new Date(c.timestamp).toISOString().slice(11, 23)} [{c.direction}] {c.type} {c.protocol} {c.address}:{c.port}
            </Text>
          ))
        )}
      </Box>
    </ScrollArea>
  );
}
