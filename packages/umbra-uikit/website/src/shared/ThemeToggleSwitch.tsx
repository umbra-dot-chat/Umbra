import React from 'react';
import { Toggle } from '@wisp-ui/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleSwitchProps {
  mode: 'light' | 'dark';
  onToggle: () => void;
}

/**
 * Theme toggle using the Toggle switch primitive with Sun/Moon icons.
 * Used in the TopBar on component detail pages.
 */
export function ThemeToggleSwitch({ mode, onToggle }: ThemeToggleSwitchProps) {
  return (
    <Toggle
      checked={mode === 'dark'}
      onChange={onToggle}
      size="md"
      checkedContent={<Moon size={14} />}
      uncheckedContent={<Sun size={14} />}
    />
  );
}
