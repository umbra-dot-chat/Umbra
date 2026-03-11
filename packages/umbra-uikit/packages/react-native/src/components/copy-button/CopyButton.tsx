import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type CopyButtonSize = 'sm' | 'md' | 'lg';
type CopyButtonVariant = 'outline' | 'ghost' | 'minimal';

const sizeMap: Record<CopyButtonSize, { height: number; iconSize: number; fontSize: number; paddingX: number; gap: number }> = {
  sm: { height: 28, iconSize: 14, fontSize: defaultTypography.sizes.xs.fontSize, paddingX: 10, gap: defaultSpacing.xs },
  md: { height: 32, iconSize: 16, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 12, gap: defaultSpacing.sm },
  lg: { height: 36, iconSize: 18, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: 14, gap: defaultSpacing.sm },
};

function CopyIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </Svg>
  );
}

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export interface CopyButtonProps {
  value: string;
  size?: CopyButtonSize;
  label?: string;
  variant?: CopyButtonVariant;
  copiedLabel?: string;
  copiedDuration?: number;
  onCopy?: (value: string) => void;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const CopyButton = forwardRef<View, CopyButtonProps>(function CopyButton(
  { value, size = 'md', label, variant = 'outline', copiedLabel = 'Copied!', copiedDuration = 2000,
    onCopy, onPress, disabled = false, style: userStyle }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const cfg = sizeMap[size];
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || isCopied) return;
    onPress?.();
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(value);
    } catch {
      // clipboard not available
    }
    setIsCopied(true);
    onCopy?.(value);
    timeoutRef.current = setTimeout(() => { setIsCopied(false); timeoutRef.current = null; }, copiedDuration);
  }, [disabled, isCopied, value, onCopy, onPress, copiedDuration]);

  const btnStyle = useMemo<ViewStyle>(() => {
    const isMinimal = variant === 'minimal';
    const isGhost = variant === 'ghost';
    return {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      height: cfg.height, paddingHorizontal: isMinimal ? 0 : cfg.paddingX,
      borderRadius: defaultRadii.md, gap: cfg.gap,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: tc.border.subtle,
      backgroundColor: isMinimal || isGhost ? 'transparent' : tc.background.surface,
      opacity: disabled ? 0.4 : 1,
    };
  }, [cfg, variant, tc, disabled]);

  const iconColor = isCopied ? tc.accent.primary : tc.text.secondary;
  const displayLabel = isCopied ? copiedLabel : label;

  return (
    <Pressable ref={ref} onPress={handlePress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
      style={[btnStyle, userStyle]}>
      {isCopied ? <CheckIcon size={cfg.iconSize} color={iconColor} /> : <CopyIcon size={cfg.iconSize} color={iconColor} />}
      {displayLabel ? <RNText style={{ fontSize: cfg.fontSize, color: isCopied ? tc.accent.primary : tc.text.primary } as TextStyle}>{displayLabel}</RNText> : null}
    </Pressable>
  );
});

CopyButton.displayName = 'CopyButton';
