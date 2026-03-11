import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type SocialProvider = 'google' | 'apple' | 'facebook' | 'github' | 'x' | 'microsoft' | 'discord' | 'slack';
type SocialButtonSize = 'sm' | 'md' | 'lg';
type SocialButtonVariant = 'filled' | 'outline';

interface ProviderConfig { name: string; bgColor: string; textColor: string; }
const providers: Record<SocialProvider, ProviderConfig> = {
  google: { name: 'Google', bgColor: '#FFFFFF', textColor: '#1F1F1F' },
  apple: { name: 'Apple', bgColor: '#000000', textColor: '#FFFFFF' },
  facebook: { name: 'Facebook', bgColor: '#1877F2', textColor: '#FFFFFF' },
  github: { name: 'GitHub', bgColor: '#24292F', textColor: '#FFFFFF' },
  x: { name: 'X', bgColor: '#000000', textColor: '#FFFFFF' },
  microsoft: { name: 'Microsoft', bgColor: '#2F2F2F', textColor: '#FFFFFF' },
  discord: { name: 'Discord', bgColor: '#5865F2', textColor: '#FFFFFF' },
  slack: { name: 'Slack', bgColor: '#4A154B', textColor: '#FFFFFF' },
};

const sizeMap: Record<SocialButtonSize, { height: number; paddingX: number; fontSize: number; iconSize: number; gap: number }> = {
  sm: { height: 36, paddingX: 14, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 18, gap: defaultSpacing.sm },
  md: { height: 40, paddingX: 16, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 20, gap: defaultSpacing.md },
  lg: { height: 44, paddingX: 20, fontSize: defaultTypography.sizes.base.fontSize, iconSize: 22, gap: defaultSpacing.md },
};

function GoogleIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function AppleIcon({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

function FacebookIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

function GitHubIcon({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </Svg>
  );
}

function XIcon({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </Svg>
  );
}

function MicrosoftIcon({ size }: { size: number }) {
  const s = size * 0.42;
  const g = size * 0.04;
  const off = size * 0.29;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={off} y={off} width={s} height={s} fill="#F25022" />
      <Rect x={off + s + g} y={off} width={s} height={s} fill="#7FBA00" />
      <Rect x={off} y={off + s + g} width={s} height={s} fill="#00A4EF" />
      <Rect x={off + s + g} y={off + s + g} width={s} height={s} fill="#FFB900" />
    </Svg>
  );
}

function DiscordIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.125-.094.25-.192.37-.292a.074.074 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.1.245.198.372.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function SlackIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A" />
      <Path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0" />
      <Path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521V2.522A2.527 2.527 0 0115.164 0a2.528 2.528 0 012.521 2.522v6.312z" fill="#2EB67D" />
      <Path d="M15.164 18.956a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.164 24a2.527 2.527 0 01-2.521-2.522v-2.522h2.521zm0-1.271a2.527 2.527 0 01-2.521-2.521 2.528 2.528 0 012.521-2.521h6.314A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.522 2.521h-6.314z" fill="#ECB22E" />
    </Svg>
  );
}

const providerIcons: Record<SocialProvider, React.FC<{ size: number; color?: string }>> = {
  google: GoogleIcon, apple: AppleIcon, facebook: FacebookIcon, github: GitHubIcon,
  x: XIcon, microsoft: MicrosoftIcon, discord: DiscordIcon, slack: SlackIcon,
};

export interface SocialButtonProps {
  provider: SocialProvider;
  action?: string;
  variant?: SocialButtonVariant;
  size?: SocialButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SocialButton = forwardRef<View, SocialButtonProps>(function SocialButton(
  { provider, action = 'Sign in with', variant = 'filled', size = 'md', fullWidth = false,
    iconOnly = false, disabled = false, onPress, style: userStyle }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const cfg = sizeMap[size];
  const pc = providers[provider];
  const ProviderIcon = providerIcons[provider];

  const isFilled = variant === 'filled';
  const bg = isFilled ? pc.bgColor : 'transparent';
  const fg = isFilled ? pc.textColor : tc.text.primary;
  const borderColor = isFilled ? pc.bgColor : tc.border.subtle;

  const btnStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: cfg.height, paddingHorizontal: iconOnly ? cfg.gap : cfg.paddingX,
    borderRadius: defaultRadii.md, borderWidth: 1, borderColor,
    backgroundColor: bg, gap: cfg.gap,
    opacity: disabled ? 0.4 : 1,
    ...(fullWidth ? { width: '100%' } : {}),
  }), [cfg, bg, borderColor, disabled, fullWidth, iconOnly]);

  const iconColor = isFilled ? pc.textColor : undefined;

  return (
    <Pressable ref={ref} onPress={onPress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={iconOnly ? action + ' ' + pc.name : undefined}
      style={[btnStyle, userStyle]}>
      {ProviderIcon && <ProviderIcon size={cfg.iconSize} color={iconColor} />}
      {!iconOnly && (
        <RNText style={{ fontSize: cfg.fontSize, fontWeight: defaultTypography.weights.medium, color: fg } as TextStyle}>
          {action} {pc.name}
        </RNText>
      )}
    </Pressable>
  );
});

SocialButton.displayName = 'SocialButton';
