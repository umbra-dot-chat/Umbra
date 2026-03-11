/**
 * @module theme/light
 * @description Light-mode color tokens for the Wisp design system.
 *
 * Clean white canvas with cool gray accents. Light surfaces for cards
 * and panels. Black accent system for interactive elements.
 */

import type { ThemeColors } from './types';

export const lightColors: ThemeColors = {
  // ---------------------------------------------------------------------------
  // Background / elevation — white canvas, light surfaces
  // ---------------------------------------------------------------------------
  background: {
    /** Root-level light canvas — pure white. */
    canvas: '#FFFFFF',
    /** Recessed / inset areas — cool gray, visible on surface. */
    sunken: '#EBEBED',
    /** Card / panel surface — cool off-white. */
    surface: '#F8F8FA',
    /** Elevated elements (popovers, tooltips) — white. */
    raised: '#FFFFFF',
    /** Semi-transparent scrim for modals and drawers. */
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  // ---------------------------------------------------------------------------
  // Foreground / text
  // ---------------------------------------------------------------------------
  text: {
    /** Default body text on canvas — near-black. */
    primary: '#0C0C0E',
    /** Secondary text on canvas — medium gray, clearly readable. */
    secondary: '#71717A',
    /** Muted / disabled text — cool gray (≥ 3:1 on canvas). */
    muted: '#8E8E96',
    /** Inverse text — pure white, used on accent/dark surfaces. */
    inverse: '#FFFFFF',
    /** Link / interactive text — near-black on canvas. */
    link: '#0C0C0E',
    /** Primary text on raised surfaces — near-black. */
    onRaised: '#0C0C0E',
    /** Secondary text on raised surfaces — medium gray. */
    onRaisedSecondary: '#71717A',
    /** Text on accent-colored backgrounds — white. */
    onAccent: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Borders & outlines
  // ---------------------------------------------------------------------------
  border: {
    /** Low-contrast divider — light gray. */
    subtle: '#E4E4E7',
    /** High-contrast border — medium gray. */
    strong: '#D4D4D8',
    /** Focus ring — near-black for max visibility on white. */
    focus: '#0C0C0E',
    /** Active / pressed border — dark. */
    active: '#18181B',
  },

  // ---------------------------------------------------------------------------
  // Accent / interactive — monochrome black on white canvas
  // ---------------------------------------------------------------------------
  accent: {
    /** Primary accent — near-black. */
    primary: '#0C0C0E',
    /** Primary hover — slightly lighter. */
    primaryHover: '#18181B',
    /** Primary active / pressed — charcoal. */
    primaryActive: '#27272A',
    /** Secondary accent — medium gray. */
    secondary: '#71717A',
    /** Selection / highlight tint — black at low opacity. */
    highlight: 'rgba(0, 0, 0, 0.04)',
    /** Hover highlight on raised surfaces — subtle dark tint. */
    highlightRaised: 'rgba(0, 0, 0, 0.04)',
    /** Muted foreground on raised surfaces. */
    mutedRaised: 'rgba(0, 0, 0, 0.35)',
    /** Low-contrast divider on raised surfaces. */
    dividerRaised: 'rgba(0, 0, 0, 0.08)',
  },

  // ---------------------------------------------------------------------------
  // Status / feedback — vivid on white
  // ---------------------------------------------------------------------------
  status: {
    success: '#16A34A',
    successSurface: 'rgba(22, 163, 74, 0.12)',
    successBorder: 'rgba(22, 163, 74, 0.28)',
    warning: '#D97706',
    warningSurface: 'rgba(217, 119, 6, 0.12)',
    warningBorder: 'rgba(217, 119, 6, 0.28)',
    danger: '#DC2626',
    dangerSurface: 'rgba(220, 38, 38, 0.12)',
    dangerBorder: 'rgba(220, 38, 38, 0.28)',
    info: '#2563EB',
    infoSurface: 'rgba(37, 99, 235, 0.12)',
    infoBorder: 'rgba(37, 99, 235, 0.28)',
  },

  // ---------------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------------
  brand: {
    /** Main brand purple — vivid on white. */
    primary: '#7C3AED',
    /** Hover — deeper. */
    hover: '#6D28D9',
    /** Active / pressed — darkest. */
    active: '#5B21B6',
    /** Tinted brand surface on white. */
    surface: 'rgba(124, 58, 237, 0.12)',
    /** Subtle brand border on white. */
    border: 'rgba(124, 58, 237, 0.28)',
    /** Text on brand backgrounds — white. */
    text: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Data visualization — rich on white
  // ---------------------------------------------------------------------------
  data: {
    blue: '#2563EB',
    violet: '#7C3AED',
    amber: '#D97706',
    emerald: '#16A34A',
    cyan: '#0891B2',
  },

  // ---------------------------------------------------------------------------
  // Extended palette — Flat UI Russian colors (slightly deepened for light bg)
  // ---------------------------------------------------------------------------
  palette: {
    creamyPeach: '#e8956f',
    rosyHighlight: '#f0c05a',
    softBlue: '#6574d9',
    brewedMustard: '#d46a50',
    oldGeranium: '#b85574',
    sawtoothOak: '#e07a4f',
    summertime: '#e8b84e',
    cornflower: '#4359cc',
    tigerlily: '#d04e2e',
    deepRose: '#a93858',
    purpleMountainMajesty: '#655c90',
    roguePink: '#e88aac',
    squeaky: '#4db8c5',
    appleValley: '#d66e6d',
    pencilLead: '#4a5265',
    purpleCorallite: '#463b7a',
    flamingoPink: '#e8749a',
    blueCuracao: '#2eaabb',
    porcelainRose: '#d15252',
    biscay: '#252d42',
  },
};
