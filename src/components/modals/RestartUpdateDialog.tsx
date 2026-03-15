import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('updateReady')}
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onPress={onClose}>
            {t('later')}
          </Button>
          <Button variant="primary" onPress={onRestart}>
            {t('restartNow')}
          </Button>
        </>
      }
    >
      <Box style={{ gap: 8 }}>
        <Text size="sm" style={{ color: theme.colors.text.secondary }}>
          {t('updateReadyDesc', { version })}
        </Text>
      </Box>
    </Dialog>
  );
}
