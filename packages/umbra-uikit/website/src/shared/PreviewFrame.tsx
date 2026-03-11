import React, { useState, useEffect } from 'react';
import { Card, WispProvider, useThemeColors, useTheme, Text } from '@wisp-ui/react';
import { Sun, Moon } from 'lucide-react';

interface PreviewFrameProps {
  label?: string;
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark';
  /** If true, hides the light/dark toggle. */
  hideToggle?: boolean;
}

/**
 * Isolated preview frame with its own WispProvider + theme toggle.
 * Each frame renders children in a nested theme context with injectCssVars={false}.
 *
 * The Card wrapper lives INSIDE the nested provider so that theme overrides
 * (e.g. radii changes from a ThemeEditor) are reflected on the border radius
 * of the frame itself.
 */
export function PreviewFrame({
  label,
  children,
  defaultMode = 'dark',
  hideToggle = false,
}: PreviewFrameProps) {
  const { mode: globalMode, overrides } = useTheme();
  const [frameMode, setFrameMode] = useState<'light' | 'dark'>(defaultMode ?? globalMode);

  // Sync with global theme when it changes (unless user manually toggled this frame)
  useEffect(() => {
    setFrameMode(globalMode);
  }, [globalMode]);

  return (
    <WispProvider mode={frameMode} overrides={overrides} injectCssVars={false}>
      <PreviewFrameInner
        label={label}
        hideToggle={hideToggle}
        frameMode={frameMode}
        onToggleMode={() => setFrameMode((m) => (m === 'dark' ? 'light' : 'dark'))}
      >
        {children}
      </PreviewFrameInner>
    </WispProvider>
  );
}

/** Inner shell rendered inside the nested WispProvider. */
function PreviewFrameInner({
  label,
  hideToggle,
  frameMode,
  onToggleMode,
  children,
}: {
  label?: string;
  hideToggle?: boolean;
  frameMode: 'light' | 'dark';
  onToggleMode: () => void;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <Card variant="outlined" padding="none" radius="lg" style={{ overflow: 'hidden' }}>
      {/* Header bar */}
      {(label || !hideToggle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <Text size="xs" weight="semibold" color="secondary">
            {label ?? ''}
          </Text>
          {!hideToggle && (
            <div
              onClick={onToggleMode}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: 6,
              }}
              title={frameMode === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {frameMode === 'dark' ? (
                <Sun size={14} color={colors.text.secondary} />
              ) : (
                <Moon size={14} color={colors.text.secondary} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview content area */}
      <div
        style={{
          padding: 24,
          backgroundColor: colors.background.canvas,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
        }}
      >
        {children}
      </div>
    </Card>
  );
}
