import React from 'react';
import { Text, VStack } from '@wisp-ui/react';
import { entriesByCategory } from '../registry';
import { CategoryGrid } from '../shared/CategoryGrid';

export function TokensPage() {
  const entries = entriesByCategory('tokens');

  return (
    <VStack gap="lg">
      <div>
        <Text size="display-sm" weight="bold">
          Tokens
        </Text>
        <div style={{ marginTop: 6 }}>
          <Text size="md" color="secondary">
            Design tokens — colors, spacing, typography, radii, shadows, and motion values.
          </Text>
        </div>
      </div>
      {entries.length > 0 ? (
        <CategoryGrid entries={entries} />
      ) : (
        <Text size="sm" color="muted">
          Token documentation coming soon.
        </Text>
      )}
    </VStack>
  );
}
