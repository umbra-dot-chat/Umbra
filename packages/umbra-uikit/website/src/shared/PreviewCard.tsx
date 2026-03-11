import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, WispProvider, useThemeColors, useTheme, Badge } from '@wisp-ui/react';
import type { ComponentEntry } from '../registry/types';
import { detailPath } from '../utils/slug';

interface PreviewCardProps {
  entry: ComponentEntry;
}

/**
 * Gallery card: live-rendered component preview + name + variant count.
 * Clicking navigates to the component detail page.
 */
export function PreviewCard({ entry }: PreviewCardProps) {
  const navigate = useNavigate();
  const { mode, overrides } = useTheme();
  const colors = useThemeColors();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => navigate(detailPath(entry.category, entry.slug))}
      style={{ cursor: 'pointer' }}
    >
      <Card
        variant="outlined"
        padding="none"
        radius="lg"
        style={{
          overflow: 'hidden',
          transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
          borderColor: hovered ? colors.text.secondary : colors.border.strong,
          boxShadow: hovered ? `0 0 0 1px ${colors.text.secondary}` : 'none',
          transform: pressed ? 'scale(0.98)' : hovered ? 'translateY(-2px)' : undefined,
        }}
      >
        {/* Preview area */}
        <WispProvider mode={mode} overrides={overrides} injectCssVars={false}>
          <PreviewArea>{entry.cardPreview}</PreviewArea>
        </WispProvider>

        {/* Info strip */}
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
        >
          <Text size="sm" weight="semibold">
            {entry.name}
          </Text>
          {entry.variantCount != null && entry.variantCount > 0 && (
            <Badge size="sm" variant="default">
              {entry.variantCount} variant{entry.variantCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

function PreviewArea({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: colors.background.canvas,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 160,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
