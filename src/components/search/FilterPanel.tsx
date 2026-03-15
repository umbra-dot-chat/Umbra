/**
 * FilterPanel — Collapsible advanced filter panel for search.
 *
 * Provides UI controls for from:, in:, date range, and has: filters.
 * Syncs bidirectionally with the search query tokens.
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
  Text,
  HStack,
  VStack,
  Button,
  Chip,
  Input,
  useTheme,
} from '@coexist/wisp-react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import type { ParsedSearchQuery } from '@/services/SearchQueryParser';

// ---------------------------------------------------------------------------
// Date presets
// ---------------------------------------------------------------------------

interface DatePreset {
  label: string;
  value: string;
  getDate: () => string;
}

const DATE_PRESETS: DatePreset[] = [
  { label: 'Today', value: 'today', getDate: () => new Date().toISOString().split('T')[0] },
  { label: 'Last 7 days', value: '7d', getDate: () => daysAgo(7) },
  { label: 'Last 30 days', value: '30d', getDate: () => daysAgo(30) },
  { label: 'Last year', value: '1y', getDate: () => daysAgo(365) },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterPanel() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { parsedQuery, setParsedQuery } = useUnifiedSearch();
  const [fromInput, setFromInput] = useState(parsedQuery.from ?? '');
  const [inInput, setInInput] = useState(parsedQuery.in ?? '');

  const updateFilter = useCallback((updates: Partial<ParsedSearchQuery>) => {
    setParsedQuery({ ...parsedQuery, ...updates });
  }, [parsedQuery, setParsedQuery]);

  const handleFromSubmit = useCallback(() => {
    updateFilter({ from: fromInput || undefined });
  }, [fromInput, updateFilter]);

  const handleInSubmit = useCallback(() => {
    updateFilter({ in: inInput || undefined });
  }, [inInput, updateFilter]);

  const handleDatePreset = useCallback((preset: DatePreset) => {
    updateFilter({ after: preset.getDate(), before: undefined });
  }, [updateFilter]);

  const handleClearDateFilter = useCallback(() => {
    updateFilter({ after: undefined, before: undefined });
  }, [updateFilter]);

  const toggleHasFilter = useCallback((key: 'hasFile' | 'hasReaction' | 'hasPinned' | 'hasLink') => {
    updateFilter({ [key]: parsedQuery[key] ? undefined : true });
  }, [parsedQuery, updateFilter]);

  const handleResetAll = useCallback(() => {
    setFromInput('');
    setInInput('');
    setParsedQuery({ text: parsedQuery.text });
  }, [parsedQuery.text, setParsedQuery]);

  return (
    <VStack style={{
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tc.border.subtle,
    }}>
      {/* From / In filters */}
      <HStack style={{ gap: 12 }}>
        <VStack style={{ flex: 1, gap: 4 }}>
          <Text size="xs" weight="medium" color="secondary">From user</Text>
          <Input
            value={fromInput}
            onChangeText={setFromInput}
            onSubmitEditing={handleFromSubmit}
            placeholder="Username or DID..."
            size="sm"
          />
        </VStack>
        <VStack style={{ flex: 1, gap: 4 }}>
          <Text size="xs" weight="medium" color="secondary">In conversation</Text>
          <Input
            value={inInput}
            onChangeText={setInInput}
            onSubmitEditing={handleInSubmit}
            placeholder="Conversation name..."
            size="sm"
          />
        </VStack>
      </HStack>

      {/* Date presets */}
      <VStack style={{ gap: 4 }}>
        <Text size="xs" weight="medium" color="secondary">Date range</Text>
        <HStack style={{ gap: 6, flexWrap: 'wrap' }}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset.value}
              size="sm"
              variant={parsedQuery.after === preset.getDate() ? 'filled' : 'outlined'}
              clickable
              onPress={() => handleDatePreset(preset)}
            >
              {preset.label}
            </Chip>
          ))}
          {parsedQuery.after && (
            <Chip
              size="sm"
              variant="outlined"
              removable
              onRemove={handleClearDateFilter}
            >
              After {parsedQuery.after}
            </Chip>
          )}
          {parsedQuery.before && (
            <Chip
              size="sm"
              variant="outlined"
              removable
              onRemove={handleClearDateFilter}
            >
              Before {parsedQuery.before}
            </Chip>
          )}
        </HStack>
      </VStack>

      {/* Has filters */}
      <VStack style={{ gap: 4 }}>
        <Text size="xs" weight="medium" color="secondary">Contains</Text>
        <HStack style={{ gap: 6, flexWrap: 'wrap' }}>
          <Chip
            size="sm"
            variant={parsedQuery.hasFile ? 'filled' : 'outlined'}
            clickable
            onPress={() => toggleHasFilter('hasFile')}
          >
            Files
          </Chip>
          <Chip
            size="sm"
            variant={parsedQuery.hasLink ? 'filled' : 'outlined'}
            clickable
            onPress={() => toggleHasFilter('hasLink')}
          >
            Links
          </Chip>
          <Chip
            size="sm"
            variant={parsedQuery.hasReaction ? 'filled' : 'outlined'}
            clickable
            onPress={() => toggleHasFilter('hasReaction')}
          >
            Reactions
          </Chip>
          <Chip
            size="sm"
            variant={parsedQuery.hasPinned ? 'filled' : 'outlined'}
            clickable
            onPress={() => toggleHasFilter('hasPinned')}
          >
            Pinned
          </Chip>
        </HStack>
      </VStack>

      {/* Reset */}
      <HStack style={{ justifyContent: 'flex-end' }}>
        <Button variant="tertiary" size="xs" onPress={handleResetAll}>
          Reset filters
        </Button>
      </HStack>
    </VStack>
  );
}

FilterPanel.displayName = 'FilterPanel';
