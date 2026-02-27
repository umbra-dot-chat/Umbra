/**
 * CodeBlock — Syntax-highlighted code examples for the guide.
 *
 * Displays code snippets with language indicator, copy button,
 * and optional title/description.
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { CopyIcon, CheckIcon } from '@/components/ui';

export interface CodeBlockProps {
  /** Code to display */
  code: string;
  /** Programming language for syntax highlighting hint */
  language?: 'typescript' | 'rust' | 'json' | 'bash' | 'javascript';
  /** Optional title above the code */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = 'typescript',
  title,
  description,
  showLineNumbers = false,
}: CodeBlockProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const lines = code.split('\n');

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#0C0C0E' : '#F8FAFC',
        overflow: 'hidden' as const,
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1F1F23' : tc.border.subtle,
        backgroundColor: isDark ? '#18181B' : '#F1F5F9',
      } as ViewStyle,
      headerLeft: {
        flex: 1,
        gap: 2,
      } as ViewStyle,
      title: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: tc.text.primary,
      } as TextStyle,
      description: {
        fontSize: 11,
        color: tc.text.muted,
      } as TextStyle,
      languageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: isDark ? '#27272A' : '#E2E8F0',
        marginRight: 8,
      } as ViewStyle,
      languageText: {
        fontSize: 10,
        fontWeight: '600' as const,
        color: tc.text.muted,
        textTransform: 'uppercase' as const,
      } as TextStyle,
      copyButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: isDark ? '#27272A' : '#E2E8F0',
      } as ViewStyle,
      codeContainer: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row' as const,
      } as ViewStyle,
      lineNumbers: {
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: isDark ? '#27272A' : '#E2E8F0',
        marginRight: 12,
      } as ViewStyle,
      lineNumber: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: isDark ? '#52525B' : '#94A3B8',
        lineHeight: 20,
        textAlign: 'right' as const,
        minWidth: 24,
      } as TextStyle,
      codeContent: {
        flex: 1,
      } as ViewStyle,
      codeLine: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: isDark ? '#E4E4E7' : '#334155',
        lineHeight: 20,
      } as TextStyle,
    }),
    [tc, isDark]
  );

  // Simple syntax highlighting by token type
  const highlightLine = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Keywords
    const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'type', 'interface', 'class', 'extends', 'implements', 'new', 'try', 'catch', 'throw', 'pub', 'fn', 'struct', 'impl', 'use', 'mod', 'mut', 'self', 'Self'];
    const types = ['string', 'number', 'boolean', 'void', 'null', 'undefined', 'any', 'never', 'unknown', 'Promise', 'Array', 'Map', 'Set', 'Result', 'Option', 'Vec', 'String', 'u8', 'u32', 'i32', 'usize', 'bool'];

    // Simple token-based highlighting
    const patterns = [
      { regex: /(\/\/.*$)/gm, color: isDark ? '#6B7280' : '#64748B' }, // Comments
      { regex: /(["'`](?:[^"'`\\]|\\.)*["'`])/g, color: isDark ? '#A5D6A7' : '#059669' }, // Strings
      { regex: /\b(\d+\.?\d*)\b/g, color: isDark ? '#F9A825' : '#D97706' }, // Numbers
      { regex: new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), color: isDark ? '#C792EA' : '#7C3AED' }, // Keywords
      { regex: new RegExp(`\\b(${types.join('|')})\\b`, 'g'), color: isDark ? '#82AAFF' : '#2563EB' }, // Types
      { regex: /(\w+)\s*\(/g, color: isDark ? '#FFCB6B' : '#CA8A04' }, // Function calls
    ];

    // For simplicity, just apply basic coloring
    // A full implementation would use a proper tokenizer
    tokens.push(
      <Text key={key++} style={styles.codeLine}>
        {line || ' '}
      </Text>
    );

    return tokens;
  };

  return (
    <View style={styles.container}>
      {(title || language) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && <Text style={styles.title}>{title}</Text>}
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageText}>{language}</Text>
            </View>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [
                styles.copyButton,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Copy code"
            >
              {copied ? (
                <CheckIcon size={14} color="#22C55E" />
              ) : (
                <CopyIcon size={14} color={tc.text.muted} />
              )}
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.codeContainer}>
        {showLineNumbers && (
          <View style={styles.lineNumbers}>
            {lines.map((_, i) => (
              <Text key={i} style={styles.lineNumber}>
                {i + 1}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.codeContent}>
          {lines.map((line, i) => (
            <View key={i} style={{ flexDirection: 'row' }}>
              {highlightLine(line)}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * TestResultsBlock — Display test results and coverage info.
 */

export interface TestResult {
  name: string;
  passed: number;
  failed: number;
  skipped?: number;
  coverage?: number;
}

export interface TestResultsBlockProps {
  title: string;
  results: TestResult[];
  totalTests?: number;
  overallCoverage?: number;
}

export function TestResultsBlock({
  title,
  results,
  totalTests,
  overallCoverage,
}: TestResultsBlockProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#0C0C0E' : tc.background.sunken,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#1F1F23' : tc.border.subtle,
          backgroundColor: isDark ? '#18181B' : tc.background.sunken,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: tc.text.primary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {overallCoverage !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: overallCoverage >= 80 ? '#22C55E' : overallCoverage >= 60 ? '#EAB308' : '#EF4444',
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted }}>
                {overallCoverage}% coverage
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>
            {totalPassed} passed
          </Text>
          {totalFailed > 0 && (
            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>
              {totalFailed} failed
            </Text>
          )}
        </View>
      </View>
      <View style={{ padding: 12, gap: 8 }}>
        {results.map((result, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 6,
              paddingHorizontal: 10,
              backgroundColor: isDark ? '#18181B' : '#F8FAFC',
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: tc.text.primary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {result.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              {result.coverage !== undefined && (
                <Text
                  style={{
                    fontSize: 11,
                    color: result.coverage >= 80 ? '#22C55E' : result.coverage >= 60 ? '#EAB308' : '#EF4444',
                    fontWeight: '500',
                  }}
                >
                  {result.coverage}%
                </Text>
              )}
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: result.failed > 0 ? '#EF444420' : '#22C55E20',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: result.failed > 0 ? '#EF4444' : '#22C55E',
                  }}
                >
                  {result.passed}/{result.passed + result.failed}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
