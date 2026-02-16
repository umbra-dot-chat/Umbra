/**
 * CreateGroupDialog — Modal for creating a new group.
 *
 * Allows the user to name the group, add an optional description,
 * and select initial members from their friends list.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Dialog,
  Input,
  TextArea,
  Button,
  Text,
  Avatar,
  HStack,
  VStack,
  useTheme,
  UserPicker,
} from '@coexist/wisp-react-native';
import type { UserPickerUser } from '@coexist/wisp-react-native';
import { UsersIcon } from '@/components/icons';
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

  const handleSelectionChange = useCallback((selected: string[]) => {
    setValidationError(null);
    setSelectedFriends(new Set(selected));
  }, []);

  // Map friends to UserPickerUser format
  const pickerUsers: UserPickerUser[] = useMemo(
    () =>
      friends.map((f) => ({
        id: f.did,
        name: f.displayName,
        username: f.did.slice(0, 20) + '...',
        avatar: <Avatar name={f.displayName} size="sm" status={f.online ? 'online' : 'offline'} />,
        status: f.online ? 'online' as const : 'offline' as const,
      })),
    [friends],
  );

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
      color: theme.colors.text.primary,
    } as TextStyle,
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text.secondary,
      marginBottom: 4,
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
          <UsersIcon size={20} color={theme.colors.accent.primary} />
          <Text style={styles.header}>Create Group & Invite Members</Text>
        </HStack>

        <VStack style={{ gap: 12 }}>
          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>Group Name *</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Enter group name..."
              style={{ width: '100%' }}
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group about?"
              numberOfLines={2}
              style={{ width: '100%' }}
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>
              Invite Members (min 1)
            </Text>
            <UserPicker
              users={pickerUsers}
              selected={selectedFriends}
              onSelectionChange={handleSelectionChange}
              max={255}
              emptyMessage="No friends to add yet"
              maxHeight={200}
              searchPlaceholder="Search friends..."
            />
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
          <Button variant="tertiary" onPress={handleClose}>
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
