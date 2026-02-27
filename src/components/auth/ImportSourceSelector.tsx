/**
 * ImportSourceSelector - Select a chat platform to import from
 *
 * Displays cards for each supported import source with instructions.
 */

import React, { useCallback, useRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Card,
  Button,
  Spinner,
  useTheme,
} from '@coexist/wisp-react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import type { ImportSource, ImportSourceInfo } from '@umbra/service';
import { useImportSources } from '@umbra/service';

// Platform icons
function DiscordIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function TelegramIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m22 2-7 20-4-9-9-4Z" />
      <Path d="M22 2 11 13" />
    </Svg>
  );
}

function WhatsAppIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

function SignalIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Svg>
  );
}

function SlackIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
      <Path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      <Path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
      <Path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
      <Path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
      <Path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
      <Path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
      <Path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
    </Svg>
  );
}

function UploadIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="M17 8l-5-5-5 5" />
      <Path d="M12 3v12" />
    </Svg>
  );
}

/**
 * Get platform icon by source ID.
 */
function PlatformIcon({ source, size = 24, color }: { source: ImportSource; size?: number; color: string }) {
  switch (source) {
    case 'discord':
      return <DiscordIcon size={size} color={color} />;
    case 'telegram':
      return <TelegramIcon size={size} color={color} />;
    case 'whatsapp':
      return <WhatsAppIcon size={size} color={color} />;
    case 'signal':
      return <SignalIcon size={size} color={color} />;
    case 'slack':
      return <SlackIcon size={size} color={color} />;
    default:
      return null;
  }
}

export interface ImportSourceSelectorProps {
  /** Called when a source is selected and file is chosen. */
  onSelect: (source: ImportSource, file: File) => void;
  /** Whether import is in progress. */
  loading?: boolean;
  /** Currently selected source. */
  selectedSource?: ImportSource | null;
  /** Error message. */
  error?: string | null;
  /** Whether to show compact view. */
  compact?: boolean;
}

/**
 * Single import source card.
 */
function ImportSourceCard({
  source,
  onSelect,
  loading,
  selected,
}: {
  source: ImportSourceInfo;
  onSelect: (file: File) => void;
  loading?: boolean;
  selected?: boolean;
}) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onSelect(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onSelect]
  );

  const acceptedFiles = source.acceptedFiles.join(',');

  return (
    <Pressable onPress={handlePress} disabled={loading}>
      {({ pressed }) => (
        <Card
          variant="outlined"
          padding="md"
          style={{
            opacity: loading && !selected ? 0.5 : pressed ? 0.8 : 1,
            borderColor: selected ? source.color : theme.colors.border.subtle,
            borderWidth: selected ? 2 : 1,
          }}
        >
          <HStack gap="md" style={{ alignItems: 'center' }}>
            {/* Icon */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: `${source.color}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading && selected ? (
                <Spinner size="sm" />
              ) : (
                <PlatformIcon source={source.id} size={24} color={source.color} />
              )}
            </View>

            {/* Info */}
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text size="md" weight="semibold">
                {source.name}
              </Text>
              <Text size="xs" color="muted" numberOfLines={2}>
                {source.description}
              </Text>
            </VStack>

            {/* Upload indicator */}
            <UploadIcon size={20} color={theme.colors.text.muted} />
          </HStack>

          {/* Hidden file input (web only) */}
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFiles}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}
        </Card>
      )}
    </Pressable>
  );
}

export function ImportSourceSelector({
  onSelect,
  loading = false,
  selectedSource = null,
  error = null,
  compact = false,
}: ImportSourceSelectorProps) {
  const { theme } = useTheme();
  const { sources } = useImportSources();

  const handleSourceSelect = useCallback(
    (source: ImportSource) => (file: File) => {
      onSelect(source, file);
    },
    [onSelect]
  );

  // Show only popular sources in compact mode
  const displaySources = compact
    ? sources.filter((s) => ['discord', 'telegram', 'whatsapp'].includes(s.id))
    : sources;

  return (
    <VStack gap="md">
      <VStack gap="xs">
        <Text size="sm" weight="semibold" color="secondary">
          Import from another app
        </Text>
        <Text size="xs" color="muted">
          Bring your chat history from another platform. Select a source and upload your export file.
        </Text>
      </VStack>

      <VStack gap="sm">
        {displaySources.map((source) => (
          <ImportSourceCard
            key={source.id}
            source={source}
            onSelect={handleSourceSelect(source.id)}
            loading={loading}
            selected={selectedSource === source.id}
          />
        ))}
      </VStack>

      {error && (
        <Text size="xs" color="muted" style={{ color: theme.colors.status.danger }}>
          {error}
        </Text>
      )}

      {compact && sources.length > displaySources.length && (
        <Text size="xs" color="muted" style={{ textAlign: 'center' }}>
          + {sources.length - displaySources.length} more platforms available
        </Text>
      )}
    </VStack>
  );
}

ImportSourceSelector.displayName = 'ImportSourceSelector';
