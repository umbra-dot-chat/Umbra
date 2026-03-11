/**
 * @module colors
 * @description Color token system for the Wisp UI kit.
 *
 * Built on a cool blue-black neutral scale with pure white accents.
 * Monochrome by default — no color in the base UI.
 */

// ---------------------------------------------------------------------------
// Neutral scale — cool blue-blacks
// ---------------------------------------------------------------------------

/**
 * Neutral scale with cool blue undertone.
 * Derived from inspo palette: #0A0E15 → #FFFFFF
 *
 * Dark end has a subtle navy tint. Light end is clean white.
 */
export const neutral = {
  /** Pure white */
  0: '#FFFFFF',
  /** Warm off-white — light mode canvas */
  50: '#F7F8FA',
  /** Very light — light mode surface */
  100: '#F0F1F5',
  /** Light gray — light mode elevated */
  200: '#E0E4EB',
  /** Cool light gray — light mode borders */
  300: '#D1D6E0',
  /** Mid-light — light mode strong borders */
  400: '#BFC6D4',
  /** Mid gray — muted text on dark, placeholder */
  500: '#667085',
  /** Steel gray — secondary text on dark */
  600: '#4E5766',
  /** Dark steel — borders on dark mode */
  700: '#37404F',
  /** Dark navy-gray — surfaces on dark mode */
  800: '#202531',
  /** Deep blue-black — raised surfaces on dark */
  850: '#161A24',
  /** Near-black with blue undertone — dark canvas */
  900: '#0F1219',
  /** Deepest black — true dark background */
  950: '#0A0E15',
} as const;

// ---------------------------------------------------------------------------
// Brand palette — monochrome white accent
// ---------------------------------------------------------------------------

/**
 * Accent colors for interactive states.
 * Pure white accent system — monochrome feel.
 */
export const brand = {
  /** Primary accent — pure white for interactive elements */
  primary: '#FFFFFF',
  /** Slightly dimmed white for hover states */
  primaryHover: '#E8E8EC',
  /** Dimmed white for pressed/active states */
  primaryActive: '#D0D0D8',
  /** Secondary accent — soft gray for supporting actions */
  secondary: '#94A0B8',
  /** Highlight tint — white at low opacity */
  highlight: 'rgba(255, 255, 255, 0.08)',
} as const;

// ---------------------------------------------------------------------------
// Semantic / status colors
// ---------------------------------------------------------------------------

export const success = {
  base: '#22C55E',
  surface: '#0D2818',
  dim: '#16A34A',
} as const;

export const warning = {
  base: '#F59E0B',
  surface: '#2A210A',
  dim: '#D97706',
} as const;

export const danger = {
  base: '#EF4444',
  surface: '#2C1215',
  dim: '#DC2626',
} as const;

export const info = {
  base: '#3B82F6',
  surface: '#0F1E3D',
  dim: '#2563EB',
} as const;

// ---------------------------------------------------------------------------
// Data visualization palette
// ---------------------------------------------------------------------------

export const dataViz = {
  blue: '#3B82F6',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  emerald: '#10B981',
  cyan: '#06B6D4',
} as const;

// ---------------------------------------------------------------------------
// Brand gradient — signature purple→pink→blue
// ---------------------------------------------------------------------------

export const brandGradient = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const colors = {
  neutral,
  brand,
  brandGradient,
  success,
  warning,
  danger,
  info,
  dataViz,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NeutralStep = keyof typeof neutral;
export type BrandColor = keyof typeof brand;
export type StatusVariant = 'base' | 'surface' | 'dim';
export type DataVizColor = keyof typeof dataViz;
