/**
 * @module components/code-block
 * @description React Native CodeBlock for the Wisp design system.
 *
 * Renders code with optional line numbers in a horizontal ScrollView.
 * Copy-to-clipboard via RN Clipboard API.
 */

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { CodeBlockVariant } from '@coexist/wisp-core/types/CodeBlock.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CodeBlockProps extends ViewProps {
  /** The code string to display. */
  code: string;
  /** Language identifier shown in the header label. */
  language?: string;
  /** Show line numbers. @default false */
  showLineNumbers?: boolean;
  /** 1-based line numbers to highlight. */
  highlightLines?: number[];
  /** Show copy button. @default true */
  copyable?: boolean;
  /** Maximum height before scrolling. */
  maxHeight?: number;
  /** Visual variant. @default 'default' */
  variant?: CodeBlockVariant;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CodeBlock = forwardRef<View, CodeBlockProps>(
  function CodeBlock(
    {
      code,
      language,
      showLineNumbers = false,
      highlightLines,
      copyable = true,
      maxHeight,
      variant = 'default',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const [copied, setCopied] = useState(false);

    const lines = useMemo(() => code.split('\n'), [code]);

    const handleCopy = useCallback(() => {
      try {
        const ClipboardModule = require('@react-native-clipboard/clipboard').default;
        ClipboardModule.setString(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard not available
      }
    }, [code]);

    const isOutlined = variant === 'outlined';

    const containerStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.md,
      borderWidth: isOutlined ? 1 : 0,
      borderColor: isOutlined ? themeColors.border.subtle : 'transparent',
      backgroundColor: themeColors.background.raised,
      overflow: 'hidden',
      ...(maxHeight ? { maxHeight } : {}),
    }), [isOutlined, themeColors, maxHeight]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    }), [themeColors]);

    const headerTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: defaultTypography.weights.medium,
      color: themeColors.text.muted,
      textTransform: 'uppercase',
    }), [themeColors]);

    const copyBtnTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    const lineNumberStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontFamily: 'monospace',
      color: themeColors.text.muted,
      textAlign: 'right',
      minWidth: 28,
      paddingRight: defaultSpacing.md,
      lineHeight: 20,
    }), [themeColors]);

    const codeTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontFamily: 'monospace',
      color: themeColors.text.primary,
      lineHeight: 20,
    }), [themeColors]);

    const highlightSet = useMemo(
      () => new Set(highlightLines ?? []),
      [highlightLines],
    );

    const highlightBg = useMemo(
      () => themeColors.accent.primary + '14',
      [themeColors],
    );

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {(language || copyable) && (
          <View style={headerStyle}>
            <Text style={headerTextStyle}>{language ?? ''}</Text>
            {copyable && (
              <Pressable onPress={handleCopy}>
                <Text style={copyBtnTextStyle}>{copied ? '\u{2713} Copied' : 'Copy'}</Text>
              </Pressable>
            )}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ padding: defaultSpacing.md }}>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isHighlighted = highlightSet.has(lineNum);
              const rowStyle: ViewStyle = {
                flexDirection: 'row',
                ...(isHighlighted ? { backgroundColor: highlightBg } : {}),
              };

              return (
                <View key={i} style={rowStyle}>
                  {showLineNumbers && (
                    <Text style={lineNumberStyle}>{lineNum}</Text>
                  )}
                  <Text style={codeTextStyle}>{line || ' '}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  },
);

CodeBlock.displayName = 'CodeBlock';
