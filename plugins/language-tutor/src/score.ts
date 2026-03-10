import type { PluginKVStore } from '@umbra/plugin-sdk';

const SCORE_KEY = 'tutor_score';
const LAST_ACTIVE_KEY = 'tutor_last_active';

/** Daily decay rate — score decreases by this amount per inactive day. */
const DAILY_DECAY = 0.5;

export interface ScoreData {
  score: number;
  lastActive: number; // epoch ms
}

/** Load score from KV, applying daily decay for inactive days. */
export async function loadScore(kv: PluginKVStore): Promise<ScoreData> {
  const raw = await kv.get(SCORE_KEY);
  const lastActiveRaw = await kv.get(LAST_ACTIVE_KEY);

  let score = raw ? parseFloat(raw) : 0;
  const lastActive = lastActiveRaw ? parseInt(lastActiveRaw, 10) : Date.now();

  // Apply daily decay
  const daysSince = Math.floor((Date.now() - lastActive) / (24 * 60 * 60 * 1000));
  if (daysSince > 0) {
    score = Math.max(0, score - daysSince * DAILY_DECAY);
  }

  return { score, lastActive };
}

/** Save current score and update last-active timestamp. */
export async function saveScore(kv: PluginKVStore, score: number): Promise<void> {
  const clamped = Math.max(0, Math.min(100, score));
  await kv.set(SCORE_KEY, String(clamped));
  await kv.set(LAST_ACTIVE_KEY, String(Date.now()));
}

/** Adjust score by a delta (positive or negative). Returns new score. */
export async function adjustScore(kv: PluginKVStore, delta: number): Promise<number> {
  const { score } = await loadScore(kv);
  const newScore = Math.max(0, Math.min(100, score + delta));
  await saveScore(kv, newScore);
  return newScore;
}
