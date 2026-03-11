import React from 'react';
import { Toggle } from '@wisp-ui/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  mode: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
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
