import React from 'react';
import { UserProfileCard } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const userProfileCardEntry: ComponentEntry = {
  slug: 'user-profile-card',
  name: 'UserProfileCard',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'A popover or panel showing user profile details with avatar, status, bio, role badges, and action buttons.',
  variantCount: 4,
  keywords: ['profile', 'user', 'card', 'avatar', 'status', 'bio', 'role', 'popover'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <UserProfileCard
        name="Jane Doe"
        username="@janedoe"
        status="online"
        bio="Full-stack developer"
        roles={[
          { id: 'admin', label: 'Admin', color: '#e74c3c' },
          { id: 'dev', label: 'Developer', color: '#3498db' },
        ]}
        style={{ width: 280 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <UserProfileCard
          name="Jane Doe"
          username="@janedoe"
          status="online"
          statusText="Working from home"
          bio="Full-stack developer passionate about building great user experiences. Always learning something new."
          roles={[
            { id: 'admin', label: 'Admin', color: '#e74c3c' },
            { id: 'dev', label: 'Developer', color: '#3498db' },
            { id: 'design', label: 'Design', color: '#2ecc71' },
          ]}
          actions={[
            { id: 'message', label: 'Message', onClick: () => {} },
            { id: 'call', label: 'Call', onClick: () => {} },
          ]}
          onClose={() => {}}
          style={{ width: 320 }}
        />
      ),
      code: `<UserProfileCard
  name="Jane Doe"
  username="@janedoe"
  status="online"
  statusText="Working from home"
  bio="Full-stack developer passionate about building great user experiences."
  roles={[
    { id: 'admin', label: 'Admin', color: '#e74c3c' },
    { id: 'dev', label: 'Developer', color: '#3498db' },
    { id: 'design', label: 'Design', color: '#2ecc71' },
  ]}
  actions={[
    { id: 'message', label: 'Message', onClick: () => {} },
    { id: 'call', label: 'Call', onClick: () => {} },
  ]}
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'With Banner',
      render: (
        <UserProfileCard
          name="Alex Rivera"
          username="@alexr"
          status="idle"
          bio="Graphic designer and illustrator."
          bannerColor="#6c5ce7"
          roles={[{ id: 'artist', label: 'Artist', color: '#6c5ce7' }]}
          actions={[{ id: 'message', label: 'Message', onClick: () => {} }]}
          style={{ width: 320 }}
        />
      ),
      code: `<UserProfileCard
  name="Alex Rivera"
  username="@alexr"
  status="idle"
  bio="Graphic designer and illustrator."
  bannerColor="#6c5ce7"
  roles={[{ id: 'artist', label: 'Artist', color: '#6c5ce7' }]}
  actions={[{ id: 'message', label: 'Message', onClick: () => {} }]}
/>`,
    },
    {
      title: 'Different Statuses',
      render: (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <UserProfileCard
            name="Online User"
            username="@online"
            status="online"
            statusText="Available"
            style={{ width: 240 }}
          />
          <UserProfileCard
            name="Idle User"
            username="@idle"
            status="idle"
            statusText="Away"
            style={{ width: 240 }}
          />
          <UserProfileCard
            name="DND User"
            username="@busy"
            status="dnd"
            statusText="Do not disturb"
            style={{ width: 240 }}
          />
          <UserProfileCard
            name="Offline User"
            username="@offline"
            status="offline"
            style={{ width: 240 }}
          />
        </div>
      ),
      code: `<UserProfileCard name="Online User" status="online" statusText="Available" />
<UserProfileCard name="Idle User" status="idle" statusText="Away" />
<UserProfileCard name="DND User" status="dnd" statusText="Do not disturb" />
<UserProfileCard name="Offline User" status="offline" />`,
    },
    {
      title: 'Skeleton',
      render: (
        <UserProfileCard
          name=""
          skeleton
          style={{ width: 320 }}
        />
      ),
      code: `<UserProfileCard name="" skeleton />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: "User's display name." },
    { name: 'username', type: 'string', description: "User's username or handle (e.g. '@janedoe')." },
    { name: 'avatar', type: 'ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'status', type: "'online' | 'idle' | 'dnd' | 'offline'", default: "'offline'", description: "User's online status." },
    { name: 'statusText', type: 'string', description: "Custom status text (e.g. 'In a meeting')." },
    { name: 'bio', type: 'string', description: "User's bio or about text." },
    { name: 'roles', type: 'ProfileRole[]', description: 'List of role badges to display.' },
    { name: 'actions', type: 'ProfileAction[]', description: 'Action buttons (e.g. Message, Call).' },
    { name: 'bannerUrl', type: 'string', description: 'Optional banner image URL displayed at the top.' },
    { name: 'bannerColor', type: 'string', description: 'Optional banner color (used if no bannerUrl).' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Whether the card is in a loading/skeleton state.' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is clicked. If omitted, no close button is shown.' },
  ],
};
