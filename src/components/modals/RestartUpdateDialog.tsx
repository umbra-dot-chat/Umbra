import React from 'react';
import { Dialog, Button, Text, useTheme, Box } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

export interface RestartUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  version: string;
  onRestart: () => void;
}

export function RestartUpdateDialog({
  open,
  onClose,
  version,
  onRestart,
}: RestartUpdateDialogProps) {
  if (__DEV__) dbg.trackRender('RestartUpdateDialog');
  const { theme } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Update Ready"
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onPress={onClose}>
            Later
          </Button>
          <Button variant="primary" onPress={onRestart}>
            Restart Now
          </Button>
        </>
      }
    >
      <Box style={{ gap: 8 }}>
        <Text size="sm" style={{ color: theme.colors.text.secondary }}>
          Umbra v{version} has been downloaded and is ready to install. The app
          will restart to apply the update.
        </Text>
      </Box>
    </Dialog>
  );
}
