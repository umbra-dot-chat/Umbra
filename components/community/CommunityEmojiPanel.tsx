/**
 * CommunityEmojiPanel — Emoji management settings panel.
 *
 * Self-contained component that manages custom emoji for a community.
 * Handles upload, rename, delete, and displays a searchable grid.
 * Wires into the UmbraService for all CRUD operations and broadcasts
 * events via useCommunitySync for real-time sync.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text as RNText,
  Image,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, Button, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';

import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunitySync } from '@/hooks/useCommunitySync';
import type { CommunityEmoji } from '@umbra/service';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

function UploadIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 16 12 12 8 16" />
      <Line x1="12" y1="12" x2="12" y2="21" />
      <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </Svg>
  );
}

function TrashIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

function EditIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommunityEmojiPanelProps {
  communityId: string;
  emoji: CommunityEmoji[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EMOJI = 1000;
const MAX_EMOJI_SIZE = 256 * 1024; // 256 KB
const ALLOWED_TYPES = ['image/png', 'image/gif', 'image/webp', 'image/apng', 'image/jpeg'];
const EMOJI_NAME_REGEX = /^[a-zA-Z0-9_]{2,32}$/;
const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityEmojiPanel({ communityId, emoji }: CommunityEmojiPanelProps) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { syncEvent } = useCommunitySync(communityId);
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered emoji
  const filteredEmoji = useMemo(() => {
    if (!search.trim()) return emoji;
    const q = search.toLowerCase();
    return emoji.filter((e) => e.name.toLowerCase().includes(q));
  }, [emoji, search]);

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  const handleUploadPress = useCallback(() => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!service || !identity?.did) return;
      setError(null);

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Invalid file type. Use PNG, GIF, WEBP, APNG, or JPEG.');
        return;
      }

      // Validate file size
      if (file.size > MAX_EMOJI_SIZE) {
        setError(`File too large (${(file.size / 1024).toFixed(0)} KB). Max is 256 KB.`);
        return;
      }

      // Check limit
      if (emoji.length >= MAX_EMOJI) {
        setError(`Emoji limit reached (${MAX_EMOJI}).`);
        return;
      }

      // Derive name from filename (strip extension, normalize)
      let name = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      if (name.length < 2) name = `emoji_${name}`;
      if (name.length > 32) name = name.slice(0, 32);

      // Check for duplicate name
      if (emoji.some((e) => e.name === name)) {
        name = `${name}_${Date.now().toString(36).slice(-4)}`;
      }

      setUploading(true);
      try {
        // Upload to relay
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'emoji');
        formData.append('did', identity.did);

        const res = await fetch(
          `${RELAY_URL}/api/community/${encodeURIComponent(communityId)}/assets/upload`,
          { method: 'POST', body: formData },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed (${res.status})`);
        }

        const { data } = await res.json();
        const imageUrl = `${RELAY_URL}${data.url}`;

        const animated = file.type === 'image/gif' || file.type === 'image/apng';

        // Persist locally
        const created = await service.createCommunityEmoji(
          communityId,
          name,
          imageUrl,
          animated,
          identity.did,
        );

        // Broadcast to other peers
        syncEvent({
          type: 'emojiCreated',
          communityId,
          emoji: created,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading(false);
      }
    },
    [service, identity?.did, communityId, emoji, syncEvent],
  );

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(
    async (emojiId: string) => {
      if (!service || !identity?.did) return;
      setDeletingId(emojiId);
      try {
        await service.deleteCommunityEmoji(emojiId, identity.did);
        syncEvent({ type: 'emojiDeleted', communityId, emojiId });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setDeletingId(null);
      }
    },
    [service, identity?.did, communityId, syncEvent],
  );

  // ---------------------------------------------------------------------------
  // Rename
  // ---------------------------------------------------------------------------

  const startRename = useCallback((emojiId: string, currentName: string) => {
    setRenamingId(emojiId);
    setRenameValue(currentName);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!service || !renamingId) return;
    const trimmed = renameValue.trim();
    if (!EMOJI_NAME_REGEX.test(trimmed)) {
      setError('Name must be 2-32 characters, alphanumeric + underscores only.');
      return;
    }
    // Check for duplicate
    if (emoji.some((e) => e.name === trimmed && e.id !== renamingId)) {
      setError('An emoji with that name already exists.');
      return;
    }
    try {
      await service.renameCommunityEmoji(renamingId, trimmed);
      syncEvent({ type: 'emojiRenamed', communityId, emojiId: renamingId, newName: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRenamingId(null);
      setRenameValue('');
    }
  }, [service, renamingId, renameValue, emoji, communityId, syncEvent]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue('');
  }, []);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const headerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultSpacing.md,
  }), []);

  const searchStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderRadius: defaultRadii.md,
    paddingHorizontal: defaultSpacing.sm,
    height: 36,
    gap: defaultSpacing.xs,
    marginBottom: defaultSpacing.md,
  }), [isDark]);

  const cardStyle = useMemo<ViewStyle>(() => ({
    alignItems: 'center',
    gap: defaultSpacing.xs,
    padding: defaultSpacing.sm,
    borderRadius: defaultRadii.md,
    borderWidth: 1,
    borderColor: tc.border.subtle,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    width: 88,
    position: 'relative',
  }), [tc, isDark]);

  // ---------------------------------------------------------------------------
  // Render item
  // ---------------------------------------------------------------------------

  const renderEmoji = useCallback(
    ({ item }: { item: CommunityEmoji }) => {
      const isRenaming = renamingId === item.id;
      const isDeleting = deletingId === item.id;

      return (
        <View style={cardStyle}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />

          {isRenaming ? (
            <View style={{ width: '100%', gap: 4 }}>
              <TextInput
                value={renameValue}
                onChangeText={setRenameValue}
                onSubmitEditing={confirmRename}
                autoFocus
                style={{
                  fontSize: 11,
                  color: tc.text.primary,
                  borderWidth: 1,
                  borderColor: tc.accent.primary,
                  borderRadius: defaultRadii.sm,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  textAlign: 'center',
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                <Pressable onPress={confirmRename}>
                  <RNText style={{ fontSize: 10, color: tc.accent.primary }}>Save</RNText>
                </Pressable>
                <Pressable onPress={cancelRename}>
                  <RNText style={{ fontSize: 10, color: tc.text.muted }}>Cancel</RNText>
                </Pressable>
              </View>
            </View>
          ) : (
            <RNText
              style={{
                fontSize: defaultTypography.sizes.xs.fontSize,
                color: tc.text.secondary,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              :{item.name}:
            </RNText>
          )}

          {/* Action buttons (top-right) */}
          {!isRenaming && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                flexDirection: 'row',
                gap: 2,
              }}
            >
              <Pressable
                onPress={() => startRename(item.id, item.name)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EditIcon size={10} color={tc.text.muted} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item.id)}
                disabled={isDeleting}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: isDark ? 'rgba(255,100,100,0.15)' : 'rgba(220,50,50,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDeleting ? 0.4 : 1,
                }}
              >
                <TrashIcon size={10} color={tc.status.danger} />
              </Pressable>
            </View>
          )}

          {/* Animated badge */}
          {item.animated && (
            <View
              style={{
                position: 'absolute',
                bottom: 2,
                left: 2,
                backgroundColor: tc.accent.primary,
                borderRadius: 4,
                paddingHorizontal: 3,
                paddingVertical: 1,
              }}
            >
              <RNText style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>GIF</RNText>
            </View>
          )}
        </View>
      );
    },
    [cardStyle, renamingId, deletingId, renameValue, tc, isDark, confirmRename, cancelRename, startRename, handleDelete],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, padding: defaultSpacing.md }}>
      {/* Header */}
      <View style={headerStyle}>
        <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
          Emoji
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: 9999,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted }}>
              {emoji.length} / {MAX_EMOJI}
            </RNText>
          </View>
        </View>
      </View>

      <Text size="sm" style={{ color: tc.text.muted, marginBottom: defaultSpacing.md }}>
        Custom emoji that members can use in messages and reactions. Upload PNG, GIF, WEBP, or APNG images up to 256 KB.
      </Text>

      {/* Error banner */}
      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: defaultSpacing.sm,
            marginBottom: defaultSpacing.md,
            borderRadius: defaultRadii.md,
            backgroundColor: isDark ? 'rgba(220,50,50,0.1)' : 'rgba(220,50,50,0.05)',
            borderWidth: 1,
            borderColor: tc.status.danger + '30',
          }}
        >
          <RNText style={{ flex: 1, fontSize: 13, color: tc.status.danger }}>{error}</RNText>
          <Pressable onPress={() => setError(null)}>
            <RNText style={{ fontSize: 12, color: tc.text.muted, paddingLeft: 8 }}>Dismiss</RNText>
          </Pressable>
        </View>
      )}

      {/* Upload + Search row */}
      <View style={{ flexDirection: 'row', gap: defaultSpacing.sm, marginBottom: defaultSpacing.md }}>
        {/* Upload button */}
        <Pressable
          onPress={handleUploadPress}
          disabled={uploading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.xs,
            paddingHorizontal: defaultSpacing.md,
            paddingVertical: defaultSpacing.sm,
            backgroundColor: tc.accent.primary,
            borderRadius: defaultRadii.md,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <UploadIcon size={14} color="#fff" />
          )}
          <RNText style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
            {uploading ? 'Uploading...' : 'Upload Emoji'}
          </RNText>
        </Pressable>

        {/* Search */}
        <View style={[searchStyle, { flex: 1 }]}>
          <SearchIcon size={14} color={tc.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search emoji..."
            placeholderTextColor={tc.text.muted}
            style={{
              flex: 1,
              fontSize: 13,
              color: tc.text.primary,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
          />
        </View>
      </View>

      {/* Hidden file input (web only) */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept=".png,.gif,.webp,.apng,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e: any) => {
            const file = e.target?.files?.[0];
            if (file) {
              handleFileSelected(file);
              e.target.value = ''; // Reset so same file can be re-selected
            }
          }}
        />
      )}

      {/* Emoji grid */}
      {filteredEmoji.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
          <RNText style={{ fontSize: 14, color: tc.text.muted }}>
            {search ? 'No emoji match your search.' : 'No custom emoji yet. Upload one to get started!'}
          </RNText>
        </View>
      ) : (
        <FlatList
          data={filteredEmoji}
          renderItem={renderEmoji}
          keyExtractor={(item) => item.id}
          numColumns={8}
          columnWrapperStyle={{ gap: defaultSpacing.sm, marginBottom: defaultSpacing.sm }}
          contentContainerStyle={{ paddingBottom: defaultSpacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
