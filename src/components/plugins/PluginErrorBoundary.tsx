/**
 * PluginErrorBoundary — Error boundary wrapping each plugin component.
 *
 * Catches runtime errors and render crashes in plugin slot components
 * without taking down the rest of the Umbra app.
 */

import React from 'react';
import { Box, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

const SRC = 'PluginErrorBoundary';

interface Props {
  /** Plugin ID for error reporting */
  pluginId: string;
  /** Slot name for context */
  slot?: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PluginErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) dbg.error('plugins', `Plugin "${this.props.pluginId}"${this.props.slot ? ` in slot "${this.props.slot}"` : ''} crashed`, { error, errorInfo }, SRC);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <PluginErrorFallback
        pluginId={this.props.pluginId}
        error={this.state.error}
        onRetry={this.handleRetry}
      />;
    }
    return this.props.children;
  }
}

/** Minimal error fallback shown when a plugin crashes */
function PluginErrorFallback({
  pluginId,
  error,
  onRetry,
}: {
  pluginId: string;
  error: Error | null;
  onRetry: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Box
      style={{
        padding: 8,
        borderRadius: 6,
        backgroundColor: tc.status.dangerSurface,
        borderWidth: 1,
        borderColor: tc.status.dangerBorder,
        gap: 4,
      }}
    >
      <Text size="xs" weight="semibold" style={{ color: tc.status.danger }}>
        Plugin error: {pluginId}
      </Text>
      {error && (
        <Text
          size="xs"
          style={{
            color: tc.status.danger,
            fontFamily: 'monospace',
            opacity: 0.8,
          }}
          numberOfLines={2}
        >
          {error.message}
        </Text>
      )}
      <Button variant="tertiary" size="xs" onPress={onRetry}>
        <Text size="xs" weight="semibold" style={{ color: tc.status.info }}>
          Retry
        </Text>
      </Button>
    </Box>
  );
}
