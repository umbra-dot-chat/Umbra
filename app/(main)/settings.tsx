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

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <Box style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <SettingsDialog
        open={true}
        onClose={() => {}}
        inline
      />
    </Box>
  );
}
