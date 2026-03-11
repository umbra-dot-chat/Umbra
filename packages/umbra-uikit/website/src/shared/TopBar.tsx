import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useThemeColors, Button, Text, Kbd, Dialog, ThemeEditor } from '@wisp-ui/react';
import { Search, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  onSearchOpen?: () => void;
}

export function TopBar({ onSearchOpen }: TopBarProps) {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();
  const colors = useThemeColors();
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);

  return (
    <div
      style={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        gap: 12,
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}
    >
      {/* Search trigger */}
      <div
        onClick={onSearchOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          cursor: 'pointer',
          flex: 1,
          maxWidth: 400,
          marginRight: 'auto',
        }}
      >
        <Search size={16} color={colors.text.muted} />
        <Text size="sm" color="tertiary">
          Search…
        </Text>
        <Kbd size="sm" style={{ marginLeft: 'auto' }}>⌘K</Kbd>
      </div>

      {/* Dark/light mode toggle switch */}
      <ThemeToggle mode={mode} onToggle={toggleMode} />

      {/* Theme editor icon */}
      <Button
        variant="tertiary"
        size="sm"
        iconLeft={<Settings size={16} />}
        onClick={() => setThemeEditorOpen(true)}
        title="Theme settings"
      />

      {/* Docs button */}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate('/docs')}
      >
        Docs
      </Button>

      {/* Components button */}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => navigate('/components')}
      >
        Components
      </Button>

      {/* Theme editor dialog */}
      <Dialog
        open={themeEditorOpen}
        onClose={() => setThemeEditorOpen(false)}
        size="lg"
        title="Theme Settings"
      >
        <ThemeEditor
          showModeToggle={false}
          showReset
          maxHeight={480}
        />
      </Dialog>
    </div>
  );
}
