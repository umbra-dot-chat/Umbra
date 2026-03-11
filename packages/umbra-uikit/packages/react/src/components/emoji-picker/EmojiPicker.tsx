/**
 * @module EmojiPicker
 * @description Full-featured emoji selection panel with category tabs, keyword
 * search, skin tone selector, scroll-synced navigation, and Lucide icons for
 * category tabs. Built entirely from Wisp primitives and layouts.
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../providers';
import { SearchInput } from '../search-input';
import { Text } from '../../primitives/text';
import {
  Clock,
  Smile,
  Users,
  PawPrint,
  UtensilsCrossed,
  Plane,
  Trophy,
  Lightbulb,
  Heart,
  Flag,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  EmojiPickerProps,
  EmojiItem,
  EmojiCategory,
  SkinTone,
} from '@coexist/wisp-core/types/EmojiPicker.types';
import {
  emojiPickerSizeMap,
  emojiCategories,
  skinTones,
  SKIN_TONE_MODIFIERS,
} from '@coexist/wisp-core/types/EmojiPicker.types';
import {
  resolveEmojiPickerColors,
  buildEmojiPickerContainerStyle,
  buildEmojiPickerHeaderStyle,
  buildEmojiPickerSearchRowStyle,
  buildEmojiPickerSliderClipStyle,
  buildEmojiPickerSliderTrackStyle,
  buildEmojiPickerSliderPanelStyle,
  buildEmojiPickerSkinToneTriggerStyle,
  buildEmojiPickerSkinToneOptionStyle,
  buildEmojiPickerTabBarStyle,
  buildEmojiPickerTabStyle,
  buildEmojiPickerGridStyle,
  buildEmojiPickerCategoryLabelStyle,
  buildEmojiPickerCellStyle,
  buildEmojiPickerCellRowStyle,
  buildEmojiPickerSkeletonStyle,
  buildEmojiPickerNoResultsStyle,
} from '@coexist/wisp-core/styles/EmojiPicker.styles';
import { EMOJI_DATA } from './emoji-data';

// ---------------------------------------------------------------------------
// Category → Lucide Icon mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<EmojiCategory, LucideIcon> = {
  recent: Clock,
  smileys: Smile,
  people: Users,
  animals: PawPrint,
  food: UtensilsCrossed,
  travel: Plane,
  activities: Trophy,
  objects: Lightbulb,
  symbols: Heart,
  flags: Flag,
  custom: Sparkles,
};

/** Display names for each category. */
const CATEGORY_LABELS: Record<EmojiCategory, string> = {
  recent: 'Recent',
  smileys: 'Smileys & Emotion',
  people: 'People & Body',
  animals: 'Animals & Nature',
  food: 'Food & Drink',
  travel: 'Travel & Places',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
  custom: 'Custom',
};

/** Skin tone preview emoji. */
const SKIN_TONE_PREVIEW = '\u{1F44B}'; // wave hand

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(function EmojiPicker(
  {
    size = 'md',
    onSelect,
    emojis,
    recent,
    searchPlaceholder = 'Search emoji...',
    showSearch = true,
    showCategories = true,
    showSkinTones = true,
    skeleton = false,
    defaultSkinTone = 'default',
    skinTone: controlledSkinTone,
    onSkinToneChange,
    autoFocusSearch = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = emojiPickerSizeMap[size];
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('smileys');
  const [internalSkinTone, setInternalSkinTone] = useState<SkinTone>(defaultSkinTone);
  const [skinToneOpen, setSkinToneOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollingProgrammatically = useRef(false);

  // Controlled vs uncontrolled skin tone
  const currentSkinTone = controlledSkinTone ?? internalSkinTone;

  const handleSkinToneChange = useCallback(
    (tone: SkinTone) => {
      if (controlledSkinTone === undefined) {
        setInternalSkinTone(tone);
      }
      onSkinToneChange?.(tone);
      setSkinToneOpen(false);
    },
    [controlledSkinTone, onSkinToneChange],
  );

  const toggleSkinTonePicker = useCallback(() => {
    setSkinToneOpen((prev) => !prev);
  }, []);

  // Resolve colors
  const colors = useMemo(
    () => resolveEmojiPickerColors(theme),
    [theme],
  );

  // Skeleton
  if (skeleton) {
    const skeletonStyle = buildEmojiPickerSkeletonStyle(sizeConfig, theme);
    return <div aria-hidden className={className} style={{ ...skeletonStyle, ...userStyle }} />;
  }

  const allEmojis = emojis ?? EMOJI_DATA;

  // Sort emojis by popularity within each category
  const sortedEmojis = useMemo(() => {
    return [...allEmojis].sort((a, b) => (a.popularityRank ?? 999) - (b.popularityRank ?? 999));
  }, [allEmojis]);

  // Filter by search (name + keywords + emoji char)
  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return sortedEmojis;
    const q = search.toLowerCase().trim();
    return sortedEmojis.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.keywords.some((kw) => kw.includes(q)) ||
        e.emoji.includes(q),
    );
  }, [sortedEmojis, search]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, EmojiItem[]>();
    for (const item of filteredEmojis) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filteredEmojis]);

  // Renderable categories (those with emojis, excluding 'recent' from data)
  const dataCategories = useMemo(() => {
    return emojiCategories.filter((cat) => cat !== 'recent' && grouped.has(cat));
  }, [grouped]);

  // Categories to show in tabs (include 'recent' if recent has items)
  const tabCategories = useMemo(() => {
    const cats: EmojiCategory[] = [];
    if (recent && recent.length > 0) cats.push('recent');
    cats.push(...dataCategories);
    return cats;
  }, [recent, dataCategories]);

  // Apply skin tone modifier to an emoji
  const applySkinTone = useCallback(
    (emoji: string, item?: EmojiItem): string => {
      if (!item?.skinToneSupport || currentSkinTone === 'default') return emoji;
      return emoji + SKIN_TONE_MODIFIERS[currentSkinTone];
    },
    [currentSkinTone],
  );

  // Handle emoji selection
  const handleSelect = useCallback(
    (emoji: string, item?: EmojiItem) => {
      const finalEmoji = applySkinTone(emoji, item);
      onSelect?.(finalEmoji, item);
    },
    [onSelect, applySkinTone],
  );

  // ---- Scroll-tab sync via IntersectionObserver ----
  useEffect(() => {
    if (search.trim() || !showCategories) return;

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute('data-category');
            if (cat) setActiveCategory(cat as EmojiCategory);
          }
        }
      },
      {
        root: scrollEl,
        rootMargin: '-10% 0px -85% 0px',
        threshold: 0,
      },
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [search, showCategories, dataCategories]);

  // Handle tab click → programmatic scroll
  const handleTabClick = useCallback((cat: EmojiCategory) => {
    setActiveCategory(cat);

    if (cat === 'recent') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionEl = sectionRefs.current.get(cat);
    if (sectionEl && scrollRef.current) {
      isScrollingProgrammatically.current = true;
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  // Register section ref
  const setSectionRef = useCallback((cat: string, el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(cat, el);
    } else {
      sectionRefs.current.delete(cat);
    }
  }, []);

  // ---- Styles ----
  const containerStyle = useMemo(
    () => buildEmojiPickerContainerStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );
  const headerStyle = useMemo(
    () => buildEmojiPickerHeaderStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );
  const searchRowStyle = useMemo(
    () => buildEmojiPickerSearchRowStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );
  const sliderClipStyle = useMemo(
    () => buildEmojiPickerSliderClipStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );
  const sliderTrackStyle = useMemo(
    () => buildEmojiPickerSliderTrackStyle(skinToneOpen),
    [skinToneOpen],
  );
  const sliderPanelStyle = useMemo(
    () => buildEmojiPickerSliderPanelStyle(),
    [],
  );
  const skinToneTriggerStyle = useMemo(
    () => buildEmojiPickerSkinToneTriggerStyle(sizeConfig, colors, skinToneOpen, theme),
    [sizeConfig, colors, skinToneOpen, theme],
  );
  const tabBarStyle = useMemo(
    () => buildEmojiPickerTabBarStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );
  const gridStyle = useMemo(
    () => buildEmojiPickerGridStyle(sizeConfig),
    [sizeConfig],
  );
  const categoryLabelStyle = useMemo(
    () => buildEmojiPickerCategoryLabelStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );
  const cellStyle = useMemo(
    () => buildEmojiPickerCellStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );
  const cellRowStyle = useMemo(
    () => buildEmojiPickerCellRowStyle(sizeConfig),
    [sizeConfig],
  );
  const noResultsStyle = useMemo(
    () => buildEmojiPickerNoResultsStyle(colors, theme),
    [colors, theme],
  );

  const isSearching = search.trim().length > 0;
  const hasResults = isSearching ? filteredEmojis.length > 0 : true;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      role="dialog"
      aria-label="Emoji picker"
      {...rest}
    >
      {/* Header: [sliding content] [hand button] */}
      <div style={headerStyle}>
        <div style={searchRowStyle}>
          {/* Sliding area — search bar ↔ skin tone options */}
          <div style={sliderClipStyle}>
            <div style={sliderTrackStyle}>
              {/* Panel 1: Search bar */}
              <div style={sliderPanelStyle}>
                {showSearch && (
                  <SearchInput
                    size={size}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch('')}
                    placeholder={searchPlaceholder}
                    aria-label="Search emoji"
                    autoFocus={autoFocusSearch}
                    fullWidth
                  />
                )}
              </div>

              {/* Panel 2: Skin tone options */}
              {showSkinTones && (
                <div style={{ ...sliderPanelStyle, justifyContent: 'space-evenly' }}>
                  {skinTones.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      style={buildEmojiPickerSkinToneOptionStyle(sizeConfig, colors, currentSkinTone === tone, theme)}
                      onClick={() => handleSkinToneChange(tone)}
                      aria-label={`Skin tone: ${tone}`}
                      title={tone}
                    >
                      {SKIN_TONE_PREVIEW + SKIN_TONE_MODIFIERS[tone]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hand button — always anchored on the right */}
          {showSkinTones && (
            <button
              type="button"
              style={skinToneTriggerStyle}
              onClick={toggleSkinTonePicker}
              aria-label={skinToneOpen ? 'Back to search' : 'Select skin tone'}
              title={skinToneOpen ? 'Back to search' : 'Select skin tone'}
            >
              {SKIN_TONE_PREVIEW + SKIN_TONE_MODIFIERS[currentSkinTone]}
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {showCategories && !isSearching && (
        <div style={tabBarStyle}>
          {tabCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              style={buildEmojiPickerTabStyle(sizeConfig, colors, activeCategory === cat)}
              onClick={() => handleTabClick(cat)}
              aria-label={CATEGORY_LABELS[cat]}
              title={CATEGORY_LABELS[cat]}
            >
              {React.createElement(CATEGORY_ICONS[cat], { size: sizeConfig.tabIconSize })}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div ref={scrollRef} style={gridStyle}>
        {!hasResults && (
          <div style={noResultsStyle}>
            <Text size="sm" color="secondary">No emoji found</Text>
          </div>
        )}

        {/* Recent section */}
        {recent && recent.length > 0 && (isSearching || !showCategories) && (
          <div
            ref={(el) => setSectionRef('recent', el)}
            data-category="recent"
          >
            <div style={categoryLabelStyle}>
              <Text size="xs" weight="semibold" color="secondary">Recent</Text>
            </div>
            <div style={cellRowStyle}>
              {recent.map((emoji, i) => (
                <button
                  key={`recent-${i}`}
                  type="button"
                  style={cellStyle}
                  onClick={() => handleSelect(emoji)}
                  aria-label={emoji}
                  title={emoji}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.cellHover;
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category sections — all rendered continuously for scroll sync */}
        {dataCategories.map((cat) => {
          const items = grouped.get(cat);
          if (!items || items.length === 0) return null;

          return (
            <div
              key={cat}
              ref={(el) => setSectionRef(cat, el)}
              data-category={cat}
            >
              <div style={categoryLabelStyle}>
                <Text size="xs" weight="semibold" color="secondary">{CATEGORY_LABELS[cat]}</Text>
              </div>
              <div style={cellRowStyle}>
                {items.map((item) => {
                  const displayEmoji = applySkinTone(item.emoji, item);
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      style={cellStyle}
                      onClick={() => handleSelect(item.emoji, item)}
                      aria-label={item.name}
                      title={item.name}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.cellHover;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      }}
                    >
                      {displayEmoji}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';
