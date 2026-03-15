/**
 * /marketplace route — renders marketplace content inline (not as a modal).
 *
 * The sidebar navigation is handled by MarketplaceNavSidebar (rendered by the
 * layout), while this route renders the content pane via PluginMarketplace in
 * inline mode.
 */

import React from 'react';
import { Box, useTheme } from '@coexist/wisp-react-native';
import { PluginMarketplace } from '@/components/modals/PluginMarketplace';
import { MobileBackButton } from '@/components/ui/MobileBackButton';
import { useRouter } from 'expo-router';

export default function MarketplacePage() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Box style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <Box
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <MobileBackButton
          onPress={() => router.back()}
          label="Marketplace"
          showLabel
        />
      </Box>
      <PluginMarketplace
        open={true}
        onClose={() => {}}
        inline
      />
    </Box>
  );
}
