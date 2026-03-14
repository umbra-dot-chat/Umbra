/**
 * SettingsNavSidebar — sidebar navigation for the inline /settings route.
 *
 * Renders the settings section list inside a SidebarShell so it shares the
 * same universal panels (account, notifications, call) as the ChatSidebar.
 *
 * Section/subsection state is driven by SettingsNavigationContext.
 */

import React, { useCallback, useMemo } from 'react';
import { Pressable, Platform, ScrollView } from 'react-native';
import {
  Box,
  SidebarSection,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { SidebarShell, useSidebarShellLayout } from './SidebarShell';
import type { SidebarShellProps } from './SidebarShell';
import { useSettingsNavigation } from '@/contexts/SettingsNavigationContext';
import { NAV_ITEMS, SUBCATEGORIES } from '@/components/modals/SettingsDialog';
import type { SettingsSection } from '@/components/modals/SettingsDialog';

// ─── Props ──────────────────────────────────────────────────────────────────

export type SettingsNavSidebarProps = Omit<SidebarShellProps, 'children'>;

// ─── Component ──────────────────────────────────────────────────────────────

export function SettingsNavSidebar(props: SettingsNavSidebarProps) {
  const { activeSection, activeSubsection, setActiveSection } = useSettingsNavigation();

  const handleSectionPress = useCallback((sectionId: SettingsSection) => {
    const subs = SUBCATEGORIES[sectionId];
    setActiveSection(sectionId, subs ? subs[0].id : null);
  }, [setActiveSection]);

  const handleSubPress = useCallback((sectionId: SettingsSection, subId: string) => {
    setActiveSection(sectionId, subId);
    // Scroll into view on web
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[id="sub-${subId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [setActiveSection]);

  const handleNavigateToSettings = useCallback((section: SettingsSection, subsection?: string) => {
    const subs = SUBCATEGORIES[section];
    setActiveSection(section, subsection ?? (subs ? subs[0].id : null));
    // Scroll subsection into view on web
    if (Platform.OS === 'web' && subsection) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[id="sub-${subsection}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [setActiveSection]);

  return (
    <SidebarShell {...props} searchScope="settings" onNavigateToSettings={handleNavigateToSettings}>
      <SettingsNavContent
        activeSection={activeSection}
        activeSubsection={activeSubsection}
        onSectionPress={handleSectionPress}
        onSubPress={handleSubPress}
      />
    </SidebarShell>
  );
}

// ─── Inner content (reads SidebarShell layout context) ──────────────────────

function SettingsNavContent({
  activeSection,
  activeSubsection,
  onSectionPress,
  onSubPress,
}: {
  activeSection: SettingsSection;
  activeSubsection: string | null;
  onSectionPress: (id: SettingsSection) => void;
  onSubPress: (sectionId: SettingsSection, subId: string) => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { hasBottomPanel, contentFlex } = useSidebarShellLayout();

  return (
    <SidebarSection
      style={{
        flex: contentFlex,
        borderTopWidth: 1,
        borderTopColor: tc.border.subtle,
        ...(hasBottomPanel ? { overflow: 'hidden' as any } : {}),
      }}
    >
      <Box
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          marginBottom: 8,
        }}
      >
        <Text
          size="xs"
          weight="semibold"
          style={{
            color: tc.text.onRaisedSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Settings
        </Text>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          const subs = SUBCATEGORIES[item.id];
          const hasSubs = subs && subs.length > 1;

          return (
            <Box key={item.id} style={{ paddingHorizontal: 4 }}>
              <Pressable
                onPress={() => onSectionPress(item.id)}
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
                <Icon size={16} color={isActive ? tc.text.primary : tc.text.secondary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? tc.text.primary : tc.text.secondary,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>

              {isActive && hasSubs && (
                <Box style={{ marginTop: 2, marginBottom: 4, marginLeft: 4 }}>
                  {subs.map((sub) => {
                    const isSubActive = activeSubsection === sub.id;
                    return (
                      <Box
                        key={sub.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'stretch',
                          marginBottom: 1,
                        }}
                      >
                        <Box
                          style={{
                            width: 2,
                            borderRadius: 1,
                            backgroundColor: isSubActive ? tc.text.primary : tc.border.strong,
                          }}
                        />
                        <Pressable
                          onPress={() => onSubPress(item.id, sub.id)}
                          style={({ pressed }) => ({
                            flex: 1,
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderTopRightRadius: 4,
                            borderBottomRightRadius: 4,
                            backgroundColor: isSubActive
                              ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                              : pressed
                                ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)')
                                : 'transparent',
                          })}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSubActive ? '600' : '400',
                              color: isSubActive ? tc.text.primary : tc.text.secondary,
                            }}
                          >
                            {sub.label}
                          </Text>
                        </Pressable>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </ScrollView>
    </SidebarSection>
  );
}
