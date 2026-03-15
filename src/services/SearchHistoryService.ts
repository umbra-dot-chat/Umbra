/**
 * SearchHistoryService — Persists recent search queries to localStorage.
 *
 * Stores the last 20 unique queries. Duplicates are moved to the front.
 */

const STORAGE_KEY = 'umbra:search-history';
const MAX_ENTRIES = 20;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchQuery(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;

  const history = getSearchHistory();

  // Remove duplicate if exists (will re-add at front)
  const filtered = history.filter((q) => q !== trimmed);

  // Prepend and cap at max
  filtered.unshift(trimmed);
  if (filtered.length > MAX_ENTRIES) {
    filtered.length = MAX_ENTRIES;
  }

  persist(filtered);
}

export function removeSearchQuery(query: string): void {
  const history = getSearchHistory();
  const filtered = history.filter((q) => q !== query);
  persist(filtered);
}

export function clearSearchHistory(): void {
  persist([]);
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function persist(history: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
