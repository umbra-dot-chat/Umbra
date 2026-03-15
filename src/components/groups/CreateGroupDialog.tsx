/**
 * CreateGroupDialog — Modal for creating a new group.
 *
 * Allows the user to name the group, add an optional description,
 * and select initial members from their friends list.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Box,
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
import { UsersIcon } from '@/components/ui';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { useGroups } from '@/hooks/useGroups';
import type { Friend } from '@umbra/service';
import { TEST_IDS } from '@/constants/test-ids';
import { useTranslation } from 'react-i18next';
import { dbg } from '@/utils/debug';

const SRC = 'CreateGroupDialog';

export interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (groupId: string, conversationId: string) => void;
}

export function CreateGroupDialog({ open, onClose, onCreated }: CreateGroupDialogProps) {
  if (__DEV__) dbg.trackRender('CreateGroupDialog');
  const theme = useTheme();
  const { t } = useTranslation('common');
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
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
        avatar: <Avatar name={f.displayName} size="sm" status={onlineDids.has(f.did) ? 'online' : 'offline'} />,
        status: onlineDids.has(f.did) ? 'online' as const : 'offline' as const,
      })),
    [friends, onlineDids],
  );

  const handleCreate = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      setValidationError(t('groupNameRequired'));
      return;
    }
    if (selectedFriends.size === 0) {
      setValidationError(t('selectMinFriend'));
      return;
    }
    if (selectedFriends.size > 255) {
      setValidationError(t('maxMembersAllowed'));
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
        setSuccessMessage(t('invitationsSent', { count: selectedFriends.size }));
        setTimeout(() => {
          setSuccessMessage(null);
          setName('');
          setDescription('');
          setSelectedFriends(new Set());
          onClose();
        }, 1200);
      }
    } catch (err) {
      if (__DEV__) dbg.error('groups', 'Failed to create group', err, SRC);
      const msg = err instanceof Error ? err.message : String(err);
      let userMessage = t('failedCreateGroup');
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
      <Box style={styles.container} testID={TEST_IDS.GROUPS.CREATE_DIALOG}>
        <HStack style={{ alignItems: 'center', gap: 8 }}>
          <UsersIcon size={20} color={theme.colors.accent.primary} />
          <Text style={styles.header}>{t('createGroupInvite')}</Text>
        </HStack>

        <VStack style={{ gap: 12 }}>
          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>{t('groupName')} *</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('enterGroupName')}
              style={{ width: '100%' }}
              testID={TEST_IDS.GROUPS.NAME_INPUT}
              gradientBorder
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>{t('descriptionOptional')}</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder={t('whatsGroupAbout')}
              numberOfLines={2}
              style={{ width: '100%' }}
              testID={TEST_IDS.GROUPS.DESCRIPTION_INPUT}
              gradientBorder
            />
          </VStack>

          <VStack style={{ gap: 4 }}>
            <Text style={styles.label}>
              {t('inviteMembersMin')}
            </Text>
            <UserPicker
              users={pickerUsers}
              selected={selectedFriends}
              onSelectionChange={handleSelectionChange}
              max={255}
              emptyMessage={t('noFriendsToAdd')}
              maxHeight={200}
              searchPlaceholder={t('searchFriends')}
              testID={TEST_IDS.GROUPS.MEMBER_PICKER}
            />
          </VStack>
        </VStack>

        {validationError && (
          <Text style={{ fontSize: 12, color: theme.colors.status.danger, marginTop: -8 }}>
            {validationError}
          </Text>
        )}

        {successMessage && (
          <Box style={{ backgroundColor: theme.colors.status.successSurface, borderRadius: 8, padding: 10, marginTop: -8, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.status.success }}>
              {successMessage}
            </Text>
          </Box>
        )}

        <Box style={styles.buttons}>
          <Button variant="tertiary" onPress={handleClose} testID={TEST_IDS.GROUPS.CANCEL_BUTTON}>
            {t('cancel')}
          </Button>
          <Button
            onPress={handleCreate}
            disabled={!name.trim() || selectedFriends.size === 0 || selectedFriends.size > 255 || isCreating || !!successMessage}
            testID={TEST_IDS.GROUPS.CREATE_BUTTON}
          >
            {isCreating ? t('sendingInvites') : t('createAndInvite')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
