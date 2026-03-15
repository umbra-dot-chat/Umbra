/**
 * SettingsSearchService — Lightweight in-memory search for settings pages.
 *
 * Builds a flat index from NAV_ITEMS and SUBCATEGORIES, with extra keywords
 * for discoverability. Returns matching items for a given query string.
 *
 * Accepts an optional translation function so labels are searched in the
 * user's current language while keywords remain in English for fallback.
 */

import { NAV_ITEMS, SUBCATEGORIES } from '@/components/modals/SettingsDialog';
import type { SettingsSection } from '@/components/modals/SettingsDialog';

export interface SettingsSearchItem {
  sectionId: SettingsSection;
  subsectionId?: string;
  label: string;
  parentLabel?: string;
  keywords: string[];
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

/** Translation key mapping for section and subsection labels */
const SECTION_LABEL_KEYS: Record<SettingsSection, string> = {
  account: 'sectionAccount',
  appearance: 'sectionAppearance',
  messaging: 'sectionMessaging',
  notifications: 'sectionNotifications',
  sounds: 'sectionSounds',
  privacy: 'sectionPrivacy',
  'audio-video': 'sectionAudioVideo',
  network: 'sectionNetwork',
  data: 'sectionData',
  plugins: 'sectionPlugins',
  'keyboard-shortcuts': 'sectionShortcuts',
  about: 'sectionAbout',
  developer: 'sectionDeveloper',
};

const SUB_LABEL_KEYS: Record<string, string> = {
  profile: 'subProfile',
  identity: 'subIdentity',
  sharing: 'subSharing',
  sync: 'subSync',
  danger: 'subDangerZone',
  theme: 'subTheme',
  'dark-mode': 'subDarkMode',
  colors: 'subColors',
  'text-size': 'subTextSize',
  font: 'subFont',
  language: 'subLanguage',
  discovery: 'subFriendDiscovery',
  visibility: 'subVisibility',
  security: 'subSecurity',
  calling: 'subCalling',
  video: 'subVideo',
  audio: 'subAudio',
  devices: 'subDevices',
  connection: 'subConnection',
  relays: 'subRelays',
  peers: 'subPeers',
  diagnostics: 'subCallDiagnostics',
  capture: 'subMediaCapture',
  testing: 'subTesting',
};

/** Extra keywords per section/subsection for discoverability */
const KEYWORDS: Partial<Record<string, string[]>> = {
  // Sections
  'account': ['profile', 'identity', 'did', 'display name', 'avatar', 'banner', 'status', 'recovery phrase', 'logout', 'delete'],
  'appearance': ['theme', 'dark mode', 'light mode', 'colors', 'accent', 'font', 'text size', 'radius'],
  'messaging': ['messages', 'chat', 'read receipts', 'typing indicator', 'compact', 'cozy'],
  'notifications': ['alerts', 'sounds', 'desktop', 'push', 'mentions', 'badge'],
  'sounds': ['audio', 'ringtone', 'notification sound', 'volume', 'mute', 'theme'],
  'privacy': ['security', 'pin', 'lock', 'discovery', 'visibility', 'blocked'],
  'audio-video': ['camera', 'microphone', 'speaker', 'video quality', 'calling', 'devices', 'noise suppression'],
  'network': ['connection', 'relay', 'peers', 'p2p', 'server', 'websocket'],
  'data': ['storage', 'cache', 'export', 'import', 'backup', 'database'],
  'plugins': ['extensions', 'marketplace', 'addons'],
  'keyboard-shortcuts': ['hotkeys', 'keybindings', 'shortcuts'],
  'about': ['version', 'update', 'changelog', 'license'],
  'developer': ['debug', 'diagnostics', 'testing', 'logs', 'capture'],
  // Subsections
  'account/profile': ['display name', 'avatar', 'banner', 'status', 'photo'],
  'account/identity': ['did', 'public key', 'recovery phrase', 'seed'],
  'account/sharing': ['identity card', 'qr code', 'share'],
  'account/sync': ['multi-device', 'synchronize'],
  'account/danger': ['delete account', 'reset', 'logout', 'sign out', 'remove'],
  'appearance/theme': ['dark', 'light', 'system', 'mode'],
  'appearance/dark-mode': ['dark mode', 'night', 'dim'],
  'appearance/colors': ['accent', 'color picker', 'palette', 'gradient'],
  'appearance/text-size': ['font size', 'zoom', 'scale', 'small', 'large'],
  'appearance/font': ['typeface', 'family', 'monospace', 'sans-serif'],
  'privacy/discovery': ['friend discovery', 'linked accounts', 'discord', 'github', 'steam'],
  'privacy/visibility': ['online status', 'last seen', 'typing'],
  'privacy/security': ['pin', 'lock', 'biometrics', 'password', 'auto-lock'],
  'audio-video/calling': ['ringtone', 'auto-answer'],
  'audio-video/video': ['quality', 'resolution', 'fps', 'background', 'blur', 'effects'],
  'audio-video/audio': ['noise suppression', 'echo cancellation', 'opus', 'bitrate', 'codec'],
  'audio-video/devices': ['microphone', 'camera', 'speaker', 'input', 'output'],
  'network/connection': ['status', 'websocket', 'connected'],
  'network/relays': ['relay server', 'add relay', 'custom relay'],
  'network/peers': ['connected peers', 'p2p'],
  'network/identity': ['did document', 'public key'],
  'developer/diagnostics': ['call diagnostics', 'webrtc', 'stats'],
  'developer/capture': ['media capture', 'recording', 'screenshot'],
  'developer/testing': ['test', 'debug', 'swarm'],
};

type TranslationFn = (key: string) => string;

/** Build the flat search index from NAV_ITEMS + SUBCATEGORIES */
function buildIndex(t?: TranslationFn): SettingsSearchItem[] {
  const items: SettingsSearchItem[] = [];

  for (const nav of NAV_ITEMS) {
    const translatedLabel = t ? t(SECTION_LABEL_KEYS[nav.id]) : nav.label;

    // Add top-level section
    items.push({
      sectionId: nav.id,
      label: translatedLabel,
      keywords: [...(KEYWORDS[nav.id] ?? []), nav.label.toLowerCase()],
      icon: nav.icon,
    });

    // Add subsections
    const subs = SUBCATEGORIES[nav.id];
    if (subs) {
      for (const sub of subs) {
        const translatedSubLabel = t && SUB_LABEL_KEYS[sub.id]
          ? t(SUB_LABEL_KEYS[sub.id])
          : sub.label;

        items.push({
          sectionId: nav.id,
          subsectionId: sub.id,
          label: translatedSubLabel,
          parentLabel: translatedLabel,
          keywords: [...(KEYWORDS[`${nav.id}/${sub.id}`] ?? []), sub.label.toLowerCase()],
          icon: nav.icon,
        });
      }
    }
  }

  return items;
}

/**
 * Search settings by query string. Returns matching items sorted by relevance
 * (label match first, then keyword match).
 *
 * @param query  The search string
 * @param t      Optional translation function (from useTranslation('settings').t)
 *               to search against translated labels
 */
export function searchSettings(query: string, t?: TranslationFn): SettingsSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const index = buildIndex(t);
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: Array<{ item: SettingsSearchItem; score: number }> = [];

  for (const item of index) {
    const label = item.label.toLowerCase();
    const parent = item.parentLabel?.toLowerCase() ?? '';
    const kws = item.keywords.join(' ').toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (label.includes(term)) {
        // Direct label match — highest priority
        score += label.startsWith(term) ? 10 : 5;
      } else if (parent.includes(term)) {
        score += 3;
      } else if (kws.includes(term)) {
        score += 2;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort by score descending, then alphabetically
  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

  return scored.map((s) => s.item);
}
