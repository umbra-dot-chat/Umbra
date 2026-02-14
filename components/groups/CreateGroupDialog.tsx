/**
 * CreateGroupDialog — Modal for creating a new group.
 *
 * Allows the user to name the group, add an optional description,
 * and select initial members from their friends list.
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Dialog,
  Input,
  TextArea,
  Button,
  Text,
  HStack,
  VStack,
  Card,
  useTheme,
} from '@coexist/wisp-react-native';
import { UsersIcon, PlusIcon, CheckIcon, XIcon } from '@/components/icons';
import { useFriends } from '@/hooks/useFriends';
import { useGroups } from '@/hooks/useGroups';
import type { Friend } from '@umbra/service';

export interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (groupId: string, conversationId: string) => void;
}

export function CreateGroupDialog({ open, onClose, onCreated }: CreateGroupDialogProps) {
  const theme = useTheme();
  const { friends } = useFriends();
  const { createGroup, sendInvite } = useGroups();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleFriend = useCallback((did: string) => {
    setValidationError(null);
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(did)) {
        next.delete(did);
      } else {
        next.add(did);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      setValidationError('Group name is required.');
      return;
    }
    if (selectedFriends.size === 0) {
      setValidationError('Select at least 1 friend to invite.');
      return;
    }
    if (selectedFriends.size > 255) {
      setValidationError('Maximum 255 members allowed.');
      return;
    }
    setValidationError(null);
    setIsCreating(true);
    try {
      const result = await createGroup(name.trim(), description.trim() || undefined);
      if (result) {
        // Send invites to selected friends (invite-accept flow)
        for (const did of selectedFriends) {
          const friend = friends.find((f) => f.did === did);
          await sendInvite(result.groupId, did, friend?.displayName);
        }

        onCreated?.(result.groupId, result.conversationId);

        // Show success message briefly before closing
        setSuccessMessage(`Invitations sent to ${selectedFriends.size} friend${selectedFriends.size === 1 ? '' : 's'}!`);
        setTimeout(() => {
          setSuccessMessage(null);
          setName('');
          setDescription('');
          setSelectedFriends(new Set());
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('[CreateGroupDialog] Failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      let userMessage = 'Failed to create group. Please try again.';
      if (msg.length > 0 && msg.length < 200) {
        userMessage = `Failed to create group: ${msg}`;
      }
      setValidationError(userMessage);
    } finally {
      setIsCreating(false);
    }
  }, [name, description, selectedFriends, createGroup, sendInvite, friends, onCreated, onClose]);

  const handleClose = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedFriends(new Set());
    setValidationError(null);
    setSuccessMessage(null);
    onClose();
  }, [onClose]);

  const styles = React.useMemo(() => ({
    container: {
      padding: 16,
      gap: 16,
      minWidth: 380,
    } as ViewStyle,
    header: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    } as TextStyle,
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    } as TextStyle,
    friendsList: {
      maxHeight: 200,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden' as const,
    } as ViewStyle,
    friendRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    } as ViewStyle,
    friendRowSelected: {
      backgroundColor: theme.colors.primary + '15',
    } as ViewStyle,
    friendName: {
      fontSize: 14,
      color: theme.colors.text,
    } as TextStyle,
    friendDid: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    } as TextStyle,
    checkIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,
    emptyFriends: {
      padding: 16,
      alignItems: 'center' as const,
    } as ViewStyle,
    emptyText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    } as TextStyle,
    buttons: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      gap: 8,
    } as ViewStyle,
  }), [theme]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <View style={styles.container}>
        <HStack style={{ alignItems: 'center', gap: 8 }}>
          <UsersIcon size={20} color={theme.colors.primary} />
          <Text style={styles.header}>Create Group & Invite Members</Text>
        </HStack>

        <VStack style={{ gap: 12 }}>
          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>Group Name *</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Enter group name..."
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group about?"
              numberOfLines={2}
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>
              Invite Members ({selectedFriends.size} selected, min 1)
            </Text>
            <View style={styles.friendsList}>
              {friends.length === 0 ? (
                <View style={styles.emptyFriends}>
                  <Text style={styles.emptyText}>No friends to add yet</Text>
                </View>
              ) : (
                <ScrollView>
                  {friends.map((friend) => {
                    const isSelected = selectedFriends.has(friend.did);
                    return (
                      <Pressable
                        key={friend.did}
                        onPress={() => toggleFriend(friend.did)}
                        style={[styles.friendRow, isSelected && styles.friendRowSelected]}
                      >
                        <VStack>
                          <Text style={styles.friendName}>
                            {friend.displayName}
                          </Text>
                          <Text style={styles.friendDid}>
                            {friend.did.slice(0, 24)}...
                          </Text>
                        </VStack>
                        {isSelected && (
                          <View style={styles.checkIcon}>
                            <CheckIcon size={12} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </VStack>
        </VStack>

        {validationError && (
          <Text style={{ fontSize: 12, color: theme.colors.status.danger, marginTop: -8 }}>
            {validationError}
          </Text>
        )}

        {successMessage && (
          <View style={{ backgroundColor: theme.colors.status.successSurface, borderRadius: 8, padding: 10, marginTop: -8, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.status.success }}>
              {successMessage}
            </Text>
          </View>
        )}

        <View style={styles.buttons}>
          <Button variant="ghost" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            onPress={handleCreate}
            disabled={!name.trim() || selectedFriends.size === 0 || selectedFriends.size > 255 || isCreating || !!successMessage}
          >
            {isCreating ? 'Sending Invites...' : 'Create & Invite'}
          </Button>
        </View>
      </View>
    </Dialog>
  );
}
