import React from 'react';
import { AchievementCard, VStack, HStack, Text } from '@wisp-ui/react';
import { Trophy, Star, Zap, Target, Award } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const achievementCardEntry: ComponentEntry = {
  slug: 'achievement-card',
  name: 'AchievementCard',
  category: 'components',
  subcategory: 'Gamification',
  description:
    'Card showing achievement with locked, in-progress, and unlocked states. Supports five rarity tiers with colour-coded accents.',
  variantCount: 5,
  keywords: ['achievement', 'card', 'badge', 'reward', 'gamification', 'unlock', 'rarity'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 240 }}>
      <AchievementCard
        title="First Steps"
        description="Complete your first task"
        status="unlocked"
        rarity="rare"
        icon={Star as any}
      />
    </VStack>
  ),

  examples: [
    {
      title: 'Statuses',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <AchievementCard
            title="Locked Achievement"
            description="Complete 10 tasks to unlock."
            status="locked"
            rarity="common"
          />
          <AchievementCard
            title="In Progress"
            description="Complete 5 more tasks."
            status="in-progress"
            progress={60}
            rarity="uncommon"
            icon={Target as any}
          />
          <AchievementCard
            title="Unlocked!"
            description="You completed all tasks."
            status="unlocked"
            rarity="rare"
            unlockedAt="Jan 15, 2025"
            icon={Trophy as any}
          />
        </VStack>
      ),
      code: `import { AchievementCard } from '@wisp-ui/react';

<AchievementCard title="Locked" status="locked" />
<AchievementCard title="In Progress" status="in-progress" progress={60} />
<AchievementCard title="Unlocked" status="unlocked" rarity="rare" />`,
    },
    {
      title: 'Rarity Tiers',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 400 }}>
          <AchievementCard title="Common Task" status="unlocked" rarity="common" icon={Trophy as any} />
          <AchievementCard title="Uncommon Find" status="unlocked" rarity="uncommon" icon={Zap as any} />
          <AchievementCard title="Rare Discovery" status="unlocked" rarity="rare" icon={Star as any} />
          <AchievementCard title="Epic Victory" status="unlocked" rarity="epic" icon={Award as any} />
          <AchievementCard title="Legendary Mastery" status="unlocked" rarity="legendary" icon={Trophy as any} />
        </VStack>
      ),
      code: `<AchievementCard title="Common" status="unlocked" rarity="common" />
<AchievementCard title="Rare" status="unlocked" rarity="rare" />
<AchievementCard title="Legendary" status="unlocked" rarity="legendary" />`,
    },
  ],

  props: [
    { name: 'title', type: 'string', required: true, description: 'Achievement title.' },
    { name: 'description', type: 'string', description: 'Achievement description.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Icon component. Defaults to Trophy (or Lock when locked).' },
    { name: 'status', type: "'locked' | 'in-progress' | 'unlocked'", default: "'locked'", description: 'Current achievement status.' },
    { name: 'progress', type: 'number', default: '0', description: 'Progress value (0–100) for in-progress status.' },
    { name: 'rarity', type: "'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'", default: "'common'", description: 'Rarity tier determining colour accents.' },
    { name: 'unlockedAt', type: 'string', description: 'Date when unlocked (displayed when status is unlocked).' },
    { name: 'onClick', type: '() => void', description: 'Click handler.' },
  ],
};
