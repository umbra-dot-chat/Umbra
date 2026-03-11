/**
 * @module components/emoji-picker
 * @description React Native EmojiPicker for the Wisp design system.
 *
 * Full-featured emoji selection panel with category tabs, keyword search,
 * skin tone selector (sliding panel animation), and scroll-synced navigation
 * via onScroll offset tracking.
 */

import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Image, Dimensions } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import type {
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
import type { EmojiPickerSize } from '@coexist/wisp-core/types/EmojiPicker.types';
import { resolveEmojiPickerColors } from '@coexist/wisp-core/styles/EmojiPicker.styles';
import { EMOJI_DATA } from './emoji-data';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { SearchInput } from '../search-input';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Category labels & icons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SVG Icons (matching Lucide icons used in React DOM version)
// ---------------------------------------------------------------------------

function ClockIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

function SmileIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Line x1={9} y1={9} x2={9.01} y2={9} />
      <Line x1={15} y1={9} x2={15.01} y2={9} />
    </Svg>
  );
}

function UsersIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function PawPrintIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={4} r={2} />
      <Circle cx={18} cy={8} r={2} />
      <Circle cx={20} cy={16} r={2} />
      <Path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </Svg>
  );
}

function UtensilsCrossedIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <Path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c1.7 1.7 4.3 1.7 6 0" />
      <Path d="m2 22 5.5-5.5" />
      <Path d="m22 2-5.5 5.5" />
    </Svg>
  );
}

function PlaneIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Svg>
  );
}

function TrophyIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <Path d="M4 22h16" />
      <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  );
}

function LightbulbIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <Path d="M9 18h6" />
      <Path d="M10 22h4" />
    </Svg>
  );
}

function HeartIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Svg>
  );
}

function FlagIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <Line x1={4} y1={22} x2={4} y2={15} />
    </Svg>
  );
}

function StarIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

type CategoryIconComponent = React.FC<{ size?: number; color?: string }>;

const CATEGORY_ICONS: Record<EmojiCategory, CategoryIconComponent> = {
  recent: ClockIcon,
  smileys: SmileIcon,
  people: UsersIcon,
  animals: PawPrintIcon,
  food: UtensilsCrossedIcon,
  travel: PlaneIcon,
  activities: TrophyIcon,
  objects: LightbulbIcon,
  symbols: HeartIcon,
  flags: FlagIcon,
  custom: StarIcon,
};

const SKIN_TONE_HAND = '\u{1F44B}';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EmojiPickerProps extends ViewProps {
  /** Size preset. @default 'md' */
  size?: EmojiPickerSize;
  /** Called when an emoji is selected. */
  onSelect?: (emoji: string, item?: EmojiItem) => void;
  /** Custom emoji data (merged with built-in set). */
  emojis?: EmojiItem[];
  /** Custom community/server emoji added to the 'custom' category. */
  customEmojis?: EmojiItem[];
  /** Recently used emojis. */
  recent?: string[];
  /** Search placeholder text. @default 'Search emoji...' */
  searchPlaceholder?: string;
  /** Show search bar. @default true */
  showSearch?: boolean;
  /** Show category tabs. @default true */
  showCategories?: boolean;
  /** Show skin tone selector. @default true */
  showSkinTones?: boolean;
  /** Default skin tone. @default 'default' */
  defaultSkinTone?: SkinTone;
  /** Controlled skin tone. */
  skinTone?: SkinTone;
  /** Callback when skin tone changes. */
  onSkinToneChange?: (tone: SkinTone) => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmojiPicker = forwardRef<View, EmojiPickerProps>(function EmojiPicker(
  {
    size = 'md',
    onSelect,
    emojis,
    customEmojis,
    recent,
    searchPlaceholder = 'Search emoji...',
    showSearch = true,
    showCategories = true,
    showSkinTones = true,
    skeleton = false,
    defaultSkinTone = 'default',
    skinTone: controlledSkinTone,
    onSkinToneChange,
    style: userStyle,
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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [headerWidth, setHeaderWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Map<string, number>>(new Map());
  const isScrollingProgrammatically = useRef(false);

  const currentSkinTone = controlledSkinTone ?? internalSkinTone;

  // --- Slider clip width measurement for sliding animation ---

  const handleSliderClipLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderWidth(e.nativeEvent.layout.width);
  }, []);

  // --- Skin tone handlers ---

  const handleSkinToneChange = useCallback(
    (tone: SkinTone) => {
      if (controlledSkinTone === undefined) setInternalSkinTone(tone);
      onSkinToneChange?.(tone);
      setSkinToneOpen(false);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [controlledSkinTone, onSkinToneChange, slideAnim],
  );

  const toggleSkinTonePicker = useCallback(() => {
    const next = !skinToneOpen;
    setSkinToneOpen(next);
    Animated.timing(slideAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [skinToneOpen, slideAnim]);

  // --- Colors ---

  const colors = useMemo(
    () => resolveEmojiPickerColors(theme),
    [themeColors],
  );

  const resolvedRadius = (theme.radii ?? defaultRadii)[sizeConfig.borderRadius] ?? defaultRadii[sizeConfig.borderRadius];

  // Clamp width to screen so picker never overflows on mobile
  const screenWidth = Dimensions.get('window').width;
  const PICKER_H_MARGIN = 24; // total horizontal safety margin
  const clampedWidth = Math.min(sizeConfig.width, screenWidth - PICKER_H_MARGIN);

  // --- Skeleton ---

  if (skeleton) {
    const skeletonStyle: ViewStyle = {
      width: clampedWidth,
      height: sizeConfig.height,
      borderRadius: resolvedRadius,
      backgroundColor: themeColors.border.subtle,
    };
    return <View style={[skeletonStyle, userStyle as ViewStyle]} />;
  }

  // --- Emoji data ---

  const allEmojis = useMemo(() => {
    const base = emojis ? [...EMOJI_DATA, ...emojis] : [...EMOJI_DATA];
    if (customEmojis && customEmojis.length > 0) base.push(...customEmojis);
    return base;
  }, [emojis, customEmojis]);

  const sortedEmojis = useMemo(() => {
    return [...allEmojis].sort((a, b) => (a.popularityRank ?? 999) - (b.popularityRank ?? 999));
  }, [allEmojis]);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return sortedEmojis;
    const q = search.toLowerCase().trim();
    return sortedEmojis.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.keywords.some((kw: string) => kw.includes(q)) ||
        e.emoji.includes(q),
    );
  }, [sortedEmojis, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, EmojiItem[]>();
    for (const item of filteredEmojis) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filteredEmojis]);

  const dataCategories = useMemo(() => {
    return emojiCategories.filter((cat: EmojiCategory) => cat !== 'recent' && grouped.has(cat));
  }, [grouped]);

  const tabCategories = useMemo(() => {
    const cats: EmojiCategory[] = [];
    if (recent && recent.length > 0) cats.push('recent');
    cats.push(...dataCategories);
    return cats;
  }, [recent, dataCategories]);

  // --- Skin tone application ---

  const applySkinTone = useCallback(
    (emoji: string, item?: EmojiItem): string => {
      if (!item?.skinToneSupport || currentSkinTone === 'default') return emoji;
      return emoji + SKIN_TONE_MODIFIERS[currentSkinTone];
    },
    [currentSkinTone],
  );

  const handleSelect = useCallback(
    (emoji: string, item?: EmojiItem) => {
      const finalEmoji = applySkinTone(emoji, item);
      onSelect?.(finalEmoji, item);
    },
    [onSelect, applySkinTone],
  );

  // --- Scroll-tab sync ---

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingProgrammatically.current || search.trim()) return;
    const y = e.nativeEvent.contentOffset.y + 20;
    let closest: EmojiCategory = 'smileys';
    let closestDiff = Infinity;
    sectionOffsets.current.forEach((offset, cat) => {
      const diff = y - offset;
      if (diff >= 0 && diff < closestDiff) {
        closestDiff = diff;
        closest = cat as EmojiCategory;
      }
    });
    setActiveCategory(closest);
  }, [search]);

  const handleSectionLayout = useCallback((cat: string) => (e: LayoutChangeEvent) => {
    sectionOffsets.current.set(cat, e.nativeEvent.layout.y);
  }, []);

  const handleTabClick = useCallback((cat: EmojiCategory) => {
    setActiveCategory(cat);
    const offset = sectionOffsets.current.get(cat);
    if (offset !== undefined && scrollRef.current) {
      isScrollingProgrammatically.current = true;
      scrollRef.current.scrollTo({ y: offset, animated: true });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  const isSearching = search.trim().length > 0;
  const hasResults = isSearching ? filteredEmojis.length > 0 : true;

  // --- Derived sizes ---
  const triggerSize = sizeConfig.searchHeight;
  const triggerHandFontSize = Math.round(triggerSize * 0.5);
  const optionSize = Math.round(sizeConfig.cellSize * 0.9);
  const optionFontSize = Math.round(optionSize * 0.55);

  // Animated translateX: slides from 0 to -headerWidth
  const sliderTranslateX = useMemo(() => {
    return slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -headerWidth],
    });
  }, [slideAnim, headerWidth]);

  // ---- Styles ----

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'column',
    width: clampedWidth,
    height: sizeConfig.height,
    borderRadius: resolvedRadius,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  }), [clampedWidth, sizeConfig, colors, resolvedRadius]);

  const headerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'column',
    gap: sizeConfig.gap * 2,
    paddingHorizontal: sizeConfig.padding,
    paddingTop: sizeConfig.padding,
    paddingBottom: sizeConfig.gap,
    flexShrink: 0,
    backgroundColor: colors.bg,
  }), [sizeConfig, colors]);

  const searchRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.sm,
    height: sizeConfig.searchHeight,
  }), [sizeConfig]);

  const CLIP_PAD = 2;
  const sliderClipStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    height: sizeConfig.searchHeight + CLIP_PAD * 2,
    marginVertical: -CLIP_PAD,
    paddingVertical: CLIP_PAD,
    paddingRight: CLIP_PAD,
    overflow: 'hidden',
    position: 'relative',
  }), [sizeConfig]);

  const innerWidth = Math.max(0, headerWidth - CLIP_PAD);

  const sliderTrackStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    width: innerWidth * 2 || '200%' as any,
    height: '100%' as any,
  }), [innerWidth]);

  const sliderPanelStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    width: innerWidth || '50%' as any,
    height: '100%' as any,
    flexShrink: 0,
  }), [innerWidth]);

  const skinTriggerStyle = useMemo<ViewStyle>(() => ({
    width: triggerSize,
    height: triggerSize,
    borderRadius: resolvedRadius / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: skinToneOpen ? themeColors.background.sunken : 'transparent',
    borderWidth: 1,
    borderColor: skinToneOpen ? colors.skinToneActiveBorder : colors.border,
    flexShrink: 0,
  }), [triggerSize, resolvedRadius, colors, themeColors, skinToneOpen]);

  const tabBarStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: sizeConfig.tabHeight,
    paddingHorizontal: sizeConfig.padding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexShrink: 0,
    overflow: 'hidden',
  }), [sizeConfig, colors]);

  const categoryLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: defaultTypography.weights.semibold,
    color: colors.categoryLabel,
    paddingTop: sizeConfig.gap + 2,
    paddingBottom: sizeConfig.gap,
    backgroundColor: colors.bg,
    zIndex: 2,
  }), [sizeConfig, colors]);

  const cellRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizeConfig.gap,
    justifyContent: 'center',
  }), [sizeConfig]);

  const cellStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (theme.radii ?? defaultRadii).md ?? defaultRadii.md,
  }), [sizeConfig, theme]);

  // Custom emoji (image-based) get a 2× larger cell so they stand out
  const customEmojiDisplaySize = Math.round(sizeConfig.cellSize * 2);
  const customCellStyle = useMemo<ViewStyle>(() => ({
    width: customEmojiDisplaySize,
    height: customEmojiDisplaySize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (theme.radii ?? defaultRadii).md ?? defaultRadii.md,
  }), [customEmojiDisplaySize, theme]);

  const emojiTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.emojiSize,
  }), [sizeConfig]);

  const gridContentStyle = useMemo<ViewStyle>(() => ({
    paddingHorizontal: sizeConfig.padding,
    paddingBottom: sizeConfig.padding,
    gap: sizeConfig.gap * 2,
  }), [sizeConfig]);

  const noResultsStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: defaultSpacing.xl,
  }), []);

  return (
    <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
      {/* ── Header: [sliding content] [hand button] ── */}
      <View style={headerStyle}>
        <View style={searchRowStyle}>
          {/* Sliding area — search bar ↔ skin tone options */}
          <View style={sliderClipStyle} onLayout={handleSliderClipLayout}>
            <Animated.View
              style={[
                sliderTrackStyle,
                { transform: [{ translateX: sliderTranslateX }] },
              ]}
            >
              {/* Panel 1: Search bar */}
              <View style={sliderPanelStyle}>
                {showSearch && (
                  <SearchInput
                    size={size}
                    value={search}
                    onValueChange={setSearch}
                    onClear={() => setSearch('')}
                    placeholder={searchPlaceholder}
                    fullWidth
                  />
                )}
              </View>

              {/* Panel 2: Skin tone options */}
              {showSkinTones && (
                <View style={{ ...sliderPanelStyle, justifyContent: 'space-evenly' }}>
                  {skinTones.map((tone: SkinTone) => {
                    const isActive = currentSkinTone === tone;
                    const optStyle: ViewStyle = {
                      width: optionSize,
                      height: optionSize,
                      borderRadius: (theme.radii ?? defaultRadii).full ?? defaultRadii.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isActive ? colors.skinToneActiveBorder : 'transparent',
                      backgroundColor: isActive ? colors.bg : 'transparent',
                    };
                    return (
                      <Pressable
                        key={tone}
                        onPress={() => handleSkinToneChange(tone)}
                        accessibilityLabel={`Skin tone: ${tone}`}
                        style={optStyle}
                      >
                        <Text style={{ fontSize: optionFontSize }}>
                          {SKIN_TONE_HAND + SKIN_TONE_MODIFIERS[tone]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </View>

          {/* Hand button — always anchored on the right */}
          {showSkinTones && (
            <Pressable
              onPress={toggleSkinTonePicker}
              style={skinTriggerStyle}
              accessibilityLabel={skinToneOpen ? 'Back to search' : 'Select skin tone'}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: triggerHandFontSize }}>
                {SKIN_TONE_HAND + SKIN_TONE_MODIFIERS[currentSkinTone]}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category tabs ── */}
      {showCategories && !isSearching && (
        <View style={tabBarStyle}>
          {tabCategories.map((cat) => {
            const isActive = activeCategory === cat;
            const IconComp = CATEGORY_ICONS[cat];
            const tabStyle: ViewStyle = {
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: sizeConfig.tabHeight,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? colors.tabIndicator : 'transparent',
            };
            return (
              <Pressable key={cat} onPress={() => handleTabClick(cat)} style={tabStyle} accessibilityLabel={CATEGORY_LABELS[cat]}>
                <IconComp size={sizeConfig.tabIconSize} color={isActive ? colors.tabTextActive : colors.tabText} />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Emoji grid ── */}
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={gridContentStyle}
      >
        {!hasResults && (
          <View style={noResultsStyle}>
            <Text style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: colors.categoryLabel }}>No emoji found</Text>
          </View>
        )}

        {/* Recent section */}
        {recent && recent.length > 0 && !isSearching && (
          <View onLayout={handleSectionLayout('recent')}>
            <Text style={categoryLabelStyle}>Recent</Text>
            <View style={cellRowStyle}>
              {recent.map((emoji, i) => (
                <Pressable
                  key={`recent-${i}`}
                  onPress={() => handleSelect(emoji)}
                  accessibilityLabel={emoji}
                  style={cellStyle}
                >
                  <Text style={emojiTextStyle}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Category sections */}
        {dataCategories.map((cat: EmojiCategory) => {
          const items = grouped.get(cat);
          if (!items || items.length === 0) return null;

          // For the custom category, sub-group by groupName so each
          // server / source gets its own section header.
          if (cat === 'custom') {
            const subGroups: { id: string; name: string; items: EmojiItem[] }[] = [];
            const subGroupMap = new Map<string, EmojiItem[]>();
            const subGroupOrder: string[] = [];
            const subGroupNames = new Map<string, string>();

            for (const item of items) {
              const gid = item.groupId ?? '__ungrouped__';
              const gname = item.groupName ?? 'Custom';
              if (!subGroupMap.has(gid)) {
                subGroupMap.set(gid, []);
                subGroupOrder.push(gid);
                subGroupNames.set(gid, gname);
              }
              subGroupMap.get(gid)!.push(item);
            }
            for (const gid of subGroupOrder) {
              subGroups.push({ id: gid, name: subGroupNames.get(gid)!, items: subGroupMap.get(gid)! });
            }

            return (
              <View key={cat} onLayout={handleSectionLayout(cat)}>
                {subGroups.map((sg) => (
                  <View key={sg.id} style={{ marginBottom: sizeConfig.gap * 2 }}>
                    <Text style={categoryLabelStyle}>{sg.name}</Text>
                    <View style={cellRowStyle}>
                      {sg.items.map((item) => (
                        <Pressable
                          key={item.imageUrl || item.emoji}
                          onPress={() => handleSelect(item.emoji, item)}
                          accessibilityLabel={item.name}
                          style={item.imageUrl ? customCellStyle : cellStyle}
                        >
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={{ width: customEmojiDisplaySize, height: customEmojiDisplaySize }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={emojiTextStyle}>{item.emoji}</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          return (
            <View key={cat} onLayout={handleSectionLayout(cat)}>
              <Text style={categoryLabelStyle}>{CATEGORY_LABELS[cat]}</Text>
              <View style={cellRowStyle}>
                {items.map((item) => {
                  const displayEmoji = applySkinTone(item.emoji, item);
                  return (
                    <Pressable
                      key={item.imageUrl || item.emoji}
                      onPress={() => handleSelect(item.emoji, item)}
                      accessibilityLabel={item.name}
                      style={item.imageUrl ? customCellStyle : cellStyle}
                    >
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={{ width: customEmojiDisplaySize, height: customEmojiDisplaySize }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={emojiTextStyle}>{displayEmoji}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

EmojiPicker.displayName = 'EmojiPicker';
