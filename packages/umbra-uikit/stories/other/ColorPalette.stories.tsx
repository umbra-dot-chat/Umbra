import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';
import { neutral } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Branding/Color Palette',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// WCAG Contrast Utilities
// ---------------------------------------------------------------------------

/** Parse a hex color (#RGB, #RRGGBB) into [r, g, b] 0-255 */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick white or black text based on which has better contrast against bg */
function bestTextColor(bgHex: string): '#FFFFFF' | '#0F1219' {
  const whiteRatio = contrastRatio(bgHex, '#FFFFFF');
  const blackRatio = contrastRatio(bgHex, '#0F1219');
  return whiteRatio > blackRatio ? '#FFFFFF' : '#0F1219';
}

/** WCAG level label */
function wcagLevel(ratio: number): { label: string; pass: boolean } {
  if (ratio >= 7) return { label: 'AAA', pass: true };
  if (ratio >= 4.5) return { label: 'AA', pass: true };
  if (ratio >= 3) return { label: 'AA Large', pass: true };
  return { label: 'Fail', pass: false };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    size="xs"
    color="tertiary"
    weight="semibold"
    as="div"
    style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}
  >
    {children}
  </Text>
);

interface SwatchProps {
  hex: string;
  label: string;
  sublabel?: string;
  large?: boolean;
  showContrast?: boolean;
}

/**
 * Auto-contrast swatch — picks white or black text based on WCAG luminance.
 * Optionally shows the contrast ratio badge.
 */
const Swatch = ({ hex, label, sublabel, large, showContrast = true }: SwatchProps) => {
  // Handle non-hex colors (rgba, etc.) — fall back to dark text
  const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
  const textColor = isHex ? bestTextColor(hex) : '#0F1219';
  const subtextColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const ratio = isHex ? contrastRatio(hex, textColor) : 0;
  const level = wcagLevel(ratio);

  return (
    <div
      style={{
        backgroundColor: hex,
        padding: large ? '24px 16px' : '14px 12px',
        borderRadius: 8,
        border: `1px solid ${textColor === '#FFFFFF' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: large ? 140 : 100,
        position: 'relative',
      }}
    >
      {/* WCAG contrast badge */}
      {showContrast && isHex && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 9,
            fontWeight: 600,
            fontFamily: 'monospace',
            padding: '2px 5px',
            borderRadius: 4,
            backgroundColor: level.pass ? 'rgba(5, 150, 105, 0.15)' : 'rgba(220, 38, 38, 0.15)',
            color: level.pass
              ? (textColor === '#FFFFFF' ? '#34D399' : '#059669')
              : (textColor === '#FFFFFF' ? '#F87171' : '#DC2626'),
            letterSpacing: 0.3,
          }}
        >
          {ratio.toFixed(1)} {level.label}
        </div>
      )}

      <Text size="xs" weight="medium" color={textColor}>
        {label}
      </Text>
      <Text size="xs" color={subtextColor} family="mono">
        {hex}
      </Text>
      {sublabel && (
        <Text size="xs" color={subtextColor}>
          {sublabel}
        </Text>
      )}
    </div>
  );
};

/**
 * A dedicated contrast checker row — shows fg on bg with ratio badge
 */
const ContrastRow = ({
  fg,
  bg,
  fgLabel,
  bgLabel,
}: {
  fg: string;
  bg: string;
  fgLabel: string;
  bgLabel: string;
}) => {
  const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(fg) && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(bg);
  const ratio = isHex ? contrastRatio(fg, bg) : 0;
  const level = wcagLevel(ratio);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: bg,
        border: `1px solid ${bestTextColor(bg) === '#FFFFFF' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Sample text on bg */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text size="sm" weight="medium" color={fg}>
          {fgLabel} on {bgLabel}
        </Text>
        <Text size="xs" color={fg} style={{ opacity: 0.7 }} family="mono">
          {fg} / {bg}
        </Text>
      </div>

      {/* Ratio badge */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'monospace',
          padding: '4px 8px',
          borderRadius: 6,
          backgroundColor: level.pass ? '#059669' : '#DC2626',
          color: '#FFFFFF',
          whiteSpace: 'nowrap',
        }}
      >
        {ratio.toFixed(1)}:1 {level.label}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Neutral Scale
// ---------------------------------------------------------------------------

export const NeutralScale: Story = {
  name: 'Neutral Scale',
  render: () => {
    const steps: { step: string; hex: string; usage: string }[] = [
      { step: '950', hex: neutral[950], usage: 'Canvas (dark)' },
      { step: '900', hex: neutral[900], usage: 'Canvas alt' },
      { step: '850', hex: neutral[850], usage: 'Raised (dark)' },
      { step: '800', hex: neutral[800], usage: 'Surface (dark)' },
      { step: '700', hex: neutral[700], usage: 'Borders (dark)' },
      { step: '600', hex: neutral[600], usage: 'Secondary text' },
      { step: '500', hex: neutral[500], usage: 'Muted text' },
      { step: '400', hex: neutral[400], usage: 'Disabled (light)' },
      { step: '300', hex: neutral[300], usage: 'Strong borders' },
      { step: '200', hex: neutral[200], usage: 'Light borders' },
      { step: '100', hex: neutral[100], usage: 'Light surface' },
      { step: '50', hex: neutral[50], usage: 'Light canvas' },
      { step: '0', hex: neutral[0], usage: 'Pure white' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Neutral Scale — Cool Blue-Black</SectionLabel>
        <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
          13-step grayscale with a subtle navy undertone. Auto-contrast text picks white or black for readability.
        </Text>

        {/* Gradient bar */}
        <div
          style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            height: 48,
            marginBottom: 8,
          }}
        >
          {steps.map(({ step, hex }) => (
            <div key={step} style={{ flex: 1, backgroundColor: hex }} />
          ))}
        </div>

        {/* Individual swatches — auto-contrast */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 8,
          }}
        >
          {steps.map(({ step, hex, usage }) => (
            <Swatch key={step} hex={hex} label={step} sublabel={usage} />
          ))}
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Semantic Theme Colors
// ---------------------------------------------------------------------------

export const ThemeColors: Story = {
  name: 'Theme Colors',
  render: () => {
    const InnerComponent = () => {
      const colors = useThemeColors();

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Backgrounds */}
          <div>
            <SectionLabel>Backgrounds — Elevation Layers</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Swatch hex={colors.background.canvas} label="canvas" sublabel="Page background" large />
              <Swatch hex={colors.background.surface} label="surface" sublabel="Cards, panels" large />
              <Swatch hex={colors.background.raised} label="raised" sublabel="Popovers, tooltips" large />
            </div>
          </div>

          {/* Text */}
          <div>
            <SectionLabel>Text — Foreground Colors</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Swatch hex={colors.text.primary} label="primary" sublabel="Body text" large />
              <Swatch hex={colors.text.secondary} label="secondary" sublabel="Supporting" large />
              <Swatch hex={colors.text.muted} label="muted" sublabel="Placeholder" large />
              <Swatch hex={colors.text.inverse} label="inverse" sublabel="On opposite bg" large />
              <Swatch hex={colors.text.link} label="link" sublabel="Interactive" large />
            </div>
          </div>

          {/* Borders */}
          <div>
            <SectionLabel>Borders & Outlines</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Swatch hex={colors.border.subtle} label="subtle" sublabel="Dividers" large />
              <Swatch hex={colors.border.strong} label="strong" sublabel="Emphasis" large />
              <Swatch hex={colors.border.focus} label="focus" sublabel="Focus rings" large />
              <Swatch hex={colors.border.active} label="active" sublabel="Pressed" large />
            </div>
          </div>

          {/* Accent */}
          <div>
            <SectionLabel>Accent — Interactive States</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Swatch hex={colors.accent.primary} label="primary" sublabel="Default" large />
              <Swatch hex={colors.accent.primaryHover} label="hover" sublabel="Hovered" large />
              <Swatch hex={colors.accent.primaryActive} label="active" sublabel="Pressed" large />
              <Swatch hex={colors.accent.secondary} label="secondary" sublabel="Supporting" large />
            </div>
          </div>
        </div>
      );
    };

    return <InnerComponent />;
  },
};

// ---------------------------------------------------------------------------
// 3. Status Colors
// ---------------------------------------------------------------------------

export const StatusColors: Story = {
  name: 'Status Colors',
  render: () => {
    const InnerComponent = () => {
      const colors = useThemeColors();

      const statuses = [
        { name: 'Success', fg: colors.status.success, bg: colors.status.successSurface, usage: 'Positive actions, confirmations' },
        { name: 'Warning', fg: colors.status.warning, bg: colors.status.warningSurface, usage: 'Cautionary messages' },
        { name: 'Danger', fg: colors.status.danger, bg: colors.status.dangerSurface, usage: 'Errors, destructive actions' },
        { name: 'Info', fg: colors.status.info, bg: colors.status.infoSurface, usage: 'Informational messages' },
      ];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Status Colors — The Only Color in Wisp</SectionLabel>
          <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
            These are the only non-grayscale colors in the entire system. Reserved exclusively for semantic feedback.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {statuses.map(({ name, fg, bg, usage }) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 8,
                  backgroundColor: bg,
                  border: `1px solid ${fg}22`,
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: fg,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Text size="sm" weight="semibold" color={fg}>{name}</Text>
                    <Text size="xs" color="tertiary" family="mono">{fg}</Text>
                  </div>
                  <Text size="xs" color="secondary">{usage}</Text>
                </div>
                {/* Surface swatch */}
                <Swatch hex={fg} label="" showContrast={false} />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return <InnerComponent />;
  },
};

// ---------------------------------------------------------------------------
// 4. Data Visualization
// ---------------------------------------------------------------------------

export const DataVisualization: Story = {
  name: 'Data Visualization',
  render: () => {
    const InnerComponent = () => {
      const colors = useThemeColors();

      const series = [
        { name: 'Blue', hex: colors.data.blue },
        { name: 'Violet', hex: colors.data.violet },
        { name: 'Amber', hex: colors.data.amber },
        { name: 'Emerald', hex: colors.data.emerald },
        { name: 'Cyan', hex: colors.data.cyan },
      ];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Data Visualization Palette</SectionLabel>
          <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
            5 distinct colors for charts, graphs, and badges. Auto-contrast labels adapt to each swatch.
          </Text>

          <div style={{ display: 'flex', gap: 8 }}>
            {series.map(({ name, hex }) => (
              <Swatch key={name} hex={hex} label={name} large />
            ))}
          </div>

          {/* Bar chart mockup */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 8 }}>
            {series.map(({ name, hex }, i) => (
              <div
                key={name}
                style={{
                  flex: 1,
                  height: `${[70, 90, 45, 80, 60][i]}%`,
                  backgroundColor: hex,
                  borderRadius: '6px 6px 0 0',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        </div>
      );
    };

    return <InnerComponent />;
  },
};

// ---------------------------------------------------------------------------
// 5. Dark vs Light comparison
// ---------------------------------------------------------------------------

export const DarkVsLight: Story = {
  name: 'Dark vs Light',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Design Modes</SectionLabel>
      <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
        Toggle the theme in the Storybook toolbar to see colors swap between Ink (dark) and Panda (light) modes.
      </Text>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Dark mode preview */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#0A0E15',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #202531',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Text size="xs" weight="semibold" color="white" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Ink — Dark Mode
          </Text>
          <div style={{ backgroundColor: '#161A24', borderRadius: 8, padding: 16, border: '1px solid #202531' }}>
            <Text size="sm" color="white" weight="medium">Card surface</Text>
            <Text size="xs" color="#94A0B8">Secondary text on card</Text>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ height: 6, flex: 2, backgroundColor: '#FFFFFF', borderRadius: 3 }} />
            <div style={{ height: 6, flex: 1, backgroundColor: '#37404F', borderRadius: 3 }} />
          </div>
          <Text size="xs" color="#667085" family="mono">Canvas: #0A0E15 · Surface: #161A24 · Accent: white</Text>
        </div>

        {/* Light mode preview */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #E0E4EB',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Text size="xs" weight="semibold" color="#0F1219" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Panda — Light Mode
          </Text>
          <div style={{ backgroundColor: '#0F1219', borderRadius: 8, padding: 16, border: '1px solid #202531' }}>
            <Text size="sm" color="white" weight="medium">Card surface (dark)</Text>
            <Text size="xs" color="#94A0B8">Text on dark card</Text>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ height: 6, flex: 2, backgroundColor: '#0F1219', borderRadius: 3 }} />
            <div style={{ height: 6, flex: 1, backgroundColor: '#E0E4EB', borderRadius: 3 }} />
          </div>
          <Text size="xs" color="#667085" family="mono">Canvas: white · Surface: #0F1219 · Accent: near-black</Text>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Contrast Checker
// ---------------------------------------------------------------------------

export const ContrastChecker: Story = {
  name: 'Contrast Checker',
  render: () => {
    const InnerComponent = () => {
      const colors = useThemeColors();

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>WCAG Contrast Audit</SectionLabel>
          <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
            Live contrast ratios for all text/background pairings. AA requires 4.5:1 for normal text, 3:1 for large text. AAA requires 7:1.
          </Text>

          {/* Text on canvas */}
          <div>
            <Text size="xs" weight="semibold" color="tertiary" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Text on Canvas
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ContrastRow fg={colors.text.primary} bg={colors.background.canvas} fgLabel="primary" bgLabel="canvas" />
              <ContrastRow fg={colors.text.secondary} bg={colors.background.canvas} fgLabel="secondary" bgLabel="canvas" />
              <ContrastRow fg={colors.text.muted} bg={colors.background.canvas} fgLabel="muted" bgLabel="canvas" />
            </div>
          </div>

          {/* Text on surface (cards) */}
          <div>
            <Text size="xs" weight="semibold" color="tertiary" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Text on Surface (Cards)
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ContrastRow fg={colors.text.inverse} bg={colors.background.surface} fgLabel="inverse" bgLabel="surface" />
              <ContrastRow fg={colors.text.muted} bg={colors.background.surface} fgLabel="muted" bgLabel="surface" />
              <ContrastRow fg={colors.text.secondary} bg={colors.background.surface} fgLabel="secondary" bgLabel="surface" />
            </div>
          </div>

          {/* Text on raised */}
          <div>
            <Text size="xs" weight="semibold" color="tertiary" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Text on Raised (Popovers)
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ContrastRow fg={colors.text.inverse} bg={colors.background.raised} fgLabel="inverse" bgLabel="raised" />
              <ContrastRow fg={colors.text.muted} bg={colors.background.raised} fgLabel="muted" bgLabel="raised" />
            </div>
          </div>

          {/* Status text on canvas */}
          <div>
            <Text size="xs" weight="semibold" color="tertiary" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Status on Canvas
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ContrastRow fg={colors.status.success} bg={colors.background.canvas} fgLabel="success" bgLabel="canvas" />
              <ContrastRow fg={colors.status.warning} bg={colors.background.canvas} fgLabel="warning" bgLabel="canvas" />
              <ContrastRow fg={colors.status.danger} bg={colors.background.canvas} fgLabel="danger" bgLabel="canvas" />
              <ContrastRow fg={colors.status.info} bg={colors.background.canvas} fgLabel="info" bgLabel="canvas" />
            </div>
          </div>
        </div>
      );
    };

    return <InnerComponent />;
  },
};
