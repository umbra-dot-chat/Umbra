/**
 * PluginErrorBoundary — Error boundary wrapping each plugin component.
 *
 * Catches runtime errors and render crashes in plugin slot components
 * without taking down the rest of the Umbra app.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

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
    console.error(
      `[Plugin Error] Plugin "${this.props.pluginId}"${this.props.slot ? ` in slot "${this.props.slot}"` : ''} crashed:`,
      error,
      errorInfo
    );
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
    <View
      style={{
        padding: 8,
        borderRadius: 6,
        backgroundColor: tc.status.dangerSurface,
        borderWidth: 1,
        borderColor: tc.status.dangerBorder,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: tc.status.danger,
        }}
      >
        Plugin error: {pluginId}
      </Text>
      {error && (
        <Text
          style={{
            fontSize: 10,
            color: tc.status.danger,
            fontFamily: 'monospace',
            opacity: 0.8,
          }}
          numberOfLines={2}
        >
          {error.message}
        </Text>
      )}
      <Pressable onPress={onRetry}>
        <Text
          style={{
            fontSize: 10,
            color: tc.status.info,
            fontWeight: '600',
          }}
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}
