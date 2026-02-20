/**
 * CommunityStickerPanel — Sticker management panel for community settings.
 *
 * Wraps the Wisp StickerManagementPanel with Umbra service integration
 * for uploading, creating packs, and deleting stickers/packs.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Platform } from 'react-native';
import { StickerManagementPanel, Text, Button, useTheme } from '@coexist/wisp-react-native';
import type { StickerPack as WispStickerPack } from '@coexist/wisp-core/types/StickerManagementPanel.types';

import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunitySync } from '@/hooks/useCommunitySync';
import type { CommunitySticker, StickerPack } from '@umbra/service';

const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

interface CommunityStickerPanelProps {
  communityId: string;
  stickers: CommunitySticker[];
  stickerPacks: StickerPack[];
}

export function CommunityStickerPanel({
  communityId,
  stickers,
  stickerPacks,
}: CommunityStickerPanelProps) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { theme } = useTheme();
  const { syncEvent } = useCommunitySync(communityId);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Transform to Wisp StickerManagementPanel format
  const wispPacks = useMemo<WispStickerPack[]>(() => {
    const packMap = new Map<string, WispStickerPack>();

    // Existing packs
    for (const pack of stickerPacks) {
      packMap.set(pack.id, {
        id: pack.id,
        name: pack.name,
        stickers: [],
      });
    }

    // Default pack for unassigned stickers
    const uncategorizedId = '__uncategorized__';

    for (const sticker of stickers) {
      const packId = sticker.packId ?? uncategorizedId;
      if (!packMap.has(packId)) {
        packMap.set(packId, {
          id: packId,
          name: packId === uncategorizedId ? 'Uncategorized' : packId,
          stickers: [],
        });
      }
      packMap.get(packId)!.stickers.push({
        id: sticker.id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        animated: sticker.animated,
      });
    }

    // If no packs exist at all, create a default one
    if (packMap.size === 0) {
      packMap.set(uncategorizedId, {
        id: uncategorizedId,
        name: 'Stickers',
        stickers: [],
      });
    }

    return Array.from(packMap.values());
  }, [stickers, stickerPacks]);

  // Create pack
  const handleCreatePack = useCallback(async (name: string) => {
    if (!service || !identity?.did) return;
    try {
      setError(null);
      const pack = await service.createCommunityStickerPack(communityId, name, identity.did);
      syncEvent({
        type: 'stickerPackCreated',
        communityId,
        pack,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [service, identity?.did, communityId, syncEvent]);

  // Delete pack
  const handleDeletePack = useCallback(async (packId: string) => {
    if (!service) return;
    if (packId === '__uncategorized__') return; // Cannot delete uncategorized
    try {
      setError(null);
      await service.deleteCommunityStickerPack(packId);
      syncEvent({
        type: 'stickerPackDeleted',
        communityId,
        packId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [service, communityId, syncEvent]);

  // Upload sticker
  const handleUploadSticker = useCallback(async (packId: string, _file: never, name: string) => {
    if (!service || !identity?.did) return;

    // On web, use a file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/gif,image/webp,image/apng,.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // Validate size (2MB max for stickers)
        if (file.size > 2 * 1024 * 1024) {
          setError('Sticker must be under 2MB');
          return;
        }

        setUploading(true);
        try {
          setError(null);

          // Determine format
          let format = 'png';
          if (file.type === 'image/gif') format = 'gif';
          else if (file.type === 'image/webp') format = 'webp';
          else if (file.type === 'image/apng') format = 'apng';
          else if (file.name.endsWith('.json') || file.type === 'application/json') format = 'lottie';

          const animated = format === 'gif' || format === 'apng' || format === 'lottie';

          // Upload to relay
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'sticker');
          formData.append('did', identity.did);

          const res = await fetch(
            `${RELAY_URL}/api/community/${encodeURIComponent(communityId)}/assets/upload`,
            { method: 'POST', body: formData },
          );

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as any).error || `Upload failed (${res.status})`);
          }

          const { data } = await res.json();
          const imageUrl = `${RELAY_URL}${data.url}`;

          // Use actual pack ID (null for uncategorized)
          const actualPackId = packId === '__uncategorized__' ? undefined : packId;

          // Persist locally
          const created = await service.createCommunitySticker(
            communityId,
            name || file.name.replace(/\.[^.]+$/, ''),
            imageUrl,
            animated,
            format,
            identity.did,
            actualPackId,
          );

          // Broadcast
          syncEvent({
            type: 'stickerCreated',
            communityId,
            sticker: created,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setUploading(false);
        }
      };
      input.click();
    }
  }, [service, identity?.did, communityId, syncEvent]);

  // Delete sticker
  const handleDeleteSticker = useCallback(async (_packId: string, stickerId: string) => {
    if (!service) return;
    try {
      setError(null);
      await service.deleteCommunitySticker(stickerId);
      syncEvent({
        type: 'stickerDeleted',
        communityId,
        stickerId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [service, communityId, syncEvent]);

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <View style={{ padding: 12, backgroundColor: theme.colors.status.danger + '20', margin: 12, borderRadius: 8 }}>
          <Text size="sm" style={{ color: theme.colors.status.danger }}>{error}</Text>
        </View>
      )}
      {uploading && (
        <View style={{ padding: 12, margin: 12 }}>
          <Text size="sm" style={{ color: theme.colors.text.muted }}>Uploading sticker...</Text>
        </View>
      )}
      <StickerManagementPanel
        packs={wispPacks}
        onCreatePack={handleCreatePack}
        onDeletePack={handleDeletePack}
        onUploadSticker={handleUploadSticker}
        onDeleteSticker={handleDeleteSticker}
        title={`Stickers (${stickers.length})`}
        style={{ flex: 1 }}
      />
    </View>
  );
}
