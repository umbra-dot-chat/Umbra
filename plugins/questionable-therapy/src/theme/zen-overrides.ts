/**
 * Zen Theme Override -- CSS custom property injection.
 *
 * When therapy mode is active, injects a <style> tag that overrides
 * the app's CSS custom properties with a calming sage/forest palette.
 * Non-destructive: removing the tag restores the original theme.
 */

const ZEN_STYLE_ID = 'zen-theme-override';

/** Zen color palette -- dark sage/forest tones. */
const ZEN_THEME = {
  background: {
    canvas: '#1a1f1a',
    sunken: '#161a16',
    surface: '#222822',
    raised: '#2a322a',
    overlay: 'rgba(26, 31, 26, 0.9)',
  },
  text: {
    primary: '#d4ddd4',
    secondary: '#a8b8a8',
    muted: '#5a6b5a',
  },
  accent: {
    primary: '#6B8F71',
    primaryHover: '#7DA085',
    primaryActive: '#5A7E60',
    secondary: '#A7C4A0',
    highlight: 'rgba(107, 143, 113, 0.12)',
  },
  brand: {
    primary: '#6B8F71',
    surface: 'rgba(107, 143, 113, 0.15)',
    border: 'rgba(107, 143, 113, 0.30)',
    text: '#1a1f1a',
  },
} as const;

/**
 * Build the CSS string that sets custom properties on :root.
 */
function buildZenCSS(): string {
  return `
    :root {
      --color-bg-canvas: ${ZEN_THEME.background.canvas};
      --color-bg-sunken: ${ZEN_THEME.background.sunken};
      --color-bg-surface: ${ZEN_THEME.background.surface};
      --color-bg-raised: ${ZEN_THEME.background.raised};
      --color-bg-overlay: ${ZEN_THEME.background.overlay};
      --color-text-primary: ${ZEN_THEME.text.primary};
      --color-text-secondary: ${ZEN_THEME.text.secondary};
      --color-text-muted: ${ZEN_THEME.text.muted};
      --color-accent-primary: ${ZEN_THEME.accent.primary};
      --color-accent-primary-hover: ${ZEN_THEME.accent.primaryHover};
      --color-accent-primary-active: ${ZEN_THEME.accent.primaryActive};
      --color-accent-secondary: ${ZEN_THEME.accent.secondary};
      --color-accent-highlight: ${ZEN_THEME.accent.highlight};
      --color-brand-primary: ${ZEN_THEME.brand.primary};
      --color-brand-surface: ${ZEN_THEME.brand.surface};
      --color-brand-border: ${ZEN_THEME.brand.border};
      --color-brand-text: ${ZEN_THEME.brand.text};
    }
  `.trim();
}

/**
 * Inject the zen theme CSS into the document head.
 */
export function applyZenTheme(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ZEN_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = ZEN_STYLE_ID;
  style.textContent = buildZenCSS();
  document.head.appendChild(style);
}

/**
 * Remove the zen theme CSS from the document head.
 */
export function removeZenTheme(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(ZEN_STYLE_ID);
  if (existing) {
    existing.remove();
  }
}
