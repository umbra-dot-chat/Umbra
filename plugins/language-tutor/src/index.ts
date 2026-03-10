/**
 * Language Tutor — Plugin entry point.
 *
 * Registers a `/tutor` slash command to activate language learning mode.
 * When active, Ghost mixes the target language into responses with
 * inline annotations that users can tap for translations.
 */

import type { PluginAPI, SlashCommandSuggestion } from '@umbra/plugin-sdk';
import { LANGUAGES, resolveLanguage } from './constants';
import { loadScore, saveScore } from './score';
import { recordAnnotations } from './vocab';
import {
  setTutorActive, setTargetLanguage, setCurrentScore,
  resetState, targetLanguage, tutorActive, currentScore,
} from './state';
import { MessageDecorator } from './components/MessageDecorator';
import { TutorStatusBanner } from './components/TutorStatusBanner';

let api: PluginAPI | null = null;
const cleanups: (() => void)[] = [];

export async function activate(pluginApi: PluginAPI): Promise<void> {
  api = pluginApi;

  // Restore persisted state (Ghost also persists tutor state in its own DB,
  // so we only need to restore the local UI — no need to re-send activation)
  const savedLang = await api.kv.get('tutor_language');
  const savedActive = await api.kv.get('tutor_active');
  if (savedLang && LANGUAGES[savedLang] && savedActive === 'true') {
    setTargetLanguage(savedLang);
    const { score } = await loadScore(api.kv);
    setCurrentScore(score);
    setTutorActive(true);
  }

  // Build language suggestions for autocomplete
  const langSuggestions: SlashCommandSuggestion[] = [
    ...Object.entries(LANGUAGES).map(([code, lang]) => ({
      label: lang.name.toLowerCase(),
      description: `${lang.flag} Learn ${lang.name}`,
    })),
    { label: 'stop', description: 'Deactivate tutor mode' },
    { label: 'status', description: 'Show current tutor status' },
  ];

  // Register /tutor slash command
  const unregSlash = api.registerSlashCommand({
    id: 'tutor:start',
    command: 'tutor',
    label: 'Language Tutor',
    description: 'Start language learning (e.g. /tutor spanish)',
    icon: '\u{1F4DA}',
    getSuggestions: (partialArgs: string): SlashCommandSuggestion[] => {
      const q = partialArgs.toLowerCase().trim();
      if (!q) return langSuggestions;
      return langSuggestions.filter(
        (s) => s.label.startsWith(q) || (s.description?.toLowerCase().includes(q) ?? false)
      );
    },
    onExecute: async (args: string) => {
      if (!api) return;

      const arg = args.trim().toLowerCase();

      // /tutor stop — deactivate (local state only; ChatPage sends the message)
      if (arg === 'stop' || arg === 'off') {
        setTutorActive(false);
        setTargetLanguage('');
        setCurrentScore(0);
        await api.kv.delete('tutor_language');
        await api.kv.delete('tutor_active');
        return;
      }

      // /tutor status — banner handles display, nothing to do
      if (arg === 'status' || arg === '') {
        return;
      }

      // /tutor <language> — activate
      const langCode = resolveLanguage(arg);
      if (!langCode) {
        return;
      }

      // Activate local state only — ChatPage sends "/tutor <lang>" through
      // the normal message pipeline so it reaches Ghost via relay
      setTargetLanguage(langCode);
      await api.kv.set('tutor_language', langCode);
      await api.kv.set('tutor_active', 'true');

      const { score } = await loadScore(api.kv);
      setCurrentScore(score);
      setTutorActive(true);

    },
  });
  cleanups.push(unregSlash);

  // Register text transform to clean up tutor-specific markup in message bubbles
  const unregTransform = api.registerTextTransform({
    id: 'tutor:strip-markup',
    priority: 10,
    transform: (text) => {
      // Transform /tutor commands into friendly system-style text
      const tutorCmd = text.match(/^\/tutor\s+(.+)$/i);
      if (tutorCmd) {
        const arg = tutorCmd[1].trim().toLowerCase();
        if (arg === 'stop' || arg === 'off') return '\u{1F4DA} Language Tutor deactivated';
        const langName = arg.charAt(0).toUpperCase() + arg.slice(1);
        return `\u{1F4DA} Language Tutor activated: ${langName}`;
      }
      // Strip [TUTOR-*] tags in any format Ghost uses:
      //   [TUTOR-spanish-3.5]  or  [TUTOR-spanish-SCORE: +2]
      return text.replace(/\[TUTOR-[^\]]+\]\s*/g, '');
    },
  });
  cleanups.push(unregTransform);

  // Subscribe to messages to detect score updates from Ghost
  const unsubMsg = api.onMessage(async (event) => {
    if (!api) return;
    if (!event.text) return;

    // Parse [TUTOR-lang-score] tags from Ghost in either format:
    //   [TUTOR-spanish-3.5]  or  [TUTOR-spanish-SCORE: +2]
    const scoreMatch = event.text.match(/\[TUTOR-(\w+)-(?:SCORE:\s*[+]?)?([\d.]+)\]/);
    if (scoreMatch) {
      const tagLang = scoreMatch[1]; // e.g. "spanish"
      const newScore = parseFloat(scoreMatch[2]);

      // If Ghost is sending tutor responses but tutor isn't active locally,
      // auto-activate so the banner and UI stay in sync
      if (!tutorActive && tagLang) {
        const resolvedCode = resolveLanguage(tagLang);
        if (resolvedCode) {
          setTargetLanguage(resolvedCode);
          setTutorActive(true);
          await api.kv.set('tutor_language', resolvedCode);
          await api.kv.set('tutor_active', 'true');
        }
      }

      if (!isNaN(newScore)) {
        setCurrentScore(newScore);
        await saveScore(api.kv, newScore);
      }
    }

    // Track vocabulary from {{word|translation|pronunciation}} annotations
    if (!targetLanguage) return; // need language context for vocab tracking
    const annotationRegex = /\{\{([^|]+)\|([^|]+)\|([^}]*)\}\}/g;
    const annotations: Array<{ word: string; translation: string; pronunciation: string }> = [];
    let annMatch;
    while ((annMatch = annotationRegex.exec(event.text)) !== null) {
      annotations.push({ word: annMatch[1], translation: annMatch[2], pronunciation: annMatch[3] });
    }
    if (annotations.length > 0) {
      await recordAnnotations(api.kv, targetLanguage, annotations);
    }
  });
  cleanups.push(unsubMsg);

  console.log('[Language Tutor] Activated');
}

export function deactivate(): void {
  for (const cleanup of cleanups) {
    try { cleanup(); } catch { /* ignore */ }
  }
  cleanups.length = 0;
  resetState();
  api = null;
  console.log('[Language Tutor] Deactivated');
}

export const components = {
  MessageDecorator,
  TutorStatusBanner,
};
