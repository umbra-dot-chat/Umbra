/**
 * GuideDialog — In-app user manual presented as a "book" modal.
 *
 * Organised into chapters on the left with scrollable content on
 * the right, mirroring the familiar Settings dialog layout.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Overlay, useTheme } from '@coexist/wisp-react-native';
import {
  BookOpenIcon,
  UsersIcon,
  MessageIcon,
  SettingsIcon,
  ShieldIcon,
  PlusIcon,
  PuzzleIcon,
  XIcon,
  PhoneIcon,
} from '@/components/icons';

// Import content components from separate files
import GettingStartedContent from '@/components/guide/GettingStartedContent';
import FriendsContent from '@/components/guide/FriendsContent';
import MessagingContent from '@/components/guide/MessagingContent';
import GroupsContent from '@/components/guide/GroupsContent';
import CallingContent from '@/components/guide/CallingContent';
import DataManagementContent from '@/components/guide/DataManagementContent';
import SecurityContent from '@/components/guide/SecurityContent';
import NetworkContent from '@/components/guide/NetworkContent';
import PluginsContent from '@/components/guide/PluginsContent';
import LimitationsContent from '@/components/guide/LimitationsContent';
import TechnicalReferenceContent from '@/components/guide/TechnicalReferenceContent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuideDialogProps {
  open: boolean;
  onClose: () => void;
}

type Chapter =
  | 'getting-started'
  | 'friends'
  | 'messaging'
  | 'groups'
  | 'calling'
  | 'data'
  | 'security'
  | 'network'
  | 'plugins'
  | 'limitations'
  | 'technical';

interface ChapterItem {
  id: Chapter;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const CHAPTERS: ChapterItem[] = [
  { id: 'getting-started', label: 'Getting Started', icon: PlusIcon, color: '#22C55E' },
  { id: 'friends', label: 'Friends', icon: UsersIcon, color: '#8B5CF6' },
  { id: 'messaging', label: 'Messaging', icon: MessageIcon, color: '#3B82F6' },
  { id: 'groups', label: 'Groups', icon: UsersIcon, color: '#EC4899' },
  { id: 'calling', label: 'Calling', icon: PhoneIcon, color: '#10B981' },
  { id: 'data', label: 'Data Management', icon: SettingsIcon, color: '#F59E0B' },
  { id: 'security', label: 'Security & Privacy', icon: ShieldIcon, color: '#EAB308' },
  { id: 'network', label: 'Network', icon: SettingsIcon, color: '#06B6D4' },
  { id: 'plugins', label: 'Plugins', icon: PuzzleIcon, color: '#8B5CF6' },
  { id: 'limitations', label: 'Limitations', icon: BookOpenIcon, color: '#F97316' },
  { id: 'technical', label: 'Tech Reference', icon: SettingsIcon, color: '#6366F1' },
];

// ---------------------------------------------------------------------------
// GuideDialog
// ---------------------------------------------------------------------------

export function GuideDialog({ open, onClose }: GuideDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [activeChapter, setActiveChapter] = useState<Chapter>('getting-started');

  // -- Styles ----------------------------------------------------------------

  const modalStyle = useMemo<ViewStyle>(
    () => ({
      width: 860,
      maxWidth: '95%',
      height: 600,
      maxHeight: '90%',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? tc.border.subtle : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 32,
      elevation: 12,
    }),
    [tc, isDark],
  );

  const sidebarStyle = useMemo<ViewStyle>(
    () => ({
      width: 210,
      backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
      borderRightWidth: 1,
      borderRightColor: tc.border.subtle,
      paddingVertical: 16,
      paddingHorizontal: 10,
    }),
    [tc, isDark],
  );

  // -- Render chapter --------------------------------------------------------

  const renderChapter = useCallback(() => {
    switch (activeChapter) {
      case 'getting-started':
        return <GettingStartedContent />;
      case 'friends':
        return <FriendsContent />;
      case 'messaging':
        return <MessagingContent />;
      case 'groups':
        return <GroupsContent />;
      case 'calling':
        return <CallingContent />;
      case 'data':
        return <DataManagementContent />;
      case 'security':
        return <SecurityContent />;
      case 'network':
        return <NetworkContent />;
      case 'plugins':
        return <PluginsContent />;
      case 'limitations':
        return <LimitationsContent />;
      case 'technical':
        return <TechnicalReferenceContent />;
    }
  }, [activeChapter]);

  const activeInfo = CHAPTERS.find((c) => c.id === activeChapter)!;

  // -- Render ----------------------------------------------------------------

  return (
    <Overlay open={open} backdrop="dim" center onBackdropPress={onClose} animationType="fade">
      <View style={modalStyle}>
        {/* ── Left: Chapter Navigation ── */}
        <View style={sidebarStyle}>
          {/* Book Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginBottom: 16 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: tc.accent.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpenIcon size={16} color={tc.text.inverse} />
            </View>
            <RNText style={{ fontSize: 15, fontWeight: '700', color: tc.text.primary }}>User Guide</RNText>
          </View>

          {/* Chapter List */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {CHAPTERS.map((ch) => {
              const isActive = activeChapter === ch.id;
              const Icon = ch.icon;

              return (
                <Pressable
                  key={ch.id}
                  onPress={() => setActiveChapter(ch.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 9,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isActive
                      ? tc.accent.primary
                      : pressed
                        ? tc.accent.highlight
                        : 'transparent',
                    marginBottom: 2,
                  })}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: isActive ? ch.color : tc.accent.highlight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={13} color={isActive ? tc.text.inverse : tc.text.secondary} />
                  </View>
                  <RNText
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? tc.text.inverse : tc.text.secondary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {ch.label}
                  </RNText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <RNText style={{ fontSize: 11, color: tc.text.muted, textAlign: 'center', marginTop: 12 }}>
            Umbra v0.1.0
          </RNText>
        </View>

        {/* ── Right: Chapter Content ── */}
        <View style={{ flex: 1 }}>
          {/* Chapter Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 28,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: activeInfo.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <activeInfo.icon size={18} color={tc.text.inverse} />
              </View>
              <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
                {activeInfo.label}
              </RNText>
            </View>

            <Pressable
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Close guide"
            >
              <XIcon size={16} color={tc.text.secondary} />
            </Pressable>
          </View>

          {/* Chapter Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 28, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {renderChapter()}
          </ScrollView>
        </View>
      </View>
    </Overlay>
  );
}
