/**
 * @module theme/dark
 * @description Dark-mode color tokens for the Wisp design system.
 *
 * Layered charcoal palette with clear elevation steps. Softer off-white
 * text and accents to avoid harsh glare on dark surfaces.
 */

import type { ThemeColors } from './types';

export const darkColors: ThemeColors = {
  // ---------------------------------------------------------------------------
  // Background / elevation — layered charcoal with clear depth
  // ---------------------------------------------------------------------------
  background: {
    /** Root-level dark canvas — near-black base. */
    canvas: '#111113',
    /** Recessed / inset areas — button & icon backgrounds on surface. */
    sunken: '#1E1E21',
    /** Card / panel surface — sidebar panels, cards. */
    surface: '#18181B',
    /** Elevated elements (popovers, tooltips, dropdowns). */
    raised: '#232326',
    /** Semi-transparent scrim for modals and drawers. */
    overlay: 'rgba(0, 0, 0, 0.70)',
  },

  // ---------------------------------------------------------------------------
  // Foreground / text
  // ---------------------------------------------------------------------------
  text: {
    /** Default body text — soft off-white, easy on the eyes. */
    primary: '#ECECEF',
    /** Secondary supporting text — muted warm gray. */
    secondary: '#9494A0',
    /** Muted / disabled text — dim gray (≥ 3:1 on canvas). */
    muted: '#5C5C66',
    /** Inverse text used on light-colored surfaces (e.g. white buttons). */
    inverse: '#111113',
    /** Link / interactive text — bright but not pure white. */
    link: '#E4E4E8',
    /** Primary text on raised surfaces — soft off-white. */
    onRaised: '#ECECEF',
    /** Secondary text on raised surfaces — readable muted gray. */
    onRaisedSecondary: '#9494A0',
    /** Text on accent-colored backgrounds — white. */
    onAccent: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Borders & outlines
  // ---------------------------------------------------------------------------
  border: {
    /** Low-contrast divider — barely visible panel edges. */
    subtle: '#1F1F23',
    /** High-contrast border — visible outline for inputs/cards. */
    strong: '#2E2E33',
    /** Focus ring — bright off-white for visibility. */
    focus: '#C8C8CE',
    /** Active / pressed border. */
    active: '#B0B0B8',
  },

  // ---------------------------------------------------------------------------
  // Accent / interactive — muted gray on dark, not blinding
  // ---------------------------------------------------------------------------
  accent: {
    /** Primary accent — soft gray, a few shades below white. */
    primary: '#B8B8C0',
    /** Primary hover — slightly brighter. */
    primaryHover: '#B0B0B8',
    /** Primary active / pressed — dimmed. */
    primaryActive: '#8A8A92',
    /** Secondary accent — subdued gray. */
    secondary: '#707078',
    /** Selection / highlight tint — white at low opacity. */
    highlight: 'rgba(255, 255, 255, 0.05)',
    /** Hover highlight on raised surfaces. */
    highlightRaised: 'rgba(255, 255, 255, 0.06)',
    /** Muted foreground on raised surfaces. */
    mutedRaised: 'rgba(255, 255, 255, 0.35)',
    /** Low-contrast divider on raised surfaces. */
    dividerRaised: 'rgba(255, 255, 255, 0.05)',
  },

  // ---------------------------------------------------------------------------
  // Status / feedback
  // ---------------------------------------------------------------------------
  status: {
    success: '#22C55E',
    successSurface: 'rgba(34, 197, 94, 0.15)',
    successBorder: 'rgba(34, 197, 94, 0.30)',
    warning: '#F59E0B',
    warningSurface: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.30)',
    danger: '#EF4444',
    dangerSurface: 'rgba(239, 68, 68, 0.15)',
    dangerBorder: 'rgba(239, 68, 68, 0.30)',
    info: '#3B82F6',
    infoSurface: 'rgba(59, 130, 246, 0.15)',
    infoBorder: 'rgba(59, 130, 246, 0.30)',
  },

  // ---------------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------------
  brand: {
    /** Main brand purple — vivid on dark. */
    primary: '#8B5CF6',
    /** Hover — lighter violet. */
    hover: '#A78BFA',
    /** Active / pressed — saturated. */
    active: '#7C3AED',
    /** Tinted brand surface. */
    surface: 'rgba(139, 92, 246, 0.15)',
    /** Subtle brand border. */
    border: 'rgba(139, 92, 246, 0.30)',
    /** Text on brand backgrounds — white. */
    text: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Data visualization
  // ---------------------------------------------------------------------------
  data: {
    blue: '#3B82F6',
    violet: '#8B5CF6',
    amber: '#F59E0B',
    emerald: '#10B981',
    cyan: '#06B6D4',
  },

  // ---------------------------------------------------------------------------
  // Extended palette — Flat UI Russian colors
  // ---------------------------------------------------------------------------
  palette: {
    creamyPeach: '#f3a683',
    rosyHighlight: '#f7d794',
    softBlue: '#778beb',
    brewedMustard: '#e77f67',
    oldGeranium: '#cf6a87',
    sawtoothOak: '#f19066',
    summertime: '#f5cd79',
    cornflower: '#546de5',
    tigerlily: '#e15f41',
    deepRose: '#c44569',
    purpleMountainMajesty: '#786fa6',
    roguePink: '#f8a5c2',
    squeaky: '#63cdda',
    appleValley: '#ea8685',
    pencilLead: '#596275',
    purpleCorallite: '#574b90',
    flamingoPink: '#f78fb3',
    blueCuracao: '#3dc1d3',
    porcelainRose: '#e66767',
    biscay: '#303952',
  },
};
