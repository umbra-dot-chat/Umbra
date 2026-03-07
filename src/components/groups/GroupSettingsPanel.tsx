/**
 * GroupSettingsPanel — Multi-section group settings panel for the right sidebar.
 *
 * Sections:
 *   1. General — Group name and description editing
 *   2. Members — Member list with role badges, remove, invite
 *   3. Security — Encryption info, key rotation
 *   4. Danger Zone — Leave group, delete group (admin only)
 *
 * Follows the SettingsDialog pattern (SectionHeader, SettingRow) for consistency.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  SettingsIcon,
  UserMinusIcon,
  ShieldIcon,
  UsersIcon,
  KeyIcon,
  AlertTriangleIcon,
  LogOutIcon,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import type { Group, GroupMember } from '@umbra/service';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface GroupSettingsPanelProps {
  groupId: string;
  onClose?: () => void;
}

// ─── Local sub-components (matching SettingsDialog patterns) ─────────────────

function SectionHeader({ title, description, icon }: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  return (
    <View style={{ marginBottom: 12 }}>
      <HStack style={{ alignItems: 'center', gap: 6, marginBottom: 2 }}>
        {icon}
        <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 } as TextStyle}>
          {title}
        </Text>
      </HStack>
      <Text style={{ fontSize: 12, color: tc.text.muted } as TextStyle}>
        {description}
      </Text>
    </View>
  );
}

function SettingRow({ label, description, children, vertical = false }: {
  label: string;
  description?: string;
  children: React.ReactNode;
  vertical?: boolean;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  if (vertical) {
    return (
      <View style={{ gap: 8, paddingVertical: 4 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary } as TextStyle}>{label}</Text>
          {description && (
            <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 } as TextStyle}>{description}</Text>
          )}
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, paddingVertical: 4 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary } as TextStyle}>{label}</Text>
        {description && (
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 } as TextStyle}>{description}</Text>
        )}
      </View>
      <View style={{ flexShrink: 0 }}>{children}</View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GroupSettingsPanel({ groupId, onClose }: GroupSettingsPanelProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { identity } = useAuth();
  const {
    groups, updateGroup, deleteGroup, removeMember, getMembers,
    leaveGroup, rotateGroupKey,
  } = useGroups();

  // ── State ──
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRemoveDid, setConfirmRemoveDid] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived ──
  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
  const isAdmin = useMemo(
    () => members.some((m) => m.memberDid === identity?.did && m.role === 'admin'),
    [members, identity?.did],
  );
  const confirmRemoveName = useMemo(
    () => members.find((m) => m.memberDid === confirmRemoveDid)?.displayName
      || confirmRemoveDid?.slice(0, 16) + '...',
    [members, confirmRemoveDid],
  );

  // ── Load members ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getMembers(groupId);
      if (!cancelled) setMembers(list);
    })();
    return () => { cancelled = true; };
  }, [groupId, getMembers]);

  // ── Sync edit fields with group data ──
  useEffect(() => {
    if (group && !isEditing) {
      setEditName(group.name);
      setEditDescription(group.description || '');
    }
  }, [group, isEditing]);

  // ── Handlers ──
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
      setIsEditing(false);
    } catch (err) {
      console.error('[GroupSettings] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [groupId, editName, editDescription, updateGroup]);

  const handleRemoveMember = useCallback(async () => {
    if (!confirmRemoveDid) return;
    setIsSubmitting(true);
    try {
      await removeMember(groupId, confirmRemoveDid);
      setMembers((prev) => prev.filter((m) => m.memberDid !== confirmRemoveDid));
      setConfirmRemoveDid(null);
    } catch (err) {
      console.error('[GroupSettings] Remove member failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, confirmRemoveDid, removeMember]);

  const handleRotateKey = useCallback(async () => {
    setIsRotating(true);
    setRotateSuccess(false);
    try {
      await rotateGroupKey(groupId);
      setRotateSuccess(true);
      setTimeout(() => setRotateSuccess(false), 3000);
    } catch (err) {
      console.error('[GroupSettings] Key rotation failed:', err);
    } finally {
      setIsRotating(false);
    }
  }, [groupId, rotateGroupKey]);

  const handleLeave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await leaveGroup(groupId);
      onClose?.();
    } catch (err) {
      console.error('[GroupSettings] Leave group failed:', err);
    } finally {
      setIsSubmitting(false);
      setConfirmLeave(false);
    }
  }, [groupId, leaveGroup, onClose]);

  const handleDelete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await deleteGroup(groupId);
      onClose?.();
    } catch (err) {
      console.error('[GroupSettings] Delete group failed:', err);
    } finally {
      setIsSubmitting(false);
      setConfirmDelete(false);
    }
  }, [groupId, deleteGroup, onClose]);

  // ── Styles ──
  const styles = useMemo(() => ({
    container: {
      flex: 1,
    } as ViewStyle,
    content: {
      padding: 16,
    } as ViewStyle,
    memberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 8,
      paddingHorizontal: 4,
    } as ViewStyle,
    memberName: {
      fontSize: 14,
      color: tc.text.primary,
      fontWeight: '500' as const,
    } as TextStyle,
    memberDid: {
      fontSize: 11,
      color: tc.text.secondary,
    } as TextStyle,
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: tc.accent.primary + '20',
    } as ViewStyle,
    roleText: {
      fontSize: 11,
      color: tc.accent.primary,
      fontWeight: '600' as const,
    } as TextStyle,
  }), [tc]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <VStack style={{ gap: 24, paddingBottom: 32 }}>

          {/* ══════════════════════════════════════════════════════════════
              Section 1: General
             ══════════════════════════════════════════════════════════════ */}
          <View>
            <SectionHeader
              title="General"
              description="Group name and description"
              icon={<SettingsIcon size={13} color={tc.text.secondary} />}
            />

            {isEditing ? (
              <VStack style={{ gap: 10 }}>
                <SettingRow label="Group Name" vertical>
                  <Input
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Group name"
                    gradientBorder
                  />
                </SettingRow>
                <SettingRow label="Description" vertical>
                  <TextArea
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="What's this group about?"
                    numberOfLines={2}
                    gradientBorder
                  />
                </SettingRow>
                <HStack style={{ gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <Button variant="tertiary" size="sm" onPress={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onPress={handleSave} disabled={isSaving || !editName.trim()}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack style={{ gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary } as TextStyle}>
                  {group?.name || 'Loading...'}
                </Text>
                {group?.description ? (
                  <Text style={{ fontSize: 13, color: tc.text.secondary } as TextStyle}>
                    {group.description}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 13, color: tc.text.muted, fontStyle: 'italic' } as TextStyle}>
                    No description
                  </Text>
                )}
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={startEditing}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  Edit
                </Button>
              </VStack>
            )}
          </View>

          <Separator />

          {/* ══════════════════════════════════════════════════════════════
              Section 2: Members
             ══════════════════════════════════════════════════════════════ */}
          <View>
            <SectionHeader
              title="Members"
              description="Manage group members"
              icon={<UsersIcon size={13} color={tc.text.secondary} />}
            />

            {members.length === 0 ? (
              <Text style={{ fontSize: 13, color: tc.text.muted, fontStyle: 'italic' } as TextStyle}>
                Loading members...
              </Text>
            ) : (
              <VStack style={{ gap: 2 }}>
                {members
                  .sort((a, b) => {
                    // Admins first, then alphabetical
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return (a.displayName || a.memberDid).localeCompare(b.displayName || b.memberDid);
                  })
                  .map((member) => (
                    <View key={member.memberDid} style={styles.memberRow}>
                      <VStack style={{ flex: 1, minWidth: 0 }}>
                        <HStack style={{ alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.displayName || member.memberDid.slice(0, 16) + '...'}
                          </Text>
                          {member.role === 'admin' && (
                            <View style={styles.roleBadge}>
                              <Text style={styles.roleText}>Admin</Text>
                            </View>
                          )}
                          {member.memberDid === identity?.did && (
                            <Text style={{ fontSize: 11, color: tc.text.muted } as TextStyle}>(you)</Text>
                          )}
                        </HStack>
                        <Text style={styles.memberDid} numberOfLines={1}>
                          {member.memberDid.slice(0, 28)}...
                        </Text>
                      </VStack>
                      {/* Remove button: only for admins, not on self, not on other admins */}
                      {isAdmin && member.memberDid !== identity?.did && member.role !== 'admin' && (
                        <Pressable
                          onPress={() => setConfirmRemoveDid(member.memberDid)}
                          hitSlop={8}
                          accessibilityLabel={`Remove ${member.displayName || 'member'}`}
                        >
                          <UserMinusIcon size={16} color={tc.status?.danger || '#ef4444'} />
                        </Pressable>
                      )}
                    </View>
                  ))}
              </VStack>
            )}
          </View>

          <Separator />

          {/* ══════════════════════════════════════════════════════════════
              Section 3: Security
             ══════════════════════════════════════════════════════════════ */}
          <View>
            <SectionHeader
              title="Security"
              description="Encryption and key management"
              icon={<ShieldIcon size={13} color={tc.text.secondary} />}
            />

            <VStack style={{ gap: 12 }}>
              <SettingRow
                label="End-to-end encrypted"
                description="Messages are encrypted with a shared group key"
              >
                <ShieldIcon size={16} color={tc.accent.primary} />
              </SettingRow>

              <SettingRow
                label="Rotate Key"
                description="Generate a new encryption key. Recommended after removing a member."
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleRotateKey}
                  disabled={isRotating}
                  iconLeft={<KeyIcon size={14} color={tc.text.secondary} />}
                >
                  {isRotating ? 'Rotating...' : rotateSuccess ? 'Rotated!' : 'Rotate'}
                </Button>
              </SettingRow>
            </VStack>
          </View>

          <Separator />

          {/* ══════════════════════════════════════════════════════════════
              Section 4: Danger Zone
             ══════════════════════════════════════════════════════════════ */}
          <View>
            <SectionHeader
              title="Danger Zone"
              description="Irreversible actions"
              icon={<AlertTriangleIcon size={13} color={tc.status?.danger || '#ef4444'} />}
            />

            <VStack style={{ gap: 12 }}>
              <SettingRow
                label="Leave Group"
                description="You will no longer receive messages from this group"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={() => setConfirmLeave(true)}
                  iconLeft={<LogOutIcon size={14} color="#fff" />}
                >
                  Leave
                </Button>
              </SettingRow>

              {isAdmin && (
                <SettingRow
                  label="Delete Group"
                  description="Permanently remove this group for all members"
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    onPress={() => setConfirmDelete(true)}
                  >
                    Delete
                  </Button>
                </SettingRow>
              )}
            </VStack>
          </View>
        </VStack>
      </ScrollView>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave Group"
        message={`Are you sure you want to leave "${group?.name || 'this group'}"? You will no longer receive messages and will need a new invite to rejoin.`}
        confirmLabel="Leave Group"
        onConfirm={handleLeave}
        submitting={isSubmitting}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Group"
        message={`Are you sure you want to permanently delete "${group?.name || 'this group'}"? This action cannot be undone and will remove the group for all members.`}
        confirmLabel="Delete Group"
        onConfirm={handleDelete}
        submitting={isSubmitting}
      />

      <ConfirmDialog
        open={confirmRemoveDid !== null}
        onClose={() => setConfirmRemoveDid(null)}
        title="Remove Member"
        message={`Are you sure you want to remove ${confirmRemoveName} from the group? You should rotate the group key after removing a member.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
        submitting={isSubmitting}
      />
    </View>
  );
}
