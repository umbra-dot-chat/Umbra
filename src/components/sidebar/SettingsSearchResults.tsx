/**
 * SettingsSearchResults — Renders filtered settings items in the sidebar
 * when the user searches on the settings page.
 *
 * Uses HighlightedText for gradient-highlighted matches.
 */

import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { useTranslation } from 'react-i18next';
import { HighlightedText } from '@/components/search/HighlightedText';
import type { SettingsSearchItem } from '@/services/SettingsSearchService';

interface SettingsSearchResultsProps {
  results: SettingsSearchItem[];
  query: string;
  onSelect: (sectionId: string, subsectionId?: string) => void;
}

export function SettingsSearchResults({ results, query, onSelect }: SettingsSearchResultsProps) {
  const { theme, mode } = useTheme();
  const { t } = useTranslation('sidebar');
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const terms = query.trim().split(/\s+/).filter(Boolean);

  if (results.length === 0 && query.trim()) {
    return (
      <Box style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text size="sm" style={{ color: tc.text.secondary }}>
          {t('noSettingsFound')}
        </Text>
      </Box>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Box style={{ paddingHorizontal: 4, paddingTop: 4 }}>
        {results.map((item, i) => {
          const Icon = item.icon;
          const key = item.subsectionId
            ? `${item.sectionId}/${item.subsectionId}`
            : item.sectionId;

          return (
            <Pressable
              key={key}
              onPress={() => onSelect(item.sectionId, item.subsectionId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: pressed
                  ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                  : 'transparent',
                marginBottom: 1,
              })}
            >
              <Icon size={16} color={tc.text.secondary} />
              <Box style={{ flex: 1 }}>
                <HighlightedText
                  text={item.label}
                  terms={terms}
                  size="sm"
                />
                {item.parentLabel && (
                  <Text size="xs" style={{ color: tc.text.secondary, marginTop: 1 }}>
                    {item.parentLabel}
                  </Text>
                )}
              </Box>
            </Pressable>
          );
        })}
      </Box>
    </ScrollView>
  );
}
