/**
 * Vocabulary tracking — stores learned words in KV storage.
 *
 * Words are stored as a JSON array under 'tutor_vocab_{lang}'.
 * Each entry tracks the word, translation, and encounter count.
 */

import type { PluginKVStore } from '@umbra/plugin-sdk';

export interface VocabEntry {
  word: string;
  translation: string;
  pronunciation: string;
  encounters: number;
  firstSeen: number;
  lastSeen: number;
}

function vocabKey(lang: string): string {
  return `tutor_vocab_${lang}`;
}

/** Load vocabulary list for a language. */
export async function loadVocab(kv: PluginKVStore, lang: string): Promise<VocabEntry[]> {
  const raw = await kv.get(vocabKey(lang));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Save vocabulary list for a language. */
export async function saveVocab(kv: PluginKVStore, lang: string, vocab: VocabEntry[]): Promise<void> {
  await kv.set(vocabKey(lang), JSON.stringify(vocab));
}

/** Record a word encounter. Adds if new, increments count if existing. */
export async function recordWord(
  kv: PluginKVStore,
  lang: string,
  word: string,
  translation: string,
  pronunciation: string,
): Promise<void> {
  const vocab = await loadVocab(kv, lang);
  const normalized = word.toLowerCase().trim();
  const existing = vocab.find((e) => e.word.toLowerCase() === normalized);
  const now = Date.now();

  if (existing) {
    existing.encounters += 1;
    existing.lastSeen = now;
    if (translation && !existing.translation) {
      existing.translation = translation;
    }
    if (pronunciation && !existing.pronunciation) {
      existing.pronunciation = pronunciation;
    }
  } else {
    vocab.push({
      word: word.trim(),
      translation,
      pronunciation,
      encounters: 1,
      firstSeen: now,
      lastSeen: now,
    });
  }

  await saveVocab(kv, lang, vocab);
}

/** Record multiple words from parsed annotations. */
export async function recordAnnotations(
  kv: PluginKVStore,
  lang: string,
  annotations: Array<{ word: string; translation: string; pronunciation: string }>,
): Promise<void> {
  if (annotations.length === 0) return;
  const vocab = await loadVocab(kv, lang);
  const now = Date.now();

  for (const { word, translation, pronunciation } of annotations) {
    if (!word || !translation) continue;
    const normalized = word.toLowerCase().trim();
    const existing = vocab.find((e) => e.word.toLowerCase() === normalized);

    if (existing) {
      existing.encounters += 1;
      existing.lastSeen = now;
    } else {
      vocab.push({
        word: word.trim(),
        translation,
        pronunciation,
        encounters: 1,
        firstSeen: now,
        lastSeen: now,
      });
    }
  }

  await saveVocab(kv, lang, vocab);
}
