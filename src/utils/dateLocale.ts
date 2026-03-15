/**
 * Locale-aware date formatting utilities.
 *
 * Wraps native Intl.DateTimeFormat with the current i18next language so that
 * all date/time strings across the app respect the user's chosen locale.
 *
 * Usage:
 *   import { formatDate, formatTime, formatRelativeTime } from '@/utils/dateLocale';
 *   const label = formatDate(timestamp);           // "Mar 14, 2026" or "2026年3月14日"
 *   const time  = formatTime(timestamp);           // "3:45 PM" or "15:45"
 *   const rel   = formatRelativeTime(timestamp);   // "Just now", "5m ago", "Yesterday"
 */

import i18n from 'i18next';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Current BCP-47 locale tag derived from i18next (e.g. "en", "ko", "ja"). */
function locale(): string {
  return i18n.language ?? 'en';
}

// ---------------------------------------------------------------------------
// Absolute formatters
// ---------------------------------------------------------------------------

/**
 * Format a date in the user's locale.
 * Default style: "Mar 14, 2026" (en) / "2026年3月14日" (ja) / "14 mars 2026" (fr)
 */
export function formatDate(
  ts: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof ts === 'number' ? new Date(ts) : ts;
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString(locale(), opts);
}

/**
 * Format a time in the user's locale.
 * Default style: "3:45 PM" (en) / "15:45" (ja/de)
 */
export function formatTime(
  ts: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof ts === 'number' ? new Date(ts) : ts;
  const opts: Intl.DateTimeFormatOptions = options ?? {
    hour: 'numeric',
    minute: '2-digit',
  };
  return date.toLocaleTimeString(locale(), opts);
}

/**
 * Format a date + time in the user's locale.
 */
export function formatDateTime(
  ts: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof ts === 'number' ? new Date(ts) : ts;
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  return date.toLocaleString(locale(), opts);
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Format a timestamp as a relative time string using the i18n `common` namespace.
 *
 * Returns translated strings like "Just now", "5分前", "Ayer", etc.
 * Falls back to an absolute date when > 7 days old.
 */
export function formatRelativeTime(ts: number | Date): string {
  const date = typeof ts === 'number' ? new Date(ts) : ts;
  const now = Date.now();
  const diff = now - date.getTime();
  const t = i18n.t.bind(i18n);

  if (diff < MINUTE) {
    return t('common:justNow');
  }
  if (diff < HOUR) {
    const count = Math.floor(diff / MINUTE);
    return t('common:minutesAgo', { count });
  }
  if (diff < DAY) {
    const count = Math.floor(diff / HOUR);
    return t('common:hoursAgo', { count });
  }
  if (diff < 2 * DAY) {
    return t('common:dayAgo');
  }
  if (diff < 7 * DAY) {
    const count = Math.floor(diff / DAY);
    return t('common:daysAgo', { count });
  }
  // Older than a week — use absolute date
  return formatDate(date);
}

/**
 * Group label for notification/history sections.
 * Returns "Today", "Yesterday", "This Week", or the locale-formatted date.
 */
export function formatDateGroup(ts: number | Date): string {
  const date = typeof ts === 'number' ? new Date(ts) : ts;
  const now = new Date();
  const t = i18n.t.bind(i18n);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return t('notifications:dateToday');

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return t('notifications:dateYesterday');

  const diff = now.getTime() - date.getTime();
  if (diff < 7 * DAY) return t('notifications:dateThisWeek');

  return formatDate(date);
}
