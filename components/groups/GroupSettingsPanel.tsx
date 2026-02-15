/**
 * GroupSettingsPanel — View and edit group info, manage members.
 *
 * Shows group name, description, member list, and allows
 * admins to edit settings and manage members.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Input,
  TextArea,
  Button,
  Text,
  HStack,
  VStack,
  Separator,
  useTheme,
} from '@coexist/wisp-react-native';
import { SettingsIcon, UserPlusIcon, UserMinusIcon, ShieldIcon, UsersIcon } from '@/components/icons';
import { useGroups } from '@/hooks/useGroups';
import type { Group, GroupMember } from '@umbra/service';

export interface GroupSettingsPanelProps {
  groupId: string;
  onClose?: () => void;
}

export function GroupSettingsPanel({ groupId, onClose }: GroupSettingsPanelProps) {
  const theme = useTheme();
  const { updateGroup, deleteGroup, removeMember, getMembers } = useGroups();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load group and members
  useEffect(() => {
    async function load() {
      const memberList = await getMembers(groupId);
      setMembers(memberList);
    }
    load();
  }, [groupId, getMembers]);

  const startEditing = useCallback(() => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description || '');
      setIsEditing(true);
    }
  }, [group]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateGroup(groupId, editName, editDescription || undefined);
      setGroup((prev) => prev ? { ...prev, name: editName, description: editDescription } : prev);
      setIsEditing(false);
    } catch (err) {
      console.error('[GroupSettings] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [groupId, editName, editDescription, updateGroup]);

  const handleRemoveMember = useCallback(async (did: string) => {
    await removeMember(groupId, did);
    setMembers((prev) => prev.filter((m) => m.memberDid !== did));
  }, [groupId, removeMember]);

  const handleDelete = useCallback(async () => {
    await deleteGroup(groupId);
    onClose?.();
  }, [groupId, deleteGroup, onClose]);

  const styles = React.useMemo(() => ({
    container: {
      flex: 1,
      padding: 16,
    } as ViewStyle,
    header: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    } as TextStyle,
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: 8,
    } as TextStyle,
    memberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 8,
      paddingHorizontal: 4,
    } as ViewStyle,
    memberName: {
      fontSize: 14,
      color: theme.colors.text.primary,
      fontWeight: '500' as const,
    } as TextStyle,
    memberDid: {
      fontSize: 11,
      color: theme.colors.text.secondary,
    } as TextStyle,
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: theme.colors.accent.primary + '20',
    } as ViewStyle,
    roleText: {
      fontSize: 11,
      color: theme.colors.accent.primary,
      fontWeight: '600' as const,
    } as TextStyle,
    dangerButton: {
      marginTop: 16,
    } as ViewStyle,
  }), [theme]);

  return (
    <ScrollView style={styles.container}>
      <VStack style={{ gap: 20 }}>
        <HStack style={{ alignItems: 'center', gap: 8 }}>
          <SettingsIcon size={18} color={theme.colors.text.primary} />
          <Text style={styles.header}>Group Settings</Text>
        </HStack>

        {isEditing ? (
          <VStack style={{ gap: 12 }}>
            <Input
              value={editName}
              onChangeText={setEditName}
              placeholder="Group name"
            />
            <TextArea
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description"
              numberOfLines={2}
            />
            <HStack style={{ gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="tertiary" onPress={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onPress={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </HStack>
          </VStack>
        ) : (
          <VStack style={{ gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
              {group?.name || 'Loading...'}
            </Text>
            {group?.description && (
              <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
                {group.description}
              </Text>
            )}
            <Button variant="tertiary" size="sm" onPress={startEditing} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              Edit
            </Button>
          </VStack>
        )}

        <Separator />

        <VStack style={{ gap: 8 }}>
          <HStack style={{ alignItems: 'center', gap: 6 }}>
            <UsersIcon size={14} color={theme.colors.text.secondary} />
            <Text style={styles.sectionTitle}>
              Members ({members.length})
            </Text>
          </HStack>

          {members.map((member) => (
            <View key={member.memberDid} style={styles.memberRow}>
              <VStack>
                <HStack style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={styles.memberName}>
                    {member.displayName || member.memberDid.slice(0, 16) + '...'}
                  </Text>
                  {member.role === 'admin' && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>Admin</Text>
                    </View>
                  )}
                </HStack>
                <Text style={styles.memberDid}>
                  {member.memberDid.slice(0, 24)}...
                </Text>
              </VStack>
              {member.role !== 'admin' && (
                <Pressable onPress={() => handleRemoveMember(member.memberDid)}>
                  <UserMinusIcon size={16} color={theme.colors.status.danger || '#ef4444'} />
                </Pressable>
              )}
            </View>
          ))}
        </VStack>

        <Separator />

        <Button
          variant="destructive"
          onPress={handleDelete}
          style={styles.dangerButton}
        >
          Delete Group
        </Button>
      </VStack>
    </ScrollView>
  );
}
