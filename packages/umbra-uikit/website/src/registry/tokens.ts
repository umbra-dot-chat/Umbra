import React from 'react';
import { Text, HStack, VStack, Box, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from './types';

// ---------------------------------------------------------------------------
// Helper: inline element creator (avoids JSX in .ts file)
// ---------------------------------------------------------------------------
const h = React.createElement;

function ColorDot({ color, label }: { color: string; label: string }) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 8 },
  },
    h('div', {
      style: {
        width: 24, height: 24, borderRadius: 6,
        backgroundColor: color, border: '1px solid rgba(255,255,255,0.1)',
      },
    }),
    h(Text, { size: 'xs', color: 'secondary' } as any, label),
  );
}

function PaletteGrid() {
  const colors = useThemeColors();
  const p = colors.palette;
  const entries: [string, string][] = [
    ['creamyPeach', p.creamyPeach],
    ['rosyHighlight', p.rosyHighlight],
    ['softBlue', p.softBlue],
    ['brewedMustard', p.brewedMustard],
    ['oldGeranium', p.oldGeranium],
    ['sawtoothOak', p.sawtoothOak],
    ['summertime', p.summertime],
    ['cornflower', p.cornflower],
    ['tigerlily', p.tigerlily],
    ['deepRose', p.deepRose],
    ['purpleMountainMajesty', p.purpleMountainMajesty],
    ['roguePink', p.roguePink],
    ['squeaky', p.squeaky],
    ['appleValley', p.appleValley],
    ['pencilLead', p.pencilLead],
    ['purpleCorallite', p.purpleCorallite],
    ['flamingoPink', p.flamingoPink],
    ['blueCuracao', p.blueCuracao],
    ['porcelainRose', p.porcelainRose],
    ['biscay', p.biscay],
  ];
  return h('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: 16,
      width: '100%',
    },
  },
    ...entries.map(([name, hex]) =>
      h('div', {
        key: name,
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          textAlign: 'center' as const,
          width: 110,
        },
      },
        h('div', {
          style: {
            width: '100%', height: 48, borderRadius: 8,
            backgroundColor: hex,
            border: '1px solid rgba(128,128,128,0.15)',
          },
        }),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 } },
          h(Text, { size: 'xs', weight: 'medium', style: { lineHeight: '14px' } } as any, name),
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { lineHeight: '14px' } } as any, hex),
        ),
      ),
    ),
  );
}

function SpacingBar({ size, label }: { size: number; label: string }) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 8 },
  },
    h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 28, textAlign: 'right' } } as any, label),
    h('div', {
      style: {
        height: 8, width: Math.max(size * 2, 4), borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
      },
    }),
  );
}

// ---------------------------------------------------------------------------
// Token Entries
// ---------------------------------------------------------------------------

export const colorsEntry: ComponentEntry = {
  slug: 'colors',
  name: 'Colors',
  category: 'tokens',
  description: 'Neutral grayscale palette, semantic status colors, and 20-color extended palette for decorative use.',
  keywords: ['color', 'palette', 'neutral', 'semantic', 'theme', 'russian', 'flat'],
  cardPreview: h(HStack, { gap: 'xs', align: 'center' } as any,
    ...[
      '#FFFFFF', '#F0F1F5', '#BFC6D4', '#667085',
      '#37404F', '#202531', '#0F1219', '#0A0E15',
    ].map((c, i) => h('div', {
      key: i,
      style: {
        width: 20, height: 20, borderRadius: 4,
        backgroundColor: c, border: '1px solid rgba(255,255,255,0.08)',
      },
    })),
  ),
  examples: [
    {
      title: 'Neutral Scale',
      render: h(HStack, { gap: 'xs', align: 'center', style: { flexWrap: 'wrap' } } as any,
        ...[
          { c: '#FFFFFF', l: '0' }, { c: '#F7F8FA', l: '50' }, { c: '#F0F1F5', l: '100' },
          { c: '#E0E4EB', l: '200' }, { c: '#D1D6E0', l: '300' }, { c: '#BFC6D4', l: '400' },
          { c: '#667085', l: '500' }, { c: '#4E5766', l: '600' }, { c: '#37404F', l: '700' },
          { c: '#202531', l: '800' }, { c: '#161A24', l: '850' }, { c: '#0F1219', l: '900' },
          { c: '#0A0E15', l: '950' },
        ].map(({ c, l }) => h(ColorDot, { key: l, color: c, label: l })),
      ),
      code: `import { colors } from '@wisp-ui/react';
// colors.neutral[0]   → '#FFFFFF'
// colors.neutral[500]  → '#667085'
// colors.neutral[950]  → '#0A0E15'`,
    },
    {
      title: 'Semantic Colors',
      render: h(HStack, { gap: 'md', align: 'center', style: { flexWrap: 'wrap' } } as any,
        h(ColorDot, { color: '#22C55E', label: 'success' }),
        h(ColorDot, { color: '#F59E0B', label: 'warning' }),
        h(ColorDot, { color: '#EF4444', label: 'danger' }),
        h(ColorDot, { color: '#3B82F6', label: 'info' }),
      ),
      code: `import { colors } from '@wisp-ui/react';
// colors.success.base  → '#22C55E'
// colors.warning.base  → '#F59E0B'
// colors.danger.base   → '#EF4444'
// colors.info.base     → '#3B82F6'`,
    },
    {
      title: 'Extended Palette',
      render: h(PaletteGrid),
      code: `import { useThemeColors } from '@wisp-ui/react';

const colors = useThemeColors();
// colors.palette.creamyPeach     → warm peach
// colors.palette.rosyHighlight   → soft gold
// colors.palette.softBlue        → muted periwinkle
// colors.palette.cornflower      → rich indigo-blue
// colors.palette.squeaky         → light cyan
// colors.palette.deepRose        → deep magenta
// colors.palette.flamingoPink    → vivid pink
// colors.palette.blueCuracao     → bright teal
// ... and 12 more`,
    },
  ],
  props: [],
};

export const spacingEntry: ComponentEntry = {
  slug: 'spacing',
  name: 'Spacing',
  category: 'tokens',
  description: 'Spacing scale from 0 to 96px, used for padding, margins, and gaps throughout the system.',
  keywords: ['spacing', 'gap', 'padding', 'margin', 'scale'],
  cardPreview: h(VStack, { gap: 'xs' } as any,
    ...[4, 8, 16, 24, 32].map((s) => h(SpacingBar, { key: s, size: s, label: String(s) })),
  ),
  examples: [
    {
      title: 'Spacing Scale',
      render: h(VStack, { gap: 'xs' } as any,
        ...[0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96].map((s) =>
          h(SpacingBar, { key: s, size: s, label: String(s) }),
        ),
      ),
      code: `import { spacing } from '@wisp-ui/react';
// spacing[4]  → 4
// spacing[8]  → 8
// spacing[16] → 16
// spacing[32] → 32
// spacing[64] → 64`,
    },
  ],
  props: [],
};

export const typographyEntry: ComponentEntry = {
  slug: 'typography',
  name: 'Typography',
  category: 'tokens',
  description: 'Font sizes, weights, line heights, and font family stacks.',
  keywords: ['typography', 'font', 'text', 'size', 'weight'],
  cardPreview: h(VStack, { gap: 'xs' } as any,
    h(Text, { size: 'xs' } as any, 'xs — 12px'),
    h(Text, { size: 'sm' } as any, 'sm — 14px'),
    h(Text, { size: 'md' } as any, 'md — 16px'),
    h(Text, { size: 'lg' } as any, 'lg — 18px'),
  ),
  examples: [
    {
      title: 'Font Sizes',
      render: h(VStack, { gap: 'sm' } as any,
        ...(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((size) =>
          h(Text, { key: size, size } as any, `${size} — The quick brown fox`),
        ),
      ),
      code: `import { typography } from '@wisp-ui/react';
// typography.fontSize['2xs'] → 10
// typography.fontSize.xs     → 12
// typography.fontSize.sm     → 14
// typography.fontSize.md     → 16
// typography.fontSize.lg     → 18
// typography.fontSize.xl     → 20`,
    },
    {
      title: 'Font Weights',
      render: h(VStack, { gap: 'sm' } as any,
        ...(['light', 'regular', 'medium', 'semibold', 'bold', 'extrabold'] as const).map((w) =>
          h(Text, { key: w, size: 'md', weight: w === 'regular' ? undefined : w } as any, `${w} — 400 500 600 700`),
        ),
      ),
      code: `import { typography } from '@wisp-ui/react';
// typography.fontWeight.light    → '300'
// typography.fontWeight.regular  → '400'
// typography.fontWeight.semibold → '600'
// typography.fontWeight.bold     → '700'`,
    },
  ],
  props: [],
};

export const radiiEntry: ComponentEntry = {
  slug: 'radii',
  name: 'Border Radii',
  category: 'tokens',
  description: 'Border radius scale from none (0) to full (9999px).',
  keywords: ['radii', 'border', 'radius', 'rounded', 'corner'],
  cardPreview: h(HStack, { gap: 'sm', align: 'center' } as any,
    ...[
      { r: 0, l: 'none' }, { r: 4, l: 'sm' }, { r: 8, l: 'lg' }, { r: 9999, l: 'full' },
    ].map(({ r, l }) => h('div', {
      key: l,
      style: {
        width: 32, height: 32, borderRadius: r,
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.2)',
      },
    })),
  ),
  examples: [
    {
      title: 'Radius Scale',
      render: h(HStack, { gap: 'md', align: 'center', style: { flexWrap: 'wrap' } } as any,
        ...[
          { r: 0, l: 'none (0)' }, { r: 2, l: 'xs (2)' }, { r: 4, l: 'sm (4)' },
          { r: 6, l: 'md (6)' }, { r: 8, l: 'lg (8)' }, { r: 12, l: 'xl (12)' },
          { r: 16, l: '2xl (16)' }, { r: 9999, l: 'full (9999)' },
        ].map(({ r, l }) =>
          h(VStack, { key: l, gap: 'xs', align: 'center' } as any,
            h('div', {
              style: {
                width: 48, height: 48, borderRadius: r,
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
              },
            }),
            h(Text, { size: 'xs', color: 'tertiary', family: 'mono' } as any, l),
          ),
        ),
      ),
      code: `import { radii } from '@wisp-ui/react';
// radii.none → 0
// radii.sm   → 4
// radii.md   → 6
// radii.lg   → 8
// radii.xl   → 12
// radii.full → 9999`,
    },
  ],
  props: [],
};

export const shadowsEntry: ComponentEntry = {
  slug: 'shadows',
  name: 'Shadows',
  category: 'tokens',
  description: 'Elevation shadow presets from none to xl.',
  keywords: ['shadow', 'elevation', 'depth', 'box-shadow'],
  cardPreview: h(HStack, { gap: 'sm', align: 'center' } as any,
    ...[
      { s: 'none', sh: 'none' },
      { s: 'sm', sh: '0 1px 2px rgba(0,0,0,0.1)' },
      { s: 'md', sh: '0 2px 4px rgba(0,0,0,0.15)' },
      { s: 'lg', sh: '0 4px 8px rgba(0,0,0,0.2)' },
    ].map(({ s, sh }) => h('div', {
      key: s,
      style: {
        width: 32, height: 32, borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        boxShadow: sh,
      },
    })),
  ),
  examples: [
    {
      title: 'Shadow Scale',
      render: h(HStack, { gap: 'lg', align: 'center', style: { flexWrap: 'wrap' } } as any,
        ...[
          { s: 'none', sh: 'none' },
          { s: 'xs', sh: '0 1px 1px rgba(0,0,0,0.05)' },
          { s: 'sm', sh: '0 1px 2px rgba(0,0,0,0.1)' },
          { s: 'md', sh: '0 2px 4px rgba(0,0,0,0.15)' },
          { s: 'lg', sh: '0 4px 8px rgba(0,0,0,0.2)' },
          { s: 'xl', sh: '0 8px 16px rgba(0,0,0,0.25)' },
        ].map(({ s, sh }) =>
          h(VStack, { key: s, gap: 'xs', align: 'center' } as any,
            h('div', {
              style: {
                width: 64, height: 64, borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: sh,
              },
            }),
            h(Text, { size: 'xs', color: 'tertiary', family: 'mono' } as any, s),
          ),
        ),
      ),
      code: `import { shadows } from '@wisp-ui/react';
// shadows.none → elevation 0
// shadows.xs   → elevation 1, 0 1px 1px
// shadows.sm   → elevation 2, 0 1px 2px
// shadows.md   → elevation 4, 0 2px 4px
// shadows.lg   → elevation 8, 0 4px 8px
// shadows.xl   → elevation 16, 0 8px 16px`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Borders
// ---------------------------------------------------------------------------

export const bordersEntry: ComponentEntry = {
  slug: 'borders',
  name: 'Border Widths',
  category: 'tokens',
  description: 'Border width tokens from none (0) to thick (3px) for dividers, focus rings, and accents.',
  keywords: ['border', 'width', 'divider', 'line', 'stroke'],
  cardPreview: h(VStack, { gap: 'sm' } as any,
    ...[
      { w: 0, l: 'none' }, { w: 1, l: 'thin' }, { w: 2, l: 'medium' }, { w: 3, l: 'thick' },
    ].map(({ w, l }) => h('div', {
      key: l,
      style: {
        height: w || 1, width: 80, borderRadius: 1,
        backgroundColor: w === 0 ? 'transparent' : 'rgba(255,255,255,0.4)',
      },
    })),
  ),
  examples: [
    {
      title: 'Border Width Scale',
      render: h(VStack, { gap: 'md' } as any,
        ...[
          { w: 0, l: 'none (0px)', desc: 'No border' },
          { w: 1, l: 'thin (1px)', desc: 'Hairline borders, dividers' },
          { w: 2, l: 'medium (2px)', desc: 'Active/focus rings' },
          { w: 3, l: 'thick (3px)', desc: 'Heavy accents, selection indicators' },
        ].map(({ w, l, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 100, textAlign: 'right' } } as any, l),
          h('div', {
            style: {
              flex: 1, height: 48, borderRadius: 8,
              border: w > 0 ? `${w}px solid rgba(255,255,255,0.3)` : '1px dashed rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            },
          }, h(Text, { size: 'xs', color: 'tertiary' } as any, desc)),
        )),
      ),
      code: `import { borderWidths } from '@wisp-ui/react';
// borderWidths.none   → 0   No border
// borderWidths.thin   → 1   Hairline borders, dividers
// borderWidths.medium → 2   Active/focus rings
// borderWidths.thick  → 3   Heavy accents, selection`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export const motionEntry: ComponentEntry = {
  slug: 'motion',
  name: 'Motion',
  category: 'tokens',
  description: 'Duration presets, easing curves, and spring configs for consistent animation across the system.',
  keywords: ['motion', 'animation', 'duration', 'easing', 'spring', 'transition'],
  cardPreview: h(VStack, { gap: 'xs' } as any,
    ...[
      { l: 'instant', d: '50ms' }, { l: 'fast', d: '150ms' },
      { l: 'normal', d: '250ms' }, { l: 'slow', d: '400ms' },
    ].map(({ l, d }) => h(HStack, { key: l, gap: 'sm', align: 'center' } as any,
      h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 48 } } as any, d),
      h(Text, { size: 'xs', color: 'secondary' } as any, l),
    )),
  ),
  examples: [
    {
      title: 'Durations',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'instant', d: 50, desc: 'Micro-interactions' },
          { l: 'fast', d: 150, desc: 'Hover/press feedback' },
          { l: 'normal', d: 250, desc: 'Default transitions' },
          { l: 'slow', d: 400, desc: 'Complex transitions' },
          { l: 'slowest', d: 600, desc: 'Dramatic reveals' },
        ].map(({ l, d, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 60, textAlign: 'right' } } as any, `${d}ms`),
          h('div', {
            style: {
              width: Math.max(d * 0.4, 20), height: 8, borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
          }),
          h(Text, { size: 'xs', color: 'secondary' } as any, `${l} — ${desc}`),
        )),
      ),
      code: `import { motion } from '@wisp-ui/react';
// motion.durations.instant  → 50    Micro-interactions
// motion.durations.fast     → 150   Hover/press feedback
// motion.durations.normal   → 250   Default transitions
// motion.durations.slow     → 400   Complex transitions
// motion.durations.slowest  → 600   Dramatic reveals`,
    },
    {
      title: 'Easings',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'linear', c: 'linear' },
          { l: 'easeIn', c: 'cubic-bezier(0.4, 0, 1, 1)' },
          { l: 'easeOut', c: 'cubic-bezier(0, 0, 0.2, 1)' },
          { l: 'easeInOut', c: 'cubic-bezier(0.4, 0, 0.2, 1)' },
          { l: 'default', c: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        ].map(({ l, c }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 80, textAlign: 'right' } } as any, l),
          h(Text, { size: 'xs', color: 'secondary', family: 'mono' } as any, c),
        )),
      ),
      code: `import { motion } from '@wisp-ui/react';
// motion.easings.default.css  → 'cubic-bezier(0.4, 0, 0.2, 1)'
// motion.easings.easeIn.css   → 'cubic-bezier(0.4, 0, 1, 1)'
// motion.easings.easeOut.css  → 'cubic-bezier(0, 0, 0.2, 1)'`,
    },
    {
      title: 'Spring Configs',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'gentle', t: 120, f: 14, desc: 'Soft, dreamy' },
          { l: 'default', t: 170, f: 26, desc: 'Balanced' },
          { l: 'snappy', t: 300, f: 20, desc: 'Quick with overshoot' },
          { l: 'bouncy', t: 400, f: 12, desc: 'Playful bounce' },
          { l: 'stiff', t: 500, f: 30, desc: 'Rigid motion' },
        ].map(({ l, t, f, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 60, textAlign: 'right' } } as any, l),
          h(Text, { size: 'xs', color: 'secondary' } as any, `tension: ${t}, friction: ${f} — ${desc}`),
        )),
      ),
      code: `import { motion } from '@wisp-ui/react';
// motion.springs.gentle  → { tension: 120, friction: 14 }
// motion.springs.default → { tension: 170, friction: 26 }
// motion.springs.snappy  → { tension: 300, friction: 20 }
// motion.springs.bouncy  → { tension: 400, friction: 12 }
// motion.springs.stiff   → { tension: 500, friction: 30 }`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------

export const zIndexEntry: ComponentEntry = {
  slug: 'z-index',
  name: 'Z-Index',
  category: 'tokens',
  description: 'Stacking context layers from base (0) to tooltip (1600) for consistent depth ordering.',
  keywords: ['z-index', 'stacking', 'layer', 'depth', 'overlay'],
  cardPreview: h('div', { style: { position: 'relative', width: 80, height: 56 } },
    ...[
      { z: 0, l: 'base', x: 0, y: 0 },
      { z: 1, l: 'modal', x: 12, y: 8 },
      { z: 2, l: 'toast', x: 24, y: 16 },
    ].map(({ z, x, y }, i) => h('div', {
      key: i,
      style: {
        position: 'absolute', left: x, top: y,
        width: 48, height: 32, borderRadius: 4,
        backgroundColor: `rgba(255,255,255,${0.06 + i * 0.06})`,
        border: '1px solid rgba(255,255,255,0.15)',
        zIndex: z,
      },
    })),
  ),
  examples: [
    {
      title: 'Z-Index Layers',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'base', v: 0, desc: 'Default document flow' },
          { l: 'dropdown', v: 1000, desc: 'Dropdown menus, select popovers' },
          { l: 'sticky', v: 1100, desc: 'Sticky headers, floating buttons' },
          { l: 'overlay', v: 1200, desc: 'Backdrops, screen overlays' },
          { l: 'modal', v: 1300, desc: 'Modal dialogs, bottom sheets' },
          { l: 'popover', v: 1400, desc: 'Popovers, context menus' },
          { l: 'toast', v: 1500, desc: 'Toast notifications, snackbars' },
          { l: 'tooltip', v: 1600, desc: 'Tooltips (highest layer)' },
        ].map(({ l, v, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 40, textAlign: 'right' } } as any, String(v)),
          h('div', {
            style: {
              width: Math.max(v / 10, 12), height: 8, borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.25)',
            },
          }),
          h(Text, { size: 'xs', color: 'secondary' } as any, `${l} — ${desc}`),
        )),
      ),
      code: `import { zIndex } from '@wisp-ui/react';
// zIndex.base     → 0     Default document flow
// zIndex.dropdown → 1000  Dropdown menus
// zIndex.sticky   → 1100  Sticky headers
// zIndex.overlay  → 1200  Backdrops
// zIndex.modal    → 1300  Modal dialogs
// zIndex.popover  → 1400  Context menus
// zIndex.toast    → 1500  Notifications
// zIndex.tooltip  → 1600  Tooltips`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Opacity
// ---------------------------------------------------------------------------

export const opacityEntry: ComponentEntry = {
  slug: 'opacity',
  name: 'Opacity',
  category: 'tokens',
  description: 'Opacity scale from transparent (0) to opaque (1) for layering, disabled states, and overlays.',
  keywords: ['opacity', 'alpha', 'transparency', 'fade', 'disabled'],
  cardPreview: h(HStack, { gap: 'xs', align: 'center' } as any,
    ...[0, 0.1, 0.2, 0.4, 0.6, 0.8, 1].map((o) => h('div', {
      key: o,
      style: {
        width: 16, height: 24, borderRadius: 3,
        backgroundColor: `rgba(255,255,255,${o})`,
        border: '1px solid rgba(255,255,255,0.08)',
      },
    })),
  ),
  examples: [
    {
      title: 'Opacity Scale',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'transparent', v: 0, desc: 'Fully invisible' },
          { l: 'ghost', v: 0.05, desc: 'Ultra-faint overlays' },
          { l: 'faint', v: 0.1, desc: 'Skeleton loaders' },
          { l: 'muted', v: 0.2, desc: 'Disabled icons, watermarks' },
          { l: 'subtle', v: 0.4, desc: 'Disabled text/buttons' },
          { l: 'medium', v: 0.6, desc: 'Overlay backdrops' },
          { l: 'strong', v: 0.8, desc: 'Semi-opaque panels' },
          { l: 'opaque', v: 1, desc: 'Fully visible' },
        ].map(({ l, v, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 32, textAlign: 'right' } } as any, String(v)),
          h('div', {
            style: {
              width: 48, height: 24, borderRadius: 4,
              backgroundColor: `rgba(255,255,255,${v})`,
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }),
          h(Text, { size: 'xs', color: 'secondary' } as any, `${l} — ${desc}`),
        )),
      ),
      code: `import { opacity } from '@wisp-ui/react';
// opacity.transparent → 0      Fully invisible
// opacity.ghost       → 0.05   Ultra-faint overlays
// opacity.faint       → 0.1    Skeleton loaders
// opacity.muted       → 0.2    Disabled icons
// opacity.subtle      → 0.4    Disabled text
// opacity.medium      → 0.6    Overlay backdrops
// opacity.strong      → 0.8    Semi-opaque panels
// opacity.opaque      → 1      Fully visible`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Breakpoints
// ---------------------------------------------------------------------------

export const breakpointsEntry: ComponentEntry = {
  slug: 'breakpoints',
  name: 'Breakpoints',
  category: 'tokens',
  description: 'Responsive breakpoints from xs (0) to 2xl (1536px) for adaptive layouts.',
  keywords: ['breakpoint', 'responsive', 'media', 'screen', 'width', 'mobile', 'desktop'],
  cardPreview: h(VStack, { gap: 'xs' } as any,
    ...[
      { l: 'xs', w: 12 }, { l: 'sm', w: 24 }, { l: 'md', w: 36 },
      { l: 'lg', w: 52 }, { l: 'xl', w: 68 },
    ].map(({ l, w }) => h(HStack, { key: l, gap: 'sm', align: 'center' } as any,
      h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 20 } } as any, l),
      h('div', {
        style: { width: w, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
      }),
    )),
  ),
  examples: [
    {
      title: 'Breakpoint Scale',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: 'xs', v: 0, desc: 'Small phones (default)' },
          { l: 'sm', v: 640, desc: 'Large phones, landscape' },
          { l: 'md', v: 768, desc: 'Tablets (portrait)' },
          { l: 'lg', v: 1024, desc: 'Tablets (landscape), small laptops' },
          { l: 'xl', v: 1280, desc: 'Desktops, large laptops' },
          { l: '2xl', v: 1536, desc: 'Wide desktops, ultra-wide' },
        ].map(({ l, v, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 52, textAlign: 'right' } } as any, `${v}px`),
          h('div', {
            style: {
              width: Math.max(v / 8, 8), height: 8, borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.25)',
            },
          }),
          h(Text, { size: 'xs', color: 'secondary' } as any, `${l} — ${desc}`),
        )),
      ),
      code: `import { breakpoints } from '@wisp-ui/react';
// breakpoints.xs   → 0      Small phones
// breakpoints.sm   → 640    Large phones
// breakpoints.md   → 768    Tablets
// breakpoints.lg   → 1024   Small laptops
// breakpoints.xl   → 1280   Desktops
// breakpoints['2xl'] → 1536 Wide desktops`,
    },
  ],
  props: [],
};

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

export const sizingEntry: ComponentEntry = {
  slug: 'sizing',
  name: 'Sizing',
  category: 'tokens',
  description: 'Standard component heights and icon sizes for consistent interactive element sizing.',
  keywords: ['sizing', 'height', 'size', 'icon', 'component', 'button'],
  cardPreview: h(VStack, { gap: 'xs' } as any,
    ...[
      { l: 'sm', h: 32 }, { l: 'md', h: 36 }, { l: 'lg', h: 40 }, { l: 'xl', h: 48 },
    ].map(({ l, h: ht }) => h('div', {
      key: l,
      style: {
        height: ht * 0.5, width: 60, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.15)',
      },
    })),
  ),
  examples: [
    {
      title: 'Component Heights',
      render: h(VStack, { gap: 'sm' } as any,
        ...[
          { l: '2xs', v: 24, desc: 'Inline tags, micro buttons' },
          { l: 'xs', v: 28, desc: 'Small chips, compact controls' },
          { l: 'sm', v: 32, desc: 'Compact buttons, small inputs' },
          { l: 'md', v: 36, desc: 'Default buttons, inputs' },
          { l: 'lg', v: 40, desc: 'Comfortable buttons, search bars' },
          { l: 'xl', v: 48, desc: 'Large CTAs, prominent inputs' },
          { l: '2xl', v: 56, desc: 'Hero buttons, feature inputs' },
        ].map(({ l, v, desc }) => h(HStack, { key: l, gap: 'md', align: 'center' } as any,
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono', style: { width: 46, textAlign: 'right' } } as any, `${v}px`),
          h('div', {
            style: {
              width: 80, height: v * 0.6, borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            },
          }, h(Text, { size: 'xs', color: 'tertiary' } as any, l)),
          h(Text, { size: 'xs', color: 'secondary' } as any, desc),
        )),
      ),
      code: `import { sizing } from '@wisp-ui/react';
// sizing.componentHeights['2xs'] → 24  Inline tags
// sizing.componentHeights.xs     → 28  Compact controls
// sizing.componentHeights.sm     → 32  Compact buttons
// sizing.componentHeights.md     → 36  Default buttons
// sizing.componentHeights.lg     → 40  Comfortable buttons
// sizing.componentHeights.xl     → 48  Large CTAs
// sizing.componentHeights['2xl'] → 56  Hero buttons`,
    },
    {
      title: 'Icon Sizes',
      render: h(HStack, { gap: 'lg', align: 'end', style: { flexWrap: 'wrap' } } as any,
        ...[
          { l: '2xs', v: 12 }, { l: 'xs', v: 14 }, { l: 'sm', v: 16 },
          { l: 'md', v: 20 }, { l: 'lg', v: 24 }, { l: 'xl', v: 32 }, { l: '2xl', v: 40 },
        ].map(({ l, v }) => h(VStack, { key: l, gap: 'xs', align: 'center' } as any,
          h('div', {
            style: {
              width: v, height: v, borderRadius: v > 20 ? 6 : 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          }),
          h(Text, { size: 'xs', color: 'tertiary', family: 'mono' } as any, `${l}`),
          h(Text, { size: 'xs', color: 'tertiary' } as any, `${v}px`),
        )),
      ),
      code: `import { sizing } from '@wisp-ui/react';
// sizing.iconSizes['2xs'] → 12  Status dots
// sizing.iconSizes.xs     → 14  Badge icons
// sizing.iconSizes.sm     → 16  Input adornments
// sizing.iconSizes.md     → 20  Default icon size
// sizing.iconSizes.lg     → 24  Navigation icons
// sizing.iconSizes.xl     → 32  Feature icons
// sizing.iconSizes['2xl'] → 40  Hero icons`,
    },
  ],
  props: [],
};

/** All token registry entries. */
export const tokenEntries: ComponentEntry[] = [
  colorsEntry,
  spacingEntry,
  typographyEntry,
  radiiEntry,
  shadowsEntry,
  bordersEntry,
  motionEntry,
  zIndexEntry,
  opacityEntry,
  breakpointsEntry,
  sizingEntry,
];
