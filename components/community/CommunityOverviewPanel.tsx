/**
 * @module CommunityOverviewPanel
 * @description Panel for editing community name, description, and icon.
 * Used within the CommunitySettingsDialog.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Input, TextArea, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityOverviewPanelProps {
  /** Current community name. */
  name: string;
  /** Current community description. */
  description: string;
  /** Callback to save changes. */
  onSave: (updates: { name?: string; description?: string }) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityOverviewPanel({ name, description, onSave }: CommunityOverviewPanelProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync with parent when props change
  useEffect(() => {
    setEditName(name);
    setEditDescription(description);
  }, [name, description]);

  const hasChanges = editName !== name || editDescription !== description;

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updates: { name?: string; description?: string } = {};
      if (editName !== name) updates.name = editName.trim();
      if (editDescription !== description) updates.description = editDescription.trim();
      await onSave(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [editName, editDescription, name, description, hasChanges, onSave]);

  return (
    <View style={{ gap: defaultSpacing.lg, padding: defaultSpacing.md }}>
      {/* Section header */}
      <View>
        <Text size="lg" weight="semibold" style={{ color: tc.text.primary, marginBottom: 4 }}>
          Overview
        </Text>
        <Text size="sm" style={{ color: tc.text.muted }}>
          Edit your community's basic information.
        </Text>
      </View>

      {/* Community Name */}
      <View style={{ gap: defaultSpacing.xs }}>
        <Text size="sm" weight="medium" style={{ color: tc.text.secondary }}>
          Server Name
        </Text>
        <Input
          value={editName}
          onChangeText={setEditName}
          placeholder="Community name"
        />
      </View>

      {/* Description */}
      <View style={{ gap: defaultSpacing.xs }}>
        <Text size="sm" weight="medium" style={{ color: tc.text.secondary }}>
          Description
        </Text>
        <TextArea
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="What's this community about?"
          numberOfLines={4}
        />
      </View>

      {/* Save button */}
      {hasChanges && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.md,
            padding: defaultSpacing.md,
            backgroundColor: tc.background.sunken,
            borderRadius: defaultRadii.md,
          }}
        >
          <Text size="sm" style={{ color: tc.text.muted, flex: 1 }}>
            You have unsaved changes.
          </Text>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              setEditName(name);
              setEditDescription(description);
            }}
          >
            Reset
          </Button>
          <Button size="sm" onPress={handleSave} disabled={saving || !editName.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </View>
      )}

      {saved && (
        <Text size="sm" style={{ color: tc.status.success }}>
          Changes saved successfully.
        </Text>
      )}
    </View>
  );
}
