/**
 * /settings route — renders settings content inline (not as a modal).
 *
 * The sidebar navigation is handled by SettingsNavSidebar (rendered by the
 * layout), while this route renders the content pane via SettingsDialog in
 * inline mode.
 */

import React from 'react';
import { Box, useTheme } from '@coexist/wisp-react-native';
import { SettingsDialog } from '@/components/modals/SettingsDialog';
import { MobileBackButton } from '@/components/ui/MobileBackButton';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation('settings');

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
          label={t('title')}
          showLabel
        />
      </Box>
      <SettingsDialog
        open={true}
        onClose={() => {}}
        inline
      />
    </Box>
  );
}
