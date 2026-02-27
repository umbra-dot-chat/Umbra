import React from 'react';
import { View } from 'react-native';
import { Dialog, Button, Text, useTheme } from '@coexist/wisp-react-native';

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
      <View style={{ gap: 8 }}>
        <Text size="sm" style={{ color: theme.colors.text.secondary }}>
          Umbra v{version} has been downloaded and is ready to install. The app
          will restart to apply the update.
        </Text>
      </View>
    </Dialog>
  );
}
