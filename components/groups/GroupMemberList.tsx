/**
 * GroupMemberList — Displays a list of group members with role badges.
 *
 * Used in the right panel when viewing a group conversation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Text,
  HStack,
  VStack,
  useTheme,
} from '@coexist/wisp-react-native';
import { UsersIcon, ShieldIcon, UserIcon, CrownIcon } from '@/components/icons';
import { useGroups } from '@/hooks/useGroups';
import type { GroupMember } from '@umbra/service';

export interface GroupMemberListProps {
  groupId: string;
  onMemberPress?: (memberDid: string) => void;
}

export function GroupMemberList({ groupId, onMemberPress }: GroupMemberListProps) {
  const theme = useTheme();
  const { getMembers } = useGroups();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const result = await getMembers(groupId);
      setMembers(result);
      setIsLoading(false);
    }
    load();
  }, [groupId, getMembers]);

  const styles = React.useMemo(() => ({
    container: {
      flex: 1,
      padding: 12,
    } as ViewStyle,
    header: {
      paddingBottom: 8,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.subtle,
    } as ViewStyle,
    headerText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    } as TextStyle,
    memberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 6,
    } as ViewStyle,
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.accent.primary + '20',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,
    name: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.colors.text.primary,
    } as TextStyle,
    roleText: {
      fontSize: 11,
      color: theme.colors.accent.primary,
      fontWeight: '600' as const,
    } as TextStyle,
    emptyText: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      textAlign: 'center' as const,
      paddingVertical: 16,
    } as TextStyle,
    count: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    } as TextStyle,
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading members...</Text>
      </View>
    );
  }

  // Sort: admins first, then alphabetical
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return (a.displayName || a.memberDid).localeCompare(b.displayName || b.memberDid);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <HStack style={{ alignItems: 'center', gap: 6 }}>
            <UsersIcon size={14} color={theme.colors.text.secondary} />
            <Text style={styles.headerText}>Members</Text>
          </HStack>
          <Text style={styles.count}>{members.length}</Text>
        </HStack>
      </View>

      <ScrollView>
        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>No members</Text>
        ) : (
          sorted.map((member) => (
            <Pressable
              key={member.memberDid}
              style={styles.memberRow}
              onPress={() => onMemberPress?.(member.memberDid)}
            >
              <View style={styles.avatar}>
                {member.role === 'admin' ? (
                  <ShieldIcon size={16} color={theme.colors.accent.primary} />
                ) : (
                  <UserIcon size={16} color={theme.colors.accent.primary} />
                )}
              </View>
              <VStack style={{ flex: 1 }}>
                <HStack style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {member.displayName || member.memberDid.slice(0, 16) + '...'}
                  </Text>
                  {member.role === 'admin' && (
                    <Text style={styles.roleText}>Admin</Text>
                  )}
                </HStack>
              </VStack>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
