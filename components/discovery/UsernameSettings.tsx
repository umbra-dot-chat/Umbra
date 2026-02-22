/**
 * UsernameSettings - Settings panel for managing username (Name#Tag)
 *
 * Shows current username with options to change or release it.
 * If no username is set, shows an input to register one.
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Card,
  Input,
  Button,
  Alert,
  Spinner,
  useTheme,
} from '@coexist/wisp-react-native';
import Svg, { Path } from 'react-native-svg';

import { useUsername } from '@/packages/umbra-service/src/discovery/hooks';

// Icons
function UserTagIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    </Svg>
  );
}

function EditIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

function CopyIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
    </Svg>
  );
}

export interface UsernameSettingsProps {
  /** The user's Umbra DID. */
  did: string | null;
  /** Custom style for the container. */
  style?: ViewStyle;
}

export function UsernameSettings({ did, style }: UsernameSettingsProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const {
    username,
    name,
    tag,
    isLoading,
    error,
    register,
    change,
    release,
  } = useUsername(did);

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  // Start editing (change username)
  const handleStartEdit = useCallback(() => {
    setInputValue(name ?? '');
    setEditing(true);
  }, [name]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setInputValue('');
  }, []);

  // Save new username
  const handleSave = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (username) {
      // Changing existing username
      const result = await change(trimmed);
      if (result) {
        setEditing(false);
        setInputValue('');
      }
    } else {
      // Registering new username
      const result = await register(trimmed);
      if (result) {
        setEditing(false);
        setInputValue('');
      }
    }
  }, [inputValue, username, change, register]);

  // Release username
  const handleRelease = useCallback(async () => {
    await release();
    setEditing(false);
  }, [release]);

  // Copy username
  const handleCopy = useCallback(() => {
    if (!username) return;
    try {
      navigator.clipboard.writeText(username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [username]);

  if (!did) return null;

  return (
    <Card variant="outlined" padding="md" style={style}>
      <VStack gap="md">
        {/* Header */}
        <HStack gap="sm" style={{ alignItems: 'center' }}>
          <UserTagIcon size={18} color={tc.text.primary} />
          <Text size="sm" weight="semibold">
            Username
          </Text>
        </HStack>

        {/* Loading state */}
        {isLoading && !editing && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Spinner size="sm" />
          </View>
        )}

        {/* Error */}
        {error && (
          <Alert variant="danger" title="Error" description={error.message} />
        )}

        {/* Current username display */}
        {username && !editing && (
          <VStack gap="sm">
            <Card variant="filled" padding="sm">
              <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <VStack gap="xs">
                  <Text size="lg" weight="bold">
                    {username}
                  </Text>
                  <Text size="xs" color="muted">
                    Share this with friends so they can find you
                  </Text>
                </VStack>
                <HStack gap="sm">
                  <Pressable
                    onPress={handleCopy}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: copied ? tc.status.successSurface : tc.background.sunken,
                    }}
                  >
                    <CopyIcon
                      size={16}
                      color={copied ? tc.status.success : tc.text.secondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={handleStartEdit}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: tc.background.sunken,
                    }}
                  >
                    <EditIcon size={16} color={tc.text.secondary} />
                  </Pressable>
                </HStack>
              </HStack>
            </Card>
          </VStack>
        )}

        {/* No username — prompt to create */}
        {!username && !editing && !isLoading && (
          <VStack gap="sm">
            <Text size="sm" color="secondary">
              Set a username so friends can find you by name instead of DID.
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                setInputValue('');
                setEditing(true);
              }}
            >
              Set Username
            </Button>
          </VStack>
        )}

        {/* Edit / Create mode */}
        {editing && (
          <VStack gap="md">
            <Input
              label={username ? 'New Username' : 'Username'}
              placeholder="e.g., Matt"
              value={inputValue}
              onChangeText={setInputValue}
              fullWidth
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text size="xs" color="muted">
              1-32 characters. Letters, numbers, underscores, and hyphens only. A
              numeric tag will be auto-assigned.
            </Text>

            {username && (
              <Alert
                variant="warning"
                description="Changing your username will assign a new tag. Your old username will become available for others."
              />
            )}

            <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
              {username && (
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={handleRelease}
                  disabled={isLoading}
                >
                  Remove Username
                </Button>
              )}
              <View style={{ flex: 1 }} />
              <Button
                variant="tertiary"
                size="sm"
                onPress={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleSave}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? 'Saving...' : username ? 'Change' : 'Register'}
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

UsernameSettings.displayName = 'UsernameSettings';
