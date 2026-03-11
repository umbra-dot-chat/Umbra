/**
 * @module components/node-pairing-flow
 * @description React Native NodePairingFlow component for the Wisp design system.
 *
 * Reuses type definitions from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` + `<Pressable>` + `<Modal>`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import type { ViewProps } from 'react-native';
import type { PairingStatus } from '@coexist/wisp-core/types/NodePairingFlow.types';
import { resolvePairingStatusColor } from '@coexist/wisp-core/styles/NodePairingFlow.styles';
import { useTheme } from '../../providers';
import * as Clipboard from 'expo-clipboard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NodePairingFlowProps extends ViewProps {
  open: boolean;
  onClose: () => void;
  pairingToken?: string;
  remoteAddress?: string;
  onGenerateToken?: () => void;
  onVerifyPairing?: (token: string) => void;
  pairingStatus?: PairingStatus;
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NodePairingFlow = forwardRef<View, NodePairingFlowProps>(
  function NodePairingFlow(
    {
      open, onClose, pairingToken, remoteAddress, onGenerateToken, onVerifyPairing,
      pairingStatus = 'idle', error, style: userStyle, ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [manualToken, setManualToken] = useState('');

    const statusColor = useMemo(
      () => resolvePairingStatusColor(pairingStatus, theme),
      [pairingStatus, theme],
    );

    const handleCopyToken = useCallback(async () => {
      if (pairingToken) try { await Clipboard.setStringAsync(pairingToken); } catch {}
    }, [pairingToken]);

    const handleVerify = useCallback(() => {
      if (manualToken.trim()) onVerifyPairing?.(manualToken.trim());
    }, [manualToken, onVerifyPairing]);

    const statusLabels: Record<string, string> = {
      idle: 'Ready to pair',
      waiting: 'Waiting for connection...',
      connected: 'Connected!',
      failed: 'Pairing failed',
    };

    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <View
          ref={ref}
          style={[{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.background.overlay,
            padding: theme.spacing.lg,
          }, userStyle]}
          {...rest}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.radii.xl,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              padding: theme.spacing.xl,
              gap: theme.spacing.xl,
              width: '100%',
              maxWidth: 440,
              alignItems: 'center',
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>Pair Remote Node</Text>
              <Pressable onPress={onClose}><Text style={{ color: theme.colors.text.muted, fontSize: 20 }}>x</Text></Pressable>
            </View>

            {/* Status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor }} />
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{statusLabels[pairingStatus]}</Text>
            </View>

            {/* QR placeholder */}
            {pairingToken && (
              <View style={{ padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 }}>
                  <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#666', textAlign: 'center' }}>
                    QR: {pairingToken.slice(0, 20)}...
                  </Text>
                </View>
              </View>
            )}

            {/* Token display */}
            {pairingToken && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.sunken, width: '100%' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: theme.colors.text.secondary }}>{pairingToken}</Text>
                <Pressable onPress={handleCopyToken}><Text style={{ color: theme.colors.text.muted, fontSize: 12 }}>Copy</Text></Pressable>
              </View>
            )}

            {/* Remote address */}
            {remoteAddress && (
              <Text style={{ fontSize: 13, color: theme.colors.text.muted }}>
                Remote address: <Text style={{ fontWeight: '600' }}>{remoteAddress}</Text>
              </Text>
            )}

            {/* Generate token */}
            {!pairingToken && onGenerateToken && (
              <Pressable
                onPress={onGenerateToken}
                style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: theme.radii.md, backgroundColor: theme.colors.accent.primary }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Generate Pairing Token</Text>
              </Pressable>
            )}

            {/* Manual input */}
            <View style={{ gap: theme.spacing.md, width: '100%', paddingTop: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Or enter a token manually:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={manualToken}
                  onChangeText={setManualToken}
                  placeholder="Paste pairing token..."
                  placeholderTextColor={theme.colors.text.muted}
                  style={{
                    flex: 1, padding: 10, borderRadius: theme.radii.md, borderWidth: 1,
                    borderColor: theme.colors.border.strong, backgroundColor: theme.colors.background.sunken,
                    color: theme.colors.text.primary, fontSize: 13,
                  }}
                />
                <Pressable
                  onPress={handleVerify}
                  disabled={!manualToken.trim()}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radii.md, backgroundColor: theme.colors.accent.primary, opacity: manualToken.trim() ? 1 : 0.5 }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Verify</Text>
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={{ padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.status.dangerSurface, width: '100%' }}>
                <Text style={{ color: theme.colors.status.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  },
);

NodePairingFlow.displayName = 'NodePairingFlow';
