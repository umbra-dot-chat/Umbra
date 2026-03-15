/**
 * MobileBackButton — Shows a back arrow button only on mobile viewports.
 *
 * Used on pages like Friends, Files, and community pages to navigate
 * back to the sidebar/conversation list on small screens.
 */

import React from 'react';
import { Button, useTheme } from '@coexist/wisp-react-native';
import { ArrowLeftIcon } from '@/components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';
import { dbg } from '@/utils/debug';

interface MobileBackButtonProps {
  onPress: () => void;
  label?: string;
  /** When true, show the label text next to the arrow icon */
  showLabel?: boolean;
}

export function MobileBackButton({ onPress, label = 'Back', showLabel = false }: MobileBackButtonProps) {
  if (__DEV__) dbg.trackRender('MobileBackButton');
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  if (!isMobile) return null;

  return (
    <Button
      variant="tertiary"
      size="sm"
      onPress={onPress}
      accessibilityLabel={label}
      iconLeft={<ArrowLeftIcon size={20} color={theme.colors.text.secondary} />}
    >
      {showLabel ? label : undefined}
    </Button>
  );
}
