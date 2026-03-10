/** Supported languages with their flags and display names. */
export const LANGUAGES: Record<string, { flag: string; name: string }> = {
  en: { flag: '\u{1F1FA}\u{1F1F8}', name: 'English' },
  es: { flag: '\u{1F1EA}\u{1F1F8}', name: 'Spanish' },
  fr: { flag: '\u{1F1EB}\u{1F1F7}', name: 'French' },
  de: { flag: '\u{1F1E9}\u{1F1EA}', name: 'German' },
  ja: { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japanese' },
  ko: { flag: '\u{1F1F0}\u{1F1F7}', name: 'Korean' },
  zh: { flag: '\u{1F1E8}\u{1F1F3}', name: 'Chinese' },
  pt: { flag: '\u{1F1E7}\u{1F1F7}', name: 'Portuguese' },
  it: { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italian' },
};

/** CEFR level thresholds — score ranges map to proficiency levels. */
export const CEFR_LEVELS = [
  { min: 0, max: 9, level: 'A1', label: 'Beginner' },
  { min: 10, max: 24, level: 'A2', label: 'Elementary' },
  { min: 25, max: 44, level: 'B1', label: 'Intermediate' },
  { min: 45, max: 64, level: 'B2', label: 'Upper Intermediate' },
  { min: 65, max: 84, level: 'C1', label: 'Advanced' },
  { min: 85, max: 100, level: 'C2', label: 'Mastery' },
] as const;

/** Get the CEFR level for a given score (0–100). */
export function getCefrLevel(score: number): { level: string; label: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const entry of CEFR_LEVELS) {
    if (clamped >= entry.min && clamped <= entry.max) {
      return { level: entry.level, label: entry.label };
    }
  }
  return { level: 'A1', label: 'Beginner' };
}

/** Get the language key from a name or code (case-insensitive). */
export function resolveLanguage(input: string): string | null {
  const lower = input.toLowerCase().trim();
  // Direct code match
  if (LANGUAGES[lower]) return lower;
  // Name match
  for (const [code, lang] of Object.entries(LANGUAGES)) {
    if (lang.name.toLowerCase() === lower) return code;
  }
  return null;
}
