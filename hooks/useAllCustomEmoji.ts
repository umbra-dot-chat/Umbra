/**
 * useAllCustomEmoji — Aggregates custom emoji and stickers from all of the
 * user's communities so they can be used in DM / group conversations.
 *
 * Returns EmojiItem[] for the EmojiPicker `customEmojis` prop and
 * StickerPickerPack[] for the StickerPicker / CombinedPicker `stickerPacks` prop.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { StickerPickerPack } from '@coexist/wisp-core/types/StickerPicker.types';
import type { CommunityEmoji, CommunitySticker, StickerPack } from '@umbra/service';
import { getBuiltInCommunityEmoji, getBuiltInEmojiItems } from '@/constants/builtInEmoji';

export function useAllCustomEmoji() {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();

  const [allEmoji, setAllEmoji] = useState<CommunityEmoji[]>([]);
  const [allStickers, setAllStickers] = useState<CommunitySticker[]>([]);
  const [allStickerPacks, setAllStickerPacks] = useState<StickerPack[]>([]);

  const fetchAll = useCallback(async () => {
    if (!service || !identity?.did) return;
    try {
      // Get all communities the user belongs to
      const communities = await service.getCommunities(identity.did);

      // Fetch emoji + stickers from each community in parallel
      const results = await Promise.all(
        communities.map(async (c) => {
          const [emoji, stickers, packs] = await Promise.all([
            service.listCommunityEmoji(c.id).catch(() => [] as CommunityEmoji[]),
            service.listCommunityStickers(c.id).catch(() => [] as CommunitySticker[]),
            service.listCommunityStickerPacks(c.id).catch(() => [] as StickerPack[]),
          ]);
          return { communityId: c.id, communityName: c.name, emoji, stickers, packs };
        }),
      );

      // Flatten across all communities
      const flatEmoji: CommunityEmoji[] = [];
      const flatStickers: CommunitySticker[] = [];
      const flatPacks: StickerPack[] = [];

      for (const r of results) {
        flatEmoji.push(...r.emoji);
        flatStickers.push(...r.stickers);
        flatPacks.push(...r.packs);
      }

      setAllEmoji(flatEmoji);
      setAllStickers(flatStickers);
      setAllStickerPacks(flatPacks);
    } catch {
      // Silently fail — emoji are non-critical
    }
  }, [service, identity?.did]);

  useEffect(() => {
    if (isReady && service && identity?.did) {
      fetchAll();
    }
  }, [isReady, service, identity?.did, fetchAll]);

  // Listen for emoji/sticker create/delete events to stay in sync
  useEffect(() => {
    if (!service) return;
    const unsubscribe = service.onCommunityEvent((event: any) => {
      if (
        event.type === 'emojiCreated' ||
        event.type === 'emojiDeleted' ||
        event.type === 'stickerCreated' ||
        event.type === 'stickerDeleted' ||
        event.type === 'stickerPackCreated' ||
        event.type === 'stickerPackDeleted'
      ) {
        fetchAll();
      }
    });
    return unsubscribe;
  }, [service, fetchAll]);

  // Built-in emoji (always available)
  const builtInItems = useMemo(() => getBuiltInEmojiItems(), []);
  const builtInCommunityEmoji = useMemo(() => getBuiltInCommunityEmoji(), []);

  // Transform to EmojiItem[] for the picker (built-in + community)
  const customEmojiItems = useMemo<EmojiItem[]>(() => {
    const communityItems = allEmoji.map((e) => ({
      emoji: `:${e.name}:`,
      name: e.name,
      category: 'custom' as const,
      keywords: [e.name],
      imageUrl: e.imageUrl,
      animated: e.animated,
    }));
    return [...builtInItems, ...communityItems];
  }, [allEmoji, builtInItems]);

  // All emoji as CommunityEmoji[] for building emojiMaps (built-in + community)
  const allCommunityEmoji = useMemo<CommunityEmoji[]>(() => {
    return [...builtInCommunityEmoji, ...allEmoji];
  }, [allEmoji, builtInCommunityEmoji]);

  // Transform to StickerPickerPack[] for the picker
  const stickerPickerPacks = useMemo<StickerPickerPack[]>(() => {
    if (allStickers.length === 0) return [];

    const packMap = new Map<string, { id: string; name: string; stickers: Array<{ id: string; name: string; imageUrl: string; animated?: boolean }> }>();

    // Seed with known packs
    for (const pack of allStickerPacks) {
      packMap.set(pack.id, { id: pack.id, name: pack.name, stickers: [] });
    }

    const uncategorizedId = '__uncategorized__';

    for (const sticker of allStickers) {
      const packId = sticker.packId ?? uncategorizedId;
      if (!packMap.has(packId)) {
        packMap.set(packId, { id: packId, name: packId === uncategorizedId ? 'Stickers' : packId, stickers: [] });
      }
      packMap.get(packId)!.stickers.push({
        id: sticker.id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        animated: sticker.animated,
      });
    }

    return Array.from(packMap.values()).filter((p) => p.stickers.length > 0);
  }, [allStickers, allStickerPacks]);

  return { customEmojiItems, stickerPickerPacks, allCommunityEmoji };
}
