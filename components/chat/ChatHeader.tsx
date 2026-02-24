import React, { useState, useRef, useEffect } from 'react';
import { Animated, Pressable, View } from 'react-native';
import {
  Avatar, AvatarGroup, Button, HStack,
  Navbar, NavbarBrand, NavbarContent,
  Text, useTheme,
} from '@coexist/wisp-react-native';
import type { RightPanel } from '@/types/panels';
import { SearchIcon, PinIcon, UsersIcon, PhoneIcon, VideoIcon, FolderIcon, ArrowLeftIcon, MoreIcon, XIcon } from '@/components/icons';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface ChatHeaderProps {
  active: { name: string; online?: boolean; group?: string[]; memberCount?: number } | undefined;
  rightPanel: RightPanel;
  togglePanel: (panel: NonNullable<RightPanel>) => void;
  onShowProfile: (name: string, event: any, status?: 'online' | 'idle' | 'offline') => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  /** Whether to show call buttons */
  showCallButtons?: boolean;
  /** Whether to show the shared files button (DM only) */
  showFilesButton?: boolean;
  /** Mobile back navigation — returns to sidebar */
  onBack?: () => void;
}

export function ChatHeader({ active, rightPanel, togglePanel, onShowProfile, onVoiceCall, onVideoCall, showCallButtons, showFilesButton, onBack }: ChatHeaderProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Slide animation for mobile menu
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: mobileMenuOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [mobileMenuOpen]);

  const utilityButtons = (
    <>
      <Button
        variant={rightPanel === 'search' ? 'secondary' : 'tertiary'}
        size="sm"
        onPress={() => { togglePanel('search'); setMobileMenuOpen(false); }}
        accessibilityLabel="Search messages"
        iconLeft={<SearchIcon size={18} color={themeColors.text.secondary} />}
      />
      {showFilesButton && (
        <Button
          variant={rightPanel === 'files' ? 'secondary' : 'tertiary'}
          size="sm"
          onPress={() => { togglePanel('files'); setMobileMenuOpen(false); }}
          accessibilityLabel="Toggle shared files"
          iconLeft={<FolderIcon size={18} color={themeColors.text.secondary} />}
        />
      )}
      <Button
        variant={rightPanel === 'pins' ? 'secondary' : 'tertiary'}
        size="sm"
        onPress={() => { togglePanel('pins'); setMobileMenuOpen(false); }}
        accessibilityLabel="Toggle pinned messages"
        iconLeft={<PinIcon size={18} color={themeColors.text.secondary} />}
      />
      <Button
        variant={rightPanel === 'members' ? 'secondary' : 'tertiary'}
        size="sm"
        onPress={() => { togglePanel('members'); setMobileMenuOpen(false); }}
        accessibilityLabel="Toggle members"
        iconLeft={<UsersIcon size={18} color={themeColors.text.secondary} />}
      />
    </>
  );

  // ── Mobile layout with sliding menu ──
  if (isMobile) {
    // Animated values for the slide effect
    const brandOpacity = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });
    const brandTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -40],
    });
    const menuOpacity = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const menuTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0],
    });

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border.subtle,
      }}>
        {/* Back button — always visible, left edge */}
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={{ padding: 8 }}
            accessibilityLabel="Back to conversations"
          >
            <ArrowLeftIcon size={20} color={themeColors.text.secondary} />
          </Pressable>
        )}

        {/* Center area — brand slides out, utility slides in from right */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
          {/* Brand layer (name + avatar) — slides left to make room */}
          <Animated.View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flex: mobileMenuOpen ? undefined : 1,
            opacity: brandOpacity,
            transform: [{ translateX: brandTranslateX }],
          }}>
            {active && (
              active.group ? (
                <AvatarGroup max={2} size="sm" spacing={10}>
                  {active.group.map((name) => (
                    <Avatar key={name} name={name} size="sm" />
                  ))}
                </AvatarGroup>
              ) : (
                <Pressable onPress={(e) => onShowProfile(active.name, e, active.online ? 'online' : 'offline')}>
                  <Avatar name={active.name} size="sm" status={active.online ? 'online' : undefined} />
                </Pressable>
              )
            )}
            {!mobileMenuOpen && (
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text size="md" weight="bold" numberOfLines={1}>
                  {active ? active.name : 'Chat'}
                </Text>
                {active && active.group && active.memberCount != null && (
                  <Text size="xs" style={{ color: themeColors.text.secondary }}>
                    {active.memberCount} {active.memberCount === 1 ? 'member' : 'members'}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>

          {/* Utility layer — slides in from right, takes only natural width */}
          {mobileMenuOpen && (
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              marginLeft: 'auto',
              opacity: menuOpacity,
              transform: [{ translateX: menuTranslateX }],
            }}>
              {showCallButtons && (
                <>
                  <Pressable
                    onPress={() => { onVoiceCall?.(); setMobileMenuOpen(false); }}
                    style={{ padding: 8 }}
                    accessibilityLabel="Voice call"
                  >
                    <PhoneIcon size={18} color={themeColors.text.secondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => { onVideoCall?.(); setMobileMenuOpen(false); }}
                    style={{ padding: 8 }}
                    accessibilityLabel="Video call"
                  >
                    <VideoIcon size={18} color={themeColors.text.secondary} />
                  </Pressable>
                </>
              )}
              {utilityButtons}
            </Animated.View>
          )}
        </View>

        {/* Right side — call buttons when menu closed, or close button when menu open */}
        {!mobileMenuOpen ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            {showCallButtons && (
              <>
                <Pressable
                  onPress={onVoiceCall}
                  hitSlop={4}
                  style={{ padding: 8 }}
                  accessibilityLabel="Voice call"
                >
                  <PhoneIcon size={18} color={themeColors.text.secondary} />
                </Pressable>
                <Pressable
                  onPress={onVideoCall}
                  hitSlop={4}
                  style={{ padding: 8 }}
                  accessibilityLabel="Video call"
                >
                  <VideoIcon size={18} color={themeColors.text.secondary} />
                </Pressable>
              </>
            )}
            <Pressable
              onPress={() => setMobileMenuOpen(true)}
              hitSlop={4}
              style={{ padding: 8 }}
              accessibilityLabel="More options"
            >
              <MoreIcon size={18} color={themeColors.text.secondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setMobileMenuOpen(false)}
            hitSlop={8}
            style={{ padding: 8 }}
            accessibilityLabel="Close menu"
          >
            <XIcon size={18} color={themeColors.text.secondary} />
          </Pressable>
        )}
      </View>
    );
  }

  // ── Desktop layout (unchanged) ──
  return (
    <Navbar variant="transparent" style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border.subtle, paddingLeft: 12 }}>
      <NavbarBrand>
        <HStack style={{ alignItems: 'center', gap: 10 }}>
          {active && (
            active.group ? (
              <AvatarGroup max={2} size="sm" spacing={10}>
                {active.group.map((name) => (
                  <Avatar key={name} name={name} size="sm" />
                ))}
              </AvatarGroup>
            ) : (
              <Pressable
                onPress={(e) => onShowProfile(active.name, e, active.online ? 'online' : 'offline')}
              >
                <Avatar name={active.name} size="sm" status={active.online ? 'online' : undefined} />
              </Pressable>
            )
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size="md" weight="bold" numberOfLines={1}>
              {active ? active.name : 'Chat'}
            </Text>
            {active && active.group && active.memberCount != null && (
              <Text size="xs" style={{ color: themeColors.text.secondary }}>
                {active.memberCount} {active.memberCount === 1 ? 'member' : 'members'}
              </Text>
            )}
          </View>
        </HStack>
      </NavbarBrand>
      <NavbarContent align="end">
        {showCallButtons && (
          <>
            <Button
              variant="tertiary"
              size="sm"
              onPress={onVoiceCall}
              accessibilityLabel="Voice call"
              iconLeft={<PhoneIcon size={18} color={themeColors.text.secondary} />}
            />
            <Button
              variant="tertiary"
              size="sm"
              onPress={onVideoCall}
              accessibilityLabel="Video call"
              iconLeft={<VideoIcon size={18} color={themeColors.text.secondary} />}
            />
          </>
        )}
        {utilityButtons}
      </NavbarContent>
    </Navbar>
  );
}
