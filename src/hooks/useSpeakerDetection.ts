/**
 * useSpeakerDetection — Detects active speakers using Web Audio API.
 *
 * Creates an AnalyserNode per participant stream and polls audio levels
 * at a configurable interval. Returns both the single loudest speaker
 * and the set of all currently speaking participants.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CallParticipant } from '@/types/call';
import { dbg } from '@/utils/debug';

const SRC = 'useSpeakerDetection';

export interface SpeakerDetectionResult {
  /** DID of the loudest currently speaking participant, or null */
  activeSpeakerDid: string | null;
  /** Set of all DIDs currently above the speaking threshold */
  speakingDids: Set<string>;
}

interface SpeakerDetectionOptions {
  /** RMS volume threshold (0-255 range). Default: 30 */
  threshold?: number;
  /** Polling interval in ms. Default: 100 */
  interval?: number;
}

interface AnalyserEntry {
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
}

export function useSpeakerDetection(
  participants: Map<string, CallParticipant>,
  options?: SpeakerDetectionOptions,
): SpeakerDetectionResult {
  const threshold = options?.threshold ?? 30;
  const interval = options?.interval ?? 100;

  const [activeSpeakerDid, setActiveSpeakerDid] = useState<string | null>(null);
  const [speakingDids, setSpeakingDids] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserEntry>>(new Map());

  // Stable reference to the current participants for the polling interval
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  /** Lazily create and return the shared AudioContext */
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  // Set up and tear down analysers when participants change
  useEffect(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const currentDids = new Set<string>();

    for (const [did, participant] of participants) {
      currentDids.add(did);
      if (!participant.stream) continue;

      // Skip if already tracking this participant
      if (analysersRef.current.has(did)) continue;

      try {
        const source = ctx.createMediaStreamSource(participant.stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysersRef.current.set(did, { analyser, source });
      } catch (e) {
        if (__DEV__) dbg.warn('call', `failed to create analyser for ${did}`, { error: String(e) }, SRC);
      }
    }

    // Remove analysers for participants that left
    for (const [did, entry] of analysersRef.current) {
      if (!currentDids.has(did)) {
        entry.source.disconnect();
        analysersRef.current.delete(did);
      }
    }
  }, [participants, getAudioContext]);

  // Poll audio levels at the configured interval
  useEffect(() => {
    const timer = setInterval(() => {
      const speaking = new Set<string>();
      let maxVolume = 0;
      let loudestDid: string | null = null;

      for (const [did, entry] of analysersRef.current) {
        const data = new Uint8Array(entry.analyser.frequencyBinCount);
        entry.analyser.getByteFrequencyData(data);

        // Calculate RMS volume across frequency bins
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);

        if (rms > threshold) {
          speaking.add(did);
          if (rms > maxVolume) {
            maxVolume = rms;
            loudestDid = did;
          }
        }
      }

      setSpeakingDids(speaking);
      setActiveSpeakerDid(loudestDid);
    }, interval);

    return () => clearInterval(timer);
  }, [threshold, interval]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, entry] of analysersRef.current) {
        entry.source.disconnect();
      }
      analysersRef.current.clear();

      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, []);

  return { activeSpeakerDid, speakingDids };
}
