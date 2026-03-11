import React from 'react';
import { Text, VStack } from '@wisp-ui/react';
import { entriesBySubcategory } from '../registry';
import { SubcategoryGrid } from '../shared/CategoryGrid';

export function LayoutsPage() {
  const groups = entriesBySubcategory('layouts');

  return (
    <VStack gap="lg">
      <div>
        <Text size="display-sm" weight="bold">
          Layouts
        </Text>
        <div style={{ marginTop: 6 }}>
          <Text size="md" color="secondary">
            Structural containers — cards, grids, stacks, sidebars, and spacing utilities.
          </Text>
        </div>
      </div>
      <SubcategoryGrid groups={groups} />
    </VStack>
  );
}
