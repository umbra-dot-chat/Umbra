/**
 * generate-babble-creepy.ts -- Generate creepy babble audio for wisp voices.
 *
 * Produces eerie chants, dissonant whispers, and ghostly sounds using
 * the ElevenLabs text-to-speech API. Each wisp gets clips with dark,
 * ritualistic phoneme patterns and unsettling vocal delivery.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... npx tsx packages/umbra-wisps/scripts/generate-babble-creepy.ts
 *
 * Output directories:
 *   - packages/umbra-wisps/babble_creepy/{wisp-name}/{001..015}.mp3  (primary)
 *   - packages/umbra-ghost-ai/babble_creepy/{wisp-name}/{001..015}.mp3  (copy for runtime)
 *
 * Resume support: existing files are skipped automatically.
 */

import { mkdir, writeFile, stat, copyFile } from 'fs/promises';
import { join } from 'path';

// ── Configuration ─────────────────────────────────────────────────────────────

const BABBLE_DIR = join(import.meta.dirname, '..', 'babble_creepy');
const GHOST_AI_BABBLE_DIR = join(import.meta.dirname, '..', '..', 'umbra-ghost-ai', 'babble_creepy');
const CLIPS_PER_WISP = 15;

/** Distribution: 40% short, 40% medium, 20% long */
const DISTRIBUTION = {
  short: Math.round(CLIPS_PER_WISP * 0.4),   // 6
  medium: Math.round(CLIPS_PER_WISP * 0.4),   // 6
  long: CLIPS_PER_WISP - Math.round(CLIPS_PER_WISP * 0.4) * 2, // 3
};

/** Syllable count ranges per duration category */
const SYLLABLE_RANGES: Record<string, [number, number]> = {
  short: [3, 8],
  medium: [10, 25],
  long: [30, 60],
};

/**
 * ElevenLabs voice ID mapping for each wisp.
 * Same voices as standard babble — the creepiness comes from text + voice settings.
 */
const WISP_VOICES: Record<string, string> = {
  Nyx: 'pFZP5JQG7iQjIQuC4Bku',
  Flicker: 'cgSgspJ2msm6clMCkdW9',
  Bramble: 'nPczCjzI2devNBz1zQrb',
  Pixel: 'SAz9YHcvj6GT2YYXdXww',
  Rook: 'onwK4e9ZLuTAKqWW03F9',
  Mote: 'FGY2WhTYpPnrIDTdsKH5',
  Cinder: 'SOYHLrjzK2X1ezoPC6cr',
  Whisper: 'Xb7hH8MSUJpSbSDYk0k2',
  Drift: 'CwhRBWXzGAHq8TQ4Fs17',
  Jinx: 'TX3LPaxmHKxFdv7VOQHJ',
  Echo: 'XrExE9yKIg1WjnnlVkGX',
  Volt: 'IKne3meq5aSn9XLyUdCD',
};

/** Rate limit: ms between API calls */
const RATE_LIMIT_MS = 500;

// ── Creepy Gibberish Generator ───────────────────────────────────────────────

/** Dark, guttural onsets — sibilants, harsh stops, breathy clusters */
const ONSETS = [
  'sh', 'zh', 'th', 'kh', 'gh', 'kr', 'dr', 'vr', 'sr', 'zr',
  'sk', 'str', 'scr', 'shr', 'thr', 'gr', 'br', 'pr',
  'h', 'wh', 'wr', 'sl', 'sm', 'sn',
  'n', 'r', 'v', 'z', 'd', 'g', 'k',
];

/** Massively elongated, cavernous vowels — drawn out for reverb-like droning */
const VOWELS = [
  'aaaa', 'oooo', 'eeee', 'uuuu',
  'aaaah', 'ooooh', 'uuuuh', 'eeeeh',
  'aaaaah', 'oooooh', 'uuuuuh',
  'oh', 'ah', 'uh', 'eh',
  'aoi', 'oou', 'aau', 'eeu',
];

/** Heavy, resonant codas — nasals, fricatives, dark endings */
const CODAS = [
  '', '',  // some open syllables for breath
  'th', 'sh', 'ss', 'zh', 'kh',
  'ng', 'nn', 'mm', 'rr', 'll',
  'rn', 'rm', 'lk', 'nd', 'nt', 'nk',
  'st', 'sk', 'ks', 'ts',
];

/** Breathing/gasping interjections injected between phrases */
const BREATHS = [
  '...hhhh...', '...hhhhhhh...', '...sssss...',
  '...haaaah...', '...hhhhaaaa...',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Generate a single dark syllable. */
function syllable(): string {
  return pick(ONSETS) + pick(VOWELS) + pick(CODAS);
}

/** Generate a creepy word of 1-3 syllables. */
function creepyWord(): string {
  const count = randInt(1, 3);
  let word = '';
  for (let i = 0; i < count; i++) {
    word += syllable();
  }
  return word;
}

/** Generate a chant-like repeated phrase (2-4 word motif repeated 2-3 times). */
function chantPhrase(syllableTarget: number): string {
  // Build a short motif
  const motifWords: string[] = [];
  let motifSyllables = 0;
  const motifLen = randInt(2, 4);

  for (let i = 0; i < motifLen && motifSyllables < Math.min(syllableTarget, 8); i++) {
    const word = creepyWord();
    const wordSyllables = (word.match(/[aeiou]+/gi) || []).length || 1;
    motifWords.push(word);
    motifSyllables += wordSyllables;
  }

  const motif = motifWords.join(' ');
  const reps = Math.min(randInt(2, 3), Math.ceil(syllableTarget / Math.max(motifSyllables, 1)));

  const parts: string[] = [];
  for (let i = 0; i < reps; i++) {
    parts.push(motif);
  }

  return parts.join('... ');
}

/**
 * Generate creepy gibberish text for a given duration category.
 * Mixes whispered fragments, chanted repetitions, and ghostly moans.
 */
function generateCreepyGibberish(duration: 'short' | 'medium' | 'long'): string {
  const [min, max] = SYLLABLE_RANGES[duration];
  const targetSyllables = randInt(min, max);

  // Pick a style for this clip
  const style = pick(['chant', 'whisper', 'moan', 'mixed'] as const);

  switch (style) {
    case 'chant':
      return buildChant(targetSyllables);
    case 'whisper':
      return buildWhisper(targetSyllables);
    case 'moan':
      return buildMoan(targetSyllables);
    case 'mixed':
      return buildMixed(targetSyllables);
  }
}

/** Ritualistic chanting — repeated motifs with dramatic pauses. */
function buildChant(targetSyllables: number): string {
  const phrases: string[] = [];
  let syllableCount = 0;

  while (syllableCount < targetSyllables) {
    const remaining = targetSyllables - syllableCount;
    const phrase = chantPhrase(Math.min(remaining, randInt(6, 12)));
    const phraseSyllables = (phrase.match(/[aeiou]+/gi) || []).length || 1;
    phrases.push(phrase);
    syllableCount += phraseSyllables;
  }

  // Join with dramatic ellipses
  let text = phrases.join('... ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text.endsWith('.')) text += '...';
  return text;
}

/** Breathy whispered fragments — gasping, halting, like something barely alive. */
function buildWhisper(targetSyllables: number): string {
  const fragments: string[] = [];
  let syllableCount = 0;

  while (syllableCount < targetSyllables) {
    // Occasional gasp between fragments
    if (fragments.length > 0 && Math.random() < 0.35) {
      fragments.push(pick(BREATHS));
    }

    const fragLen = randInt(1, 2);
    const words: string[] = [];

    for (let i = 0; i < fragLen; i++) {
      const word = creepyWord();
      const wordSyllables = (word.match(/[aeiou]+/gi) || []).length || 1;
      words.push(word);
      syllableCount += wordSyllables;
    }

    fragments.push(words.join(' '));
  }

  // Long pauses between fragments for eerie pacing
  let text = fragments.join('...... ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text.endsWith('...')) text += '......';
  return text;
}

/** Long droning moans — massively elongated vowels, gasping, horror atmosphere. */
function buildMoan(targetSyllables: number): string {
  const MOAN_VOWELS = [
    'aaaaahhhh', 'oooooohhhh', 'uuuuuhhh', 'eeeeehhh',
    'aaaaaaaaah', 'ooooooooh', 'uuuuuuuuh',
    'aaaaooooh', 'ooouuuuuh', 'eeeaaaaah',
  ];
  const MOAN_CONNECTORS = ['nnnnn', 'mmmmm', 'rrrrr', 'nnngg', 'hhhhh', 'sssss'];
  const parts: string[] = [];
  let syllableCount = 0;

  while (syllableCount < targetSyllables) {
    const moan = pick(MOAN_VOWELS) + pick(MOAN_CONNECTORS) + pick(MOAN_VOWELS);
    parts.push(moan);
    syllableCount += 3;

    // Insert breathing/gasping between moans
    if (Math.random() < 0.4) {
      parts.push(pick(BREATHS));
    }
  }

  let text = parts.join('... ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text.endsWith('...')) text += '...';
  return text;
}

/** Mixed — alternates between whispered words and chanted repetition. */
function buildMixed(targetSyllables: number): string {
  const parts: string[] = [];
  let syllableCount = 0;

  while (syllableCount < targetSyllables) {
    if (Math.random() < 0.4) {
      // Chant segment
      const phrase = chantPhrase(randInt(4, 8));
      const phraseSyllables = (phrase.match(/[aeiou]+/gi) || []).length || 1;
      parts.push(phrase);
      syllableCount += phraseSyllables;
    } else {
      // Whisper fragment
      const word = creepyWord();
      const wordSyllables = (word.match(/[aeiou]+/gi) || []).length || 1;
      parts.push(word);
      syllableCount += wordSyllables;
    }
  }

  let text = parts.join('... ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text.endsWith('...')) text += '...';
  return text;
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
      model_id: 'eleven_multilingual_v2',  // More expressive, wider emotional range
      voice_settings: {
        stability: 0.08,          // Extremely low — wavering, unhinged, ghostly
        similarity_boost: 0.2,    // Very low — distorted, alien, otherworldly
        style: 1.0,               // Maximum — extreme dramatic intensity
        use_speaker_boost: false,  // Disable clarity for muddier, more reverberant sound
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

  const missingVoices = Object.entries(WISP_VOICES)
    .filter(([, id]) => !id)
    .map(([name]) => name);

  if (missingVoices.length > 0) {
    console.error(
      'Error: Missing ElevenLabs voice IDs for: ' +
      missingVoices.join(', '),
    );
    process.exit(1);
  }

  console.log(`Generating ${CLIPS_PER_WISP} creepy babble clips per wisp`);
  console.log(`Distribution: ${DISTRIBUTION.short} short, ${DISTRIBUTION.medium} medium, ${DISTRIBUTION.long} long`);
  console.log(`Styles: chant, whisper, moan, mixed`);
  console.log(`Output: ${BABBLE_DIR}\n`);

  for (const [wispName, voiceId] of Object.entries(WISP_VOICES)) {
    const wispDir = join(BABBLE_DIR, wispName.toLowerCase());
    const ghostAiWispDir = join(GHOST_AI_BABBLE_DIR, wispName.toLowerCase());
    await mkdir(wispDir, { recursive: true });
    await mkdir(ghostAiWispDir, { recursive: true });

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

      if (await fileExists(filepath)) {
        skipped++;
        continue;
      }

      const text = generateCreepyGibberish(clip.duration);
      try {
        const audio = await synthesize(apiKey, voiceId, text);
        await writeFile(filepath, audio);

        const ghostAiPath = join(ghostAiWispDir, filename);
        await copyFile(filepath, ghostAiPath);

        generated++;

        if (generated % 10 === 0) {
          console.log(`  [${wispName}] ${generated}/${schedule.length - skipped} generated`);
        }
      } catch (err) {
        console.error(`  [${wispName}] Failed to generate ${filename}: ${err}`);
      }

      await sleep(RATE_LIMIT_MS);
    }

    const total = generated + skipped;
    console.log(
      `[${wispName}] Done: ${generated} generated, ${skipped} skipped (existing), ${total} total`,
    );
  }

  console.log('\nCreepy babble generation complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
