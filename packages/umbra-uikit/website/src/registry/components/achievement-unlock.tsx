import React, { useState } from 'react';
import { AchievementUnlock, VStack, HStack, Button, Text } from '@wisp-ui/react';
import { Trophy, Star, Zap } from 'lucide-react';
import type { ComponentEntry } from '../types';

/* ------------------------------------------------------------------ */
/* Interactive demo                                                    */
/* ------------------------------------------------------------------ */

function AchievementUnlockDemo({
  rarity = 'common' as const,
  label = 'Unlock',
}: {
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const icons: Record<string, any> = {
    common: Trophy,
    uncommon: Trophy,
    rare: Star,
    epic: Zap,
    legendary: Trophy,
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <AchievementUnlock
        open={open}
        onClose={() => setOpen(false)}
        title="Achievement Unlocked!"
        description="You've completed an amazing accomplishment. Keep up the great work!"
        rarity={rarity}
        icon={icons[rarity]}
        duration={0}
        actionLabel="Awesome!"
        onAction={() => setOpen(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Registry entry                                                      */
/* ------------------------------------------------------------------ */

export const achievementUnlockEntry: ComponentEntry = {
  slug: 'achievement-unlock',
  name: 'AchievementUnlock',
  category: 'components',
  subcategory: 'Gamification',
  description:
    'Animated popup notification for achievement unlock events. Features staggered entrance animations, rarity-coloured accents, and auto-dismiss.',
  variantCount: 5,
  keywords: ['achievement', 'unlock', 'popup', 'notification', 'reward', 'gamification', 'celebration'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220, alignItems: 'center' }}>
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 10,
          border: '1px solid var(--wisp-border-subtle, #2A2A2A)',
          borderTop: '3px solid #A78BFA',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <Text size="xs" weight="bold" color="secondary">Epic Achievement</Text>
        <Text weight="semibold">Unlocked!</Text>
      </div>
    </VStack>
  ),

  examples: [
    {
      title: 'Rarity Tiers',
      render: (
        <HStack gap="sm" style={{ flexWrap: 'wrap' }}>
          <AchievementUnlockDemo rarity="common" label="Common" />
          <AchievementUnlockDemo rarity="uncommon" label="Uncommon" />
          <AchievementUnlockDemo rarity="rare" label="Rare" />
          <AchievementUnlockDemo rarity="epic" label="Epic" />
          <AchievementUnlockDemo rarity="legendary" label="Legendary" />
        </HStack>
      ),
      code: `import { AchievementUnlock } from '@wisp-ui/react';

const [open, setOpen] = useState(false);

<AchievementUnlock
  open={open}
  onClose={() => setOpen(false)}
  title="Achievement Unlocked!"
  description="Great job completing this task."
  rarity="epic"
  duration={5000}
/>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the popup is visible.' },
    { name: 'onClose', type: '() => void', description: 'Close callback.' },
    { name: 'title', type: 'string', required: true, description: 'Achievement title.' },
    { name: 'description', type: 'string', description: 'Achievement description.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Icon component. Defaults to Trophy.' },
    { name: 'rarity', type: "'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'", default: "'common'", description: 'Rarity tier controlling accent colours.' },
    { name: 'duration', type: 'number', default: '5000', description: 'Auto-dismiss duration in ms. Set to 0 to disable.' },
    { name: 'actionLabel', type: 'string', description: 'Optional action button label.' },
    { name: 'onAction', type: '() => void', description: 'Action button callback.' },
  ],
};
