/**
 * generate-babble.ts -- Generate babble audio clips for wisp voices.
 *
 * Uses the ElevenLabs text-to-speech API to create phonetically plausible
 * gibberish clips for each wisp persona. Each wisp gets a unique voice
 * and 50-100 clips in short/medium/long duration categories.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... npx tsx packages/umbra-wisps/scripts/generate-babble.ts
 *
 * Resume support: existing files are skipped automatically.
 */

import { mkdir, writeFile, stat } from 'fs/promises';
import { join } from 'path';

// ── Configuration ─────────────────────────────────────────────────────────────

const BABBLE_DIR = join(import.meta.dirname, '..', 'babble');
const CLIPS_PER_WISP = 75; // Target clips per wisp

/** Distribution: 40% short, 40% medium, 20% long */
const DISTRIBUTION = {
  short: Math.round(CLIPS_PER_WISP * 0.4),   // 30
  medium: Math.round(CLIPS_PER_WISP * 0.4),   // 30
  long: CLIPS_PER_WISP - Math.round(CLIPS_PER_WISP * 0.4) * 2, // 15
};

/** Syllable count ranges per duration category */
const SYLLABLE_RANGES: Record<string, [number, number]> = {
  short: [3, 8],
  medium: [10, 25],
  long: [30, 60],
};

/**
 * ElevenLabs voice ID mapping for each wisp.
 *
 * Configure these with valid ElevenLabs voice IDs before running.
 * Browse voices at: https://elevenlabs.io/voice-library
 */
const WISP_VOICES: Record<string, string> = {
  Nyx: '',       // e.g. 'pNInz6obpgDQGcFmaJgB'
  Flicker: '',
  Bramble: '',
  Pixel: '',
  Rook: '',
  Mote: '',
  Cinder: '',
  Whisper: '',
  Drift: '',
  Jinx: '',
  Echo: '',
  Volt: '',
};

/** Rate limit: ms between API calls */
const RATE_LIMIT_MS = 500;

// ── Gibberish Generator ───────────────────────────────────────────────────────

const ONSETS = [
  'b', 'd', 'f', 'g', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z',
  'sh', 'ch', 'th', 'fr', 'gr', 'br', 'dr', 'tr', 'kr', 'pl', 'bl', 'kl',
  'sk', 'sp', 'st', 'pr', 'fl', 'gl',
];

const VOWELS = [
  'a', 'e', 'i', 'o', 'u', 'ai', 'ei', 'ou', 'au', 'oo', 'ee', 'aa',
  'ey', 'ay', 'ow',
];

const CODAS = [
  '', '', '', '', // empty coda is most common (open syllables)
  'n', 'm', 'k', 'l', 's', 'sh', 'r', 'th', 'ng', 'p', 't',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Generate a single babble syllable (CV or CVC). */
function syllable(): string {
  return pick(ONSETS) + pick(VOWELS) + pick(CODAS);
}

/** Generate a babble word of 1-4 syllables. */
function babbleWord(): string {
  const count = randInt(1, 4);
  let word = '';
  for (let i = 0; i < count; i++) {
    word += syllable();
  }
  return word;
}

/**
 * Generate a gibberish sentence with natural punctuation.
 * Returns text and approximate syllable count.
 */
function babbleSentence(targetSyllables: number): string {
  const words: string[] = [];
  let syllableCount = 0;

  while (syllableCount < targetSyllables) {
    const word = babbleWord();
    // Rough syllable estimate: count vowel groups
    const wordSyllables = (word.match(/[aeiou]+/gi) || []).length || 1;
    words.push(word);
    syllableCount += wordSyllables;

    // Add comma after 3-6 words for natural phrasing
    if (words.length > 0 && words.length % randInt(3, 6) === 0 && syllableCount < targetSyllables) {
      words[words.length - 1] += ',';
    }
  }

  // Capitalize first letter
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }

  // Break into sentences (period every 4-8 words)
  const result: string[] = [];
  let sentenceLen = 0;
  const sentenceBreak = randInt(4, 8);

  for (const word of words) {
    result.push(word);
    sentenceLen++;

    if (sentenceLen >= sentenceBreak && !word.endsWith(',')) {
      // End the sentence with a period
      const last = result[result.length - 1];
      if (!last.endsWith('.') && !last.endsWith(',')) {
        result[result.length - 1] = last + '.';
      }
      sentenceLen = 0;
      // Capitalize next word
      continue;
    }
  }

  let text = result.join(' ');

  // Capitalize after periods
  text = text.replace(/\.\s*([a-z])/g, (_, c: string) => '. ' + c.toUpperCase());

  // Ensure text ends with a period
  if (!text.endsWith('.')) {
    text += '.';
  }

  return text;
}

/**
 * Generate gibberish text for a given duration category.
 */
function generateGibberish(duration: 'short' | 'medium' | 'long'): string {
  const [min, max] = SYLLABLE_RANGES[duration];
  const targetSyllables = randInt(min, max);
  return babbleSentence(targetSyllables);
}

// ── ElevenLabs API ────────────────────────────────────────────────────────────

async function synthesize(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.5,
        style: 0.5,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(
      `ElevenLabs API error ${response.status}: ${body}`,
    );
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/** Sleep for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is required.');
    process.exit(1);
  }

  // Validate all voice IDs are configured
  const missingVoices = Object.entries(WISP_VOICES)
    .filter(([, id]) => !id)
    .map(([name]) => name);

  if (missingVoices.length > 0) {
    console.error(
      'Error: Missing ElevenLabs voice IDs for: ' +
      missingVoices.join(', '),
    );
    console.error(
      'Edit WISP_VOICES in this script with valid voice IDs from ' +
      'https://elevenlabs.io/voice-library',
    );
    process.exit(1);
  }

  console.log(`Generating ${CLIPS_PER_WISP} babble clips per wisp`);
  console.log(`Distribution: ${DISTRIBUTION.short} short, ${DISTRIBUTION.medium} medium, ${DISTRIBUTION.long} long`);
  console.log(`Output: ${BABBLE_DIR}\n`);

  for (const [wispName, voiceId] of Object.entries(WISP_VOICES)) {
    const wispDir = join(BABBLE_DIR, wispName.toLowerCase());
    await mkdir(wispDir, { recursive: true });

    // Build clip schedule: short clips first, then medium, then long
    const schedule: Array<{ index: number; duration: 'short' | 'medium' | 'long' }> = [];
    let clipIndex = 1;

    for (let i = 0; i < DISTRIBUTION.short; i++) {
      schedule.push({ index: clipIndex++, duration: 'short' });
    }
    for (let i = 0; i < DISTRIBUTION.medium; i++) {
      schedule.push({ index: clipIndex++, duration: 'medium' });
    }
    for (let i = 0; i < DISTRIBUTION.long; i++) {
      schedule.push({ index: clipIndex++, duration: 'long' });
    }

    let generated = 0;
    let skipped = 0;

    for (const clip of schedule) {
      const filename = String(clip.index).padStart(3, '0') + '.mp3';
      const filepath = join(wispDir, filename);

      // Resume support: skip existing files
      if (await fileExists(filepath)) {
        skipped++;
        continue;
      }

      const text = generateGibberish(clip.duration);
      try {
        const audio = await synthesize(apiKey, voiceId, text);
        await writeFile(filepath, audio);
        generated++;

        if (generated % 10 === 0) {
          console.log(`  [${wispName}] ${generated}/${schedule.length - skipped} generated`);
        }
      } catch (err) {
        console.error(`  [${wispName}] Failed to generate ${filename}: ${err}`);
        // Continue with next clip rather than aborting
      }

      // Rate limiting
      await sleep(RATE_LIMIT_MS);
    }

    const total = generated + skipped;
    console.log(
      `[${wispName}] Done: ${generated} generated, ${skipped} skipped (existing), ${total} total`,
    );
  }

  console.log('\nBabble generation complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
