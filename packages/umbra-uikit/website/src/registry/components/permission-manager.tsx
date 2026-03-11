import React, { useState } from 'react';
import { PermissionManager, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const samplePermissions = [
  { id: 'view-channels', name: 'View Channels', description: 'Allow members to view channels.', category: 'general' as const },
  { id: 'send-messages', name: 'Send Messages', description: 'Allow members to send messages in text channels.', category: 'text' as const },
  { id: 'embed-links', name: 'Embed Links', description: 'Allow link embeds in messages.', category: 'text' as const },
  { id: 'connect-voice', name: 'Connect', description: 'Allow members to connect to voice channels.', category: 'voice' as const },
  { id: 'speak', name: 'Speak', description: 'Allow members to speak in voice channels.', category: 'voice' as const },
  { id: 'kick-members', name: 'Kick Members', description: 'Remove members from the server.', category: 'management' as const, dangerous: true },
  { id: 'ban-members', name: 'Ban Members', description: 'Permanently ban members.', category: 'management' as const, dangerous: true },
];

const defaultState: Record<string, boolean | null> = {
  'view-channels': true,
  'send-messages': true,
  'embed-links': null,
  'connect-voice': true,
  'speak': true,
  'kick-members': false,
  'ban-members': null,
};

function InteractivePermissionManager() {
  const [state, setState] = useState(defaultState);
  return (
    <PermissionManager
      permissions={samplePermissions}
      state={state}
      onChange={(id, value) => setState((prev) => ({ ...prev, [id]: value }))}
      style={{ maxWidth: 500, maxHeight: 400 }}
    />
  );
}

export const permissionManagerEntry: ComponentEntry = {
  slug: 'permission-manager',
  name: 'PermissionManager',
  category: 'components',
  subcategory: 'Roles & Permissions',
  description:
    'A categorized list of permissions with tri-state toggles (allow / deny / inherit) for managing role or channel permissions.',
  variantCount: 2,
  keywords: ['permission', 'manager', 'role', 'toggle', 'allow', 'deny', 'inherit', 'admin'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <PermissionManager
        permissions={samplePermissions.slice(0, 3)}
        state={defaultState}
        onChange={() => {}}
        style={{ maxHeight: 200 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <InteractivePermissionManager />,
      code: `const [state, setState] = useState({
  'view-channels': true,
  'send-messages': true,
  'kick-members': false,
  'ban-members': null, // inherit
});

<PermissionManager
  permissions={permissions}
  state={state}
  onChange={(id, value) => setState(prev => ({ ...prev, [id]: value }))}
/>`,
    },
    {
      title: 'Read Only',
      render: (
        <PermissionManager
          permissions={samplePermissions}
          state={defaultState}
          onChange={() => {}}
          readOnly
          style={{ maxWidth: 500, maxHeight: 400 }}
        />
      ),
      code: `<PermissionManager
  permissions={permissions}
  state={currentState}
  onChange={() => {}}
  readOnly
/>`,
    },
  ],

  props: [
    { name: 'permissions', type: 'Permission[]', required: true, description: 'Full list of available permissions.' },
    { name: 'state', type: 'PermissionState', required: true, description: 'Map of permission id to value (true=allow, false=deny, null=inherit).' },
    { name: 'onChange', type: '(id: string, value: boolean | null) => void', required: true, description: 'Called when a permission toggle changes.' },
    { name: 'categories', type: "PermissionCategory[]", description: 'Limit displayed categories. If omitted, all are shown.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Disable all toggles.' },
  ],
};
