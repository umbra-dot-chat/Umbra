import React from 'react';
import { View } from 'react-native';
import {
  Avatar, AvatarGroup, Button, HStack,
  Navbar, NavbarBrand, NavbarContent,
  Text, useTheme,
} from '@coexist/wisp-react-native';
import type { RightPanel } from '@/types/panels';
import { SearchIcon, PinIcon, UsersIcon } from '@/components/icons';

export interface ChatHeaderProps {
  active: { name: string; online?: boolean; group?: string[]; memberCount?: number } | undefined;
  rightPanel: RightPanel;
  togglePanel: (panel: NonNullable<RightPanel>) => void;
  onShowProfile: (name: string, event: any) => void;
}

export function ChatHeader({ active, rightPanel, togglePanel, onShowProfile }: ChatHeaderProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <Navbar variant="transparent" style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border.subtle }}>
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
              <Button
                variant="tertiary"
                size="sm"
                onPress={(e) => onShowProfile(active.name, e)}
                iconLeft={<Avatar name={active.name} size="sm" />}
              />
            )
          )}
          <View>
            <Text size="md" weight="bold">
              {active ? active.name : 'Chat'}
            </Text>
            {active && active.group && active.memberCount != null && (
              <Text size="xs" style={{ color: themeColors.text.secondary }}>
                {active.memberCount} {active.memberCount === 1 ? 'member' : 'members'}
              </Text>
            )}
            {active && !active.group && active.online && (
              <Text size="xs" style={{ color: themeColors.status.success }}>Online</Text>
            )}
          </View>
        </HStack>
      </NavbarBrand>
      <NavbarContent align="end">
        <Button
          variant={rightPanel === 'search' ? 'secondary' : 'tertiary'}
          size="sm"
          onPress={() => togglePanel('search')}
          accessibilityLabel="Search messages"
          iconLeft={<SearchIcon size={18} color={themeColors.text.secondary} />}
        />
        <Button
          variant={rightPanel === 'pins' ? 'secondary' : 'tertiary'}
          size="sm"
          onPress={() => togglePanel('pins')}
          accessibilityLabel="Toggle pinned messages"
          iconLeft={<PinIcon size={18} color={themeColors.text.secondary} />}
        />
        <Button
          variant={rightPanel === 'members' ? 'secondary' : 'tertiary'}
          size="sm"
          onPress={() => togglePanel('members')}
          accessibilityLabel="Toggle members"
          iconLeft={<UsersIcon size={18} color={themeColors.text.secondary} />}
        />
      </NavbarContent>
    </Navbar>
  );
}
