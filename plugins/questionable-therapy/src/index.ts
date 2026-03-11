/**
 * Questionable Therapy -- Plugin entry point.
 *
 * Registers a `/therapy` slash command to activate therapy session mode.
 * When active, Ghost adopts a therapist persona, the app shifts to a
 * zen theme, and ambient audio plays in the sidebar.
 */

import type { PluginAPI, SlashCommandSuggestion } from '@umbra/plugin-sdk';
import { THERAPY_TAG_REGEX } from './constants';
import { ZenAudioEngine } from './audio';
import { applyZenTheme, removeZenTheme } from './theme/zen-overrides';
import {
  setTherapyActive,
  setCurrentTrack,
  setIsPlaying,
  setVolume,
  setSessionCount,
  setSessionStartedAt,
  resetState,
  therapyActive,
  currentTrack,
  volume,
} from './state';
import { TherapySessionBanner } from './components/TherapySessionBanner';
import { ZenMediaControls, setAudioEngineRef } from './components/ZenMediaControls';
import { TherapyMessageStyle } from './components/TherapyMessageStyle';

let api: PluginAPI | null = null;
const cleanups: (() => void)[] = [];
let audioEngine: ZenAudioEngine | null = null;

// -- Session lifecycle --------------------------------------------------------

function activateSession(): void {
  setTherapyActive(true);
  setSessionStartedAt(Date.now());
  applyZenTheme();

  // Start audio
  if (!audioEngine) {
    audioEngine = new ZenAudioEngine();
  }
  setAudioEngineRef(audioEngine);
  audioEngine.setVolume(volume);
  audioEngine.play(currentTrack);
  setIsPlaying(true);
}

function deactivateSession(): void {
  setTherapyActive(false);
  setSessionStartedAt(0);
  removeZenTheme();

  // Stop audio
  if (audioEngine) {
    audioEngine.stop();
    audioEngine = null;
    setAudioEngineRef(null);
  }
  setIsPlaying(false);
}

// -- Plugin lifecycle ---------------------------------------------------------

export async function activate(pluginApi: PluginAPI): Promise<void> {
  api = pluginApi;

  // Restore persisted state
  const savedActive = await api.kv.get('therapy_active');
  const savedTrack = await api.kv.get('therapy_track');
  const savedVolume = await api.kv.get('therapy_volume');
  const savedCount = await api.kv.get('therapy_session_count');

  if (savedTrack) setCurrentTrack(parseInt(savedTrack, 10) || 0);
  if (savedVolume) setVolume(parseFloat(savedVolume) || 0.3);
  if (savedCount) setSessionCount(parseInt(savedCount, 10) || 0);

  if (savedActive === 'true') {
    activateSession();
  }

  // Build slash command suggestions
  const suggestions: SlashCommandSuggestion[] = [
    { label: 'start', description: 'Begin a therapy session' },
    { label: 'stop', description: 'End the current session' },
    { label: 'status', description: 'Show session status' },
  ];

  // Register /therapy slash command
  const unregSlash = api.registerSlashCommand({
    id: 'therapy:session',
    command: 'therapy',
    label: 'Questionable Therapy',
    description: 'Start or stop a therapy session with Ghost',
    icon: '\uD83E\uDDD8',
    sendAsMessage: true,
    getSuggestions: (partialArgs: string): SlashCommandSuggestion[] => {
      const q = partialArgs.toLowerCase().trim();
      if (!q) return suggestions;
      return suggestions.filter(
        (s) => s.label.startsWith(q) || (s.description?.toLowerCase().includes(q) ?? false),
      );
    },
    onExecute: async (args: string) => {
      if (!api) return;
      const arg = args.trim().toLowerCase();

      if (arg === 'stop' || arg === 'end') {
        deactivateSession();
        await api.kv.delete('therapy_active');
        return;
      }

      if (arg === 'status') {
        // Status is shown via the banner -- no-op
        return;
      }

      // Default: start session (covers 'start' and empty args)
      const count = parseInt(await api.kv.get('therapy_session_count') ?? '0', 10) + 1;
      setSessionCount(count);
      await api.kv.set('therapy_session_count', String(count));
      await api.kv.set('therapy_active', 'true');
      activateSession();
    },
  });
  cleanups.push(unregSlash);

  // Register text transform to strip therapy tags and prettify commands
  const unregTransform = api.registerTextTransform({
    id: 'therapy:strip-tags',
    priority: 10,
    transform: (text) => {
      // Prettify /therapy commands
      const therapyCmd = text.match(/^\/therapy\s*(.*)$/i);
      if (therapyCmd) {
        const arg = (therapyCmd[1] ?? '').trim().toLowerCase();
        if (arg === 'stop' || arg === 'end') return '\uD83E\uDDD8 Therapy session ended';
        return '\uD83E\uDDD8 Therapy session started';
      }
      // Strip [THERAPY-SESSION] tags
      return text.replace(THERAPY_TAG_REGEX, '');
    },
  });
  cleanups.push(unregTransform);

  // Subscribe to messages to detect [THERAPY-SESSION] from Ghost
  const unsubMsg = api.onMessage(async (event) => {
    if (!api) return;
    if (!event.text) return;

    // Auto-activate if Ghost sends therapy-tagged messages
    if (event.text.includes('[THERAPY-SESSION]') && !therapyActive) {
      await api.kv.set('therapy_active', 'true');
      activateSession();
    }
  });
  cleanups.push(unsubMsg);

  // Persist track/volume changes
  const persistInterval = setInterval(async () => {
    if (!api) return;
    await api.kv.set('therapy_track', String(currentTrack));
    await api.kv.set('therapy_volume', String(volume));
  }, 5000);
  cleanups.push(() => clearInterval(persistInterval));

  console.log('[Questionable Therapy] Activated');
}

export function deactivate(): void {
  for (const cleanup of cleanups) {
    try { cleanup(); } catch { /* ignore */ }
  }
  cleanups.length = 0;

  deactivateSession();
  resetState();
  api = null;

  console.log('[Questionable Therapy] Deactivated');
}

export const components = {
  TherapySessionBanner,
  ZenMediaControls,
  TherapyMessageStyle,
};
