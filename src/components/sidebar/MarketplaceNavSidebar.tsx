/**
 * MarketplaceNavSidebar — sidebar navigation for the inline /marketplace route.
 *
 * Renders the marketplace section list (Plugins, Themes, Fonts) inside a
 * SidebarShell so it shares the same universal panels (account, notifications,
 * call) as the ChatSidebar.
 *
 * Section state is driven by MarketplaceNavigationContext.
 */

import React, { useCallback } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { SidebarShell, useSidebarShellLayout } from './SidebarShell';
import type { SidebarShellProps } from './SidebarShell';
import {
  useMarketplaceNavigation,
  type MarketplaceSection,
} from '@/contexts/MarketplaceNavigationContext';
import { PuzzleIcon, PaletteIcon, ShoppingBagIcon } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

// ─── Section data ────────────────────────────────────────────────────────────

interface SectionItem {
  id: MarketplaceSection;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  secondaryColor: string;
}

function FontIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Text
      style={{ fontSize: size, color: color ?? '#FFF', textAlign: 'center', lineHeight: size }}
      weight="bold"
    >
      A
    </Text>
  );
}

const SECTIONS: SectionItem[] = [
  { id: 'plugins', labelKey: 'plugins', icon: PuzzleIcon, color: '#8B5CF6', secondaryColor: '#a78bfa' },
  { id: 'themes', labelKey: 'themes', icon: PaletteIcon, color: '#EC4899', secondaryColor: '#f472b6' },
  { id: 'fonts', labelKey: 'fonts', icon: FontIcon, color: '#3B82F6', secondaryColor: '#60a5fa' },
];

// ─── Props ──────────────────────────────────────────────────────────────────

export type MarketplaceNavSidebarProps = Omit<SidebarShellProps, 'children'>;

// ─── Component ──────────────────────────────────────────────────────────────

export function MarketplaceNavSidebar(props: MarketplaceNavSidebarProps) {
  const { activeSection, setActiveSection } = useMarketplaceNavigation();

  const handleSectionPress = useCallback(
    (sectionId: MarketplaceSection) => {
      setActiveSection(sectionId);
    },
    [setActiveSection],
  );

  return (
    <SidebarShell {...props}>
      <MarketplaceNavContent
        activeSection={activeSection}
        onSectionPress={handleSectionPress}
      />
    </SidebarShell>
  );
}

// ─── Inner content ──────────────────────────────────────────────────────────

function MarketplaceNavContent({
  activeSection,
  onSectionPress,
}: {
  activeSection: MarketplaceSection;
  onSectionPress: (id: MarketplaceSection) => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { t } = useTranslation('sidebar');
  const { contentFlex } = useSidebarShellLayout();

  return (
    <Box style={{ marginTop: 12, flex: contentFlex, overflow: 'hidden' as any }}>
      {/* Header */}
      <Box
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <Box
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: '#F59E0B',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShoppingBagIcon size={13} color="#FFF" />
        </Box>
        <Text
          size="xs"
          weight="semibold"
          style={{
            color: tc.text.onRaisedSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {t('marketplace')}
        </Text>
      </Box>

      {/* Section list */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          const Icon = sec.icon;

          return (
            <Box key={sec.id} style={{ paddingHorizontal: 4 }}>
              <Pressable
                onPress={() => onSectionPress(sec.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 7,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: isActive
                    ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)')
                    : pressed
                      ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)')
                      : 'transparent',
                  marginBottom: 1,
                })}
              >
                <LinearGradient
                  colors={[sec.color, sec.secondaryColor]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <Icon size={13} color="#FFF" />
                </LinearGradient>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? tc.text.primary : tc.text.secondary,
                  }}
                >
                  {t(sec.labelKey)}
                </Text>
              </Pressable>
            </Box>
          );
        })}
      </ScrollView>
    </Box>
  );
}
