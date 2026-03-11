import React from 'react';
import { QuestTracker, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const questTrackerEntry: ComponentEntry = {
  slug: 'quest-tracker',
  name: 'QuestTracker',
  category: 'components',
  subcategory: 'Gamification',
  description:
    'Compact quest objective list with completion indicators, optional counters, collapsible header, and auto-calculated progress bar.',
  variantCount: 3,
  keywords: ['quest', 'tracker', 'objective', 'checklist', 'progress', 'gamification', 'task'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220 }}>
      <QuestTracker
        title="Daily Quest"
        size="sm"
        showProgress={false}
        objectives={[
          { id: '1', label: 'Log in', status: 'complete' },
          { id: '2', label: 'Complete a task', status: 'in-progress' },
          { id: '3', label: 'Invite a friend', status: 'incomplete' },
        ]}
      />
    </VStack>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <QuestTracker
            title="Getting Started"
            objectives={[
              { id: '1', label: 'Create your account', status: 'complete' },
              { id: '2', label: 'Complete your profile', status: 'complete' },
              { id: '3', label: 'Upload 5 files', status: 'in-progress', current: 3, target: 5 },
              { id: '4', label: 'Invite a teammate', status: 'incomplete' },
              { id: '5', label: 'Create your first project', status: 'incomplete' },
            ]}
          />
        </VStack>
      ),
      code: `import { QuestTracker } from '@wisp-ui/react';

<QuestTracker
  title="Getting Started"
  objectives={[
    { id: '1', label: 'Create account', status: 'complete' },
    { id: '2', label: 'Upload files', status: 'in-progress', current: 3, target: 5 },
    { id: '3', label: 'Invite friend', status: 'incomplete' },
  ]}
/>`,
    },
    {
      title: 'Collapsible',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <QuestTracker
            title="Weekly Challenge"
            collapsible
            objectives={[
              { id: '1', label: 'Complete 10 tasks', status: 'in-progress', current: 7, target: 10 },
              { id: '2', label: 'Review 3 documents', status: 'complete' },
              { id: '3', label: 'Share a project', status: 'incomplete' },
            ]}
          />
        </VStack>
      ),
      code: `<QuestTracker
  title="Weekly Challenge"
  collapsible
  objectives={[...]}
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <QuestTracker
            title="Small"
            size="sm"
            objectives={[
              { id: '1', label: 'Task A', status: 'complete' },
              { id: '2', label: 'Task B', status: 'incomplete' },
            ]}
          />
          <QuestTracker
            title="Medium"
            size="md"
            objectives={[
              { id: '1', label: 'Task A', status: 'complete' },
              { id: '2', label: 'Task B', status: 'in-progress' },
            ]}
          />
          <QuestTracker
            title="Large"
            size="lg"
            objectives={[
              { id: '1', label: 'Task A', status: 'complete' },
              { id: '2', label: 'Task B', status: 'incomplete' },
            ]}
          />
        </VStack>
      ),
      code: `<QuestTracker title="Small" size="sm" objectives={[...]} />
<QuestTracker title="Medium" size="md" objectives={[...]} />
<QuestTracker title="Large" size="lg" objectives={[...]} />`,
    },
  ],

  props: [
    { name: 'title', type: 'string', required: true, description: 'Quest title.' },
    { name: 'objectives', type: 'QuestObjective[]', required: true, description: 'Array of quest objectives.' },
    { name: 'progress', type: 'number', description: 'Override progress (0–100). Auto-calculated from objectives if omitted.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'collapsible', type: 'boolean', default: 'false', description: 'Whether objectives can be collapsed.' },
    { name: 'defaultExpanded', type: 'boolean', default: 'true', description: 'Initial expanded state.' },
    { name: 'showProgress', type: 'boolean', default: 'true', description: 'Show progress bar at top.' },
    { name: 'onObjectiveClick', type: '(id: string) => void', description: 'Objective click callback.' },
  ],
};
