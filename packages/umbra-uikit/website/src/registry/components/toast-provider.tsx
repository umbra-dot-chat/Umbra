import React, { useCallback } from 'react';
import {
  ToastProvider,
  useToast,
  Button,
  HStack,
  VStack,
  Card,
  Text,
} from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function ToastDemo() {
  return (
    <ToastProvider position="bottom-right" max={5}>
      <ToastDemoContent />
    </ToastProvider>
  );
}

function ToastDemoContent() {
  const { toast, dismissAll } = useToast();

  const showSuccess = useCallback(() => {
    toast({ variant: 'success', title: 'Saved', description: 'Your changes have been saved.' });
  }, [toast]);

  const showDanger = useCallback(() => {
    toast({ variant: 'danger', title: 'Error', description: 'Something went wrong.' });
  }, [toast]);

  const showWarning = useCallback(() => {
    toast({ variant: 'warning', title: 'Warning', description: 'Your session will expire soon.' });
  }, [toast]);

  const showInfo = useCallback(() => {
    toast({ variant: 'info', title: 'Update available', description: 'A new version is ready to install.' });
  }, [toast]);

  const showDefault = useCallback(() => {
    toast({ variant: 'default', title: 'Notification', description: 'You have a new message.' });
  }, [toast]);

  return (
    <VStack gap="md">
      <HStack gap="sm" style={{ flexWrap: 'wrap' }}>
        <Button variant="success" size="sm" onClick={showSuccess}>Success</Button>
        <Button variant="destructive" size="sm" onClick={showDanger}>Danger</Button>
        <Button variant="secondary" size="sm" onClick={showWarning}>Warning</Button>
        <Button variant="primary" size="sm" onClick={showInfo}>Info</Button>
        <Button variant="tertiary" size="sm" onClick={showDefault}>Default</Button>
      </HStack>
      <Button variant="secondary" size="sm" onClick={dismissAll}>Dismiss All</Button>
    </VStack>
  );
}

export const toastProviderEntry: ComponentEntry = {
  slug: 'toast-provider',
  name: 'ToastProvider',
  category: 'components',
  subcategory: 'Feedback & Guidance',
  description:
    'Context-based toast notification system with positioning, auto-dismiss, and max visible limit. Uses the existing Toast primitive for rendering.',
  variantCount: 6,
  keywords: ['toast', 'notification', 'snackbar', 'alert', 'provider'],

  cardPreview: (
    <Card variant="outlined" padding="md" radius="md" style={{ textAlign: 'center' }}>
      <VStack gap="2xs">
        <Text size="xs" weight="semibold">ToastProvider</Text>
        <Text size="xs" color="secondary">Notification system</Text>
      </VStack>
    </Card>
  ),

  examples: [
    {
      title: 'Interactive Demo',
      render: <ToastDemo />,
      code: `import { ToastProvider, useToast, Button } from '@wisp-ui/react';

function App() {
  return (
    <ToastProvider position="bottom-right">
      <Content />
    </ToastProvider>
  );
}

function Content() {
  const { toast, dismissAll } = useToast();

  return (
    <Button onClick={() => toast({
      variant: 'success',
      title: 'Saved',
      description: 'Changes saved.',
    })}>
      Show Toast
    </Button>
  );
}`,
      rnCode: `// Not yet available in React Native`,
    },
  ],

  props: [
    { name: 'position', type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'", default: "'bottom-right'", description: 'Where toasts appear on screen.' },
    { name: 'max', type: 'number', default: '5', description: 'Maximum visible toasts before oldest are dismissed.' },
    { name: 'toast()', type: '(options: ToastOptions) => string', description: 'Show a toast. Returns toast ID.' },
    { name: 'dismiss()', type: '(id: string) => void', description: 'Dismiss a specific toast by ID.' },
    { name: 'dismissAll()', type: '() => void', description: 'Dismiss all visible toasts.' },
  ],
};
