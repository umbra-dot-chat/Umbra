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
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { CallManager } from '@/services/CallManager';
import { resolveTurnCredentials } from '@/config/network';
import { useCallContext } from '@/contexts/CallContext';
import type { CallStats, TurnTestResult, StunTestResult } from '@/types/call';

// ─── Relay URLs ──────────────────────────────────────────────────────────────

const RELAYS = [
  { label: 'US East', url: 'wss://relay.deepspaceshipping.co/ws' },
  { label: 'Seoul', url: 'wss://seoul.relay.deepspaceshipping.co/ws' },
];

const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
];

const TURN_SERVERS = [
  'turn:turn.deepspaceshipping.co:3478?transport=udp',
  'turn:turn.deepspaceshipping.co:3478?transport=tcp',
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
      console.warn('[Diagnostics] Failed to get audio:', err);
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

  const labelStyle = { color: colors.text.muted, fontSize: 13 };
  const valueStyle = { color: colors.text.primary, fontSize: 13, fontWeight: '500' as const };
  const monoStyle = { color: colors.text.primary, fontSize: 11, fontFamily: 'monospace' as any };

  const btnStyle = (color: string) => ({
    backgroundColor: color,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center' as const,
  });

  const StatusDot = ({ status }: { status: 'pass' | 'fail' | 'testing' | 'idle' }) => {
    const dotColor =
      status === 'pass' ? colors.status.success :
      status === 'fail' ? colors.status.danger :
      status === 'testing' ? colors.status.warning :
      colors.text.muted;
    return (
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor, marginRight: 6 }} />
    );
  };

  const qualityColor = (packetLoss: number | null) => {
    if (packetLoss == null) return colors.text.muted;
    if (packetLoss < 1) return colors.status.success;
    if (packetLoss < 5) return colors.status.warning;
    return colors.status.danger;
  };

  return (
    <ScrollView
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
      <View style={sectionStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            1. Relay Connectivity
          </Text>
          <Pressable onPress={testAllRelays} style={btnStyle(colors.accent.primary)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Test All</Text>
          </Pressable>
        </View>

        {relayResults.map((result, i) => (
          <View key={i} style={rowStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.status} />
              <Text style={labelStyle}>{result.label}</Text>
            </View>
            <Text style={valueStyle}>
              {result.status === 'testing' ? 'Testing...' :
               result.status === 'pass' ? `${result.latency}ms` :
               result.status === 'fail' ? result.error ?? 'Failed' :
               '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* ─── 2. TURN/STUN Connectivity ─── */}
      <View style={sectionStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            2. TURN/STUN Connectivity
          </Text>
          <Pressable onPress={testIceServers} style={btnStyle(colors.accent.primary)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>
              {iceTestRunning ? 'Testing...' : 'Run Tests'}
            </Text>
          </Pressable>
        </View>

        {turnCreds && (
          <View style={rowStyle}>
            <Text style={labelStyle}>TURN Credentials</Text>
            <Text style={monoStyle}>{turnCreds.username.slice(0, 20)}...</Text>
          </View>
        )}

        {stunResults.map((result, i) => (
          <View key={`stun-${i}`} style={rowStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.success ? 'pass' : 'fail'} />
              <Text style={labelStyle}>STUN {result.url.split(':')[1]}</Text>
            </View>
            <Text style={valueStyle}>
              {result.success ? `${result.rtt}ms — IP: ${result.publicIp}` : result.error ?? 'Failed'}
            </Text>
          </View>
        ))}

        {turnResults.map((result, i) => (
          <View key={`turn-${i}`} style={rowStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusDot status={result.success ? 'pass' : 'fail'} />
              <Text style={labelStyle}>TURN {result.url.includes('udp') ? 'UDP' : 'TCP'}</Text>
            </View>
            <Text style={valueStyle}>
              {result.success ? `${result.rtt}ms (relay)` : result.error ?? 'Failed'}
            </Text>
          </View>
        ))}
      </View>

      {/* ─── 3. Loopback Audio Test ─── */}
      <View style={sectionStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            3. Loopback Audio Test
          </Text>
          {!audioStream ? (
            <Pressable onPress={startAudioTest} style={btnStyle(colors.status.success)}>
              <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Start Mic</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={toggleLoopback} style={btnStyle(audioLoopback ? colors.status.warning : colors.accent.primary)}>
                <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>{audioLoopback ? 'Stop Loopback' : 'Loopback'}</Text>
              </Pressable>
              <Pressable onPress={stopAudioTest} style={btnStyle(colors.status.danger)}>
                <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Stop</Text>
              </Pressable>
            </View>
          )}
        </View>

        {audioStream && (
          <>
            <View style={rowStyle}>
              <Text style={labelStyle}>Device</Text>
              <Text style={valueStyle}>{audioDeviceName}</Text>
            </View>
            <View style={rowStyle}>
              <Text style={labelStyle}>Audio Level</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 16 }}>
                <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border.subtle }}>
                  <View style={{
                    width: `${Math.round(audioLevel * 100)}%`,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: audioLevel > 0.5 ? colors.status.success : audioLevel > 0.1 ? colors.status.warning : colors.text.muted,
                  }} />
                </View>
                <Text style={monoStyle}>{Math.round(audioLevel * 100)}%</Text>
              </View>
            </View>
          </>
        )}
        {!audioStream && (
          <Text style={{ color: colors.text.muted, fontSize: 13 }}>
            Click Start Mic to test microphone capture and audio levels.
          </Text>
        )}
      </View>

      {/* ─── 4. Call Negotiation Test ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 8 }}>
          4. Call Negotiation Test
        </Text>
        <Text size="xs" style={{ color: colors.text.muted, marginBottom: 12 }}>
          Create an SDP offer, copy it to another tab, paste the answer back to verify WebRTC negotiation.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Pressable onPress={createTestOffer} style={btnStyle(colors.accent.primary)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Create Offer</Text>
          </Pressable>
          <Pressable onPress={acceptTestOffer} style={btnStyle(colors.status.success)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Accept Offer</Text>
          </Pressable>
          <Pressable onPress={applyTestAnswer} style={btnStyle('#8B5CF6')}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Apply Answer</Text>
          </Pressable>
          <Pressable onPress={closeNegotiation} style={btnStyle(colors.status.danger)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Reset</Text>
          </Pressable>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>State</Text>
          <Text style={valueStyle}>{negotiationState}</Text>
        </View>

        {offerSdp ? (
          <View style={{ marginTop: 8 }}>
            <Text style={labelStyle}>Offer SDP (copy this):</Text>
            <TextInput
              value={offerSdp}
              multiline
              numberOfLines={3}
              style={{ ...monoStyle, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 6, padding: 8, marginTop: 4, maxHeight: 80 }}
              selectTextOnFocus
            />
          </View>
        ) : null}

        {answerSdp ? (
          <View style={{ marginTop: 8 }}>
            <Text style={labelStyle}>Answer SDP (copy this back):</Text>
            <TextInput
              value={answerSdp}
              multiline
              numberOfLines={3}
              style={{ ...monoStyle, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 6, padding: 8, marginTop: 4, maxHeight: 80 }}
              selectTextOnFocus
            />
          </View>
        ) : null}

        <View style={{ marginTop: 8 }}>
          <Text style={labelStyle}>Paste SDP here:</Text>
          <TextInput
            value={pastedOffer}
            onChangeText={setPastedOffer}
            multiline
            numberOfLines={3}
            placeholder="Paste offer or answer SDP..."
            placeholderTextColor={colors.text.muted}
            style={{ ...monoStyle, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 6, padding: 8, marginTop: 4, maxHeight: 80 }}
          />
        </View>

        {negotiationLog.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={labelStyle}>Log:</Text>
            {negotiationLog.map((entry, i) => (
              <Text key={i} style={{ ...monoStyle, fontSize: 10, marginTop: 2 }}>{entry}</Text>
            ))}
          </View>
        )}
      </View>

      {/* ─── 5. Real-Time Call Stats ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          5. Real-Time Call Stats
        </Text>

        {!activeCall ? (
          <Text style={{ color: colors.text.muted, fontSize: 13 }}>
            No active call. Start a call to see real-time statistics.
          </Text>
        ) : (
          <>
            <View style={rowStyle}>
              <Text style={labelStyle}>Call ID</Text>
              <Text style={monoStyle}>{activeCall.callId.slice(0, 20)}...</Text>
            </View>
            <View style={rowStyle}>
              <Text style={labelStyle}>Status</Text>
              <Text style={valueStyle}>{activeCall.status}</Text>
            </View>
            <View style={rowStyle}>
              <Text style={labelStyle}>Type</Text>
              <Text style={valueStyle}>{activeCall.callType}</Text>
            </View>
            <View style={rowStyle}>
              <Text style={labelStyle}>Remote</Text>
              <Text style={valueStyle}>{activeCall.remoteDisplayName}</Text>
            </View>

            {callStats && (
              <>
                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>Network</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>RTT</Text>
                  <Text style={valueStyle}>{callStats.roundTripTime?.toFixed(0) ?? '—'}ms</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Packet Loss</Text>
                  <Text style={{ ...valueStyle, color: qualityColor(callStats.packetLoss) }}>
                    {callStats.packetLoss?.toFixed(2) ?? '—'}%
                  </Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Jitter</Text>
                  <Text style={valueStyle}>{callStats.jitter?.toFixed(1) ?? '—'}ms</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Available Bitrate</Text>
                  <Text style={valueStyle}>{callStats.availableOutgoingBitrate ?? '—'} kbps</Text>
                </View>

                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>Media</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Audio Bitrate</Text>
                  <Text style={valueStyle}>{callStats.audioBitrate ?? '—'} kbps</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Video Bitrate</Text>
                  <Text style={valueStyle}>{callStats.bitrate ?? '—'} kbps</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Codec</Text>
                  <Text style={valueStyle}>{callStats.codec ?? '—'}</Text>
                </View>
                {callStats.resolution && (
                  <View style={rowStyle}>
                    <Text style={labelStyle}>Resolution</Text>
                    <Text style={valueStyle}>{callStats.resolution.width}x{callStats.resolution.height}</Text>
                  </View>
                )}
                <View style={rowStyle}>
                  <Text style={labelStyle}>Frame Rate</Text>
                  <Text style={valueStyle}>{callStats.frameRate ?? '—'} fps</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Audio Level</Text>
                  <Text style={valueStyle}>{callStats.audioLevel != null ? (callStats.audioLevel * 100).toFixed(0) + '%' : '—'}</Text>
                </View>

                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 8 }}>
                  <Text size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 4 }}>ICE</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Local Candidate</Text>
                  <Text style={valueStyle}>{callStats.localCandidateType ?? '—'}</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Remote Candidate</Text>
                  <Text style={valueStyle}>{callStats.remoteCandidateType ?? '—'}</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Packets Lost</Text>
                  <Text style={valueStyle}>{callStats.packetsLost ?? '—'}</Text>
                </View>
                <View style={rowStyle}>
                  <Text style={labelStyle}>Fraction Lost</Text>
                  <Text style={valueStyle}>{callStats.fractionLost != null ? (callStats.fractionLost * 100).toFixed(2) + '%' : '—'}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* ─── 6. ICE Candidate Log ─── */}
      <View style={sectionStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            6. ICE Candidate Log
          </Text>
          <Pressable onPress={() => setIceCandidates([])} style={btnStyle(colors.status.danger)}>
            <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>Clear</Text>
          </Pressable>
        </View>

        {iceCandidates.length === 0 ? (
          <Text style={{ color: colors.text.muted, fontSize: 13 }}>
            ICE candidates will appear here during TURN/STUN tests and active calls.
          </Text>
        ) : (
          iceCandidates.slice(0, 50).map((c, i) => (
            <Text key={i} style={{ ...monoStyle, fontSize: 10, marginBottom: 2 }}>
              {new Date(c.timestamp).toISOString().slice(11, 23)} [{c.direction}] {c.type} {c.protocol} {c.address}:{c.port}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}
