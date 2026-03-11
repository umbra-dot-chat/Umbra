/**
 * @module components/node-registration-wizard
 * @description React Native NodeRegistrationWizard component for the Wisp design system.
 *
 * Reuses type definitions from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` + `<Pressable>` + `<Modal>`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { NodeRegistrationData } from '@coexist/wisp-core/types/NodeRegistrationWizard.types';
import type { BoostNodeType } from '@coexist/wisp-core/types/BoostNodeDashboard.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NodeRegistrationWizardProps extends ViewProps {
  open: boolean;
  onClose: () => void;
  onComplete?: (data: NodeRegistrationData) => void;
  submitting?: boolean;
  error?: string;
  generatedPublicKey?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NodeRegistrationWizard = forwardRef<View, NodeRegistrationWizardProps>(
  function NodeRegistrationWizard(
    {
      open,
      onClose,
      onComplete,
      submitting = false,
      error,
      generatedPublicKey,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [nodeType, setNodeType] = useState<BoostNodeType>('local');
    const [name, setName] = useState('');
    const [maxStorageGB, setMaxStorageGB] = useState('10');
    const [maxBandwidthMbps, setMaxBandwidthMbps] = useState('100');

    const handleComplete = useCallback(() => {
      onComplete?.({
        name,
        nodeType,
        maxStorageBytes: Number(maxStorageGB) * 1024 * 1024 * 1024,
        maxBandwidthMbps: Number(maxBandwidthMbps),
      });
    }, [name, nodeType, maxStorageGB, maxBandwidthMbps, onComplete]);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    }), [theme]);

    const stepLabels = ['Choose Type', 'Configure', 'Review'];

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
              maxWidth: 500,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={titleStyle}>Register Boost Node</Text>
              <Pressable onPress={onClose}>
                <Text style={{ color: theme.colors.text.muted, fontSize: 20 }}>x</Text>
              </Pressable>
            </View>

            {/* Progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {stepLabels.map((label, i) => (
                <React.Fragment key={label}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: i <= step ? theme.colors.accent.primary : theme.colors.border.subtle,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: i <= step ? '#fff' : theme.colors.text.muted, fontSize: 12, fontWeight: '600' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: i <= step ? theme.colors.text.primary : theme.colors.text.muted }}>
                      {label}
                    </Text>
                  </View>
                  {i < stepLabels.length - 1 && <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border.subtle }} />}
                </React.Fragment>
              ))}
            </View>

            {/* Step 0: Type */}
            {step === 0 && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>Choose how your node will connect:</Text>
                {(['local', 'remote'] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setNodeType(type)}
                    style={{
                      gap: theme.spacing.sm,
                      padding: theme.spacing.lg,
                      borderRadius: theme.radii.lg,
                      backgroundColor: nodeType === type ? theme.colors.accent.highlight : theme.colors.background.surface,
                      borderWidth: 2,
                      borderColor: nodeType === type ? theme.colors.accent.primary : theme.colors.border.subtle,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, textTransform: 'capitalize' }}>
                      {type}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.colors.text.muted }}>
                      {type === 'local'
                        ? 'Runs on this machine. Data stays on your local network.'
                        : 'Runs on a remote server. Connects over the internet.'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Step 1: Configure */}
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Node Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="My Boost Node"
                    placeholderTextColor={theme.colors.text.muted}
                    style={{
                      padding: 10,
                      borderRadius: theme.radii.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border.strong,
                      backgroundColor: theme.colors.background.sunken,
                      color: theme.colors.text.primary,
                      fontSize: 14,
                    }}
                  />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Max Storage (GB)</Text>
                  <TextInput
                    value={maxStorageGB}
                    onChangeText={setMaxStorageGB}
                    keyboardType="numeric"
                    style={{
                      padding: 10,
                      borderRadius: theme.radii.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border.strong,
                      backgroundColor: theme.colors.background.sunken,
                      color: theme.colors.text.primary,
                      fontSize: 14,
                    }}
                  />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Max Bandwidth (Mbps)</Text>
                  <TextInput
                    value={maxBandwidthMbps}
                    onChangeText={setMaxBandwidthMbps}
                    keyboardType="numeric"
                    style={{
                      padding: 10,
                      borderRadius: theme.radii.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border.strong,
                      backgroundColor: theme.colors.background.sunken,
                      color: theme.colors.text.primary,
                      fontSize: 14,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary }}>Confirm your node settings:</Text>
                {[
                  ['Name', name],
                  ['Type', nodeType],
                  ['Max Storage', formatBytes(Number(maxStorageGB) * 1024 * 1024 * 1024)],
                  ['Max Bandwidth', `${maxBandwidthMbps} Mbps`],
                ].map(([label, value]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: theme.spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border.subtle,
                    }}
                  >
                    <Text style={{ color: theme.colors.text.muted, fontSize: 13 }}>{label}</Text>
                    <Text style={{ color: theme.colors.text.primary, fontSize: 14, fontWeight: '500' }}>{value}</Text>
                  </View>
                ))}
                {generatedPublicKey && (
                  <View style={{ gap: 6, marginTop: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Generated Public Key</Text>
                    <View style={{ padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.sunken }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 12, color: theme.colors.text.secondary }}>{generatedPublicKey}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={{ padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.status.dangerSurface }}>
                <Text style={{ color: theme.colors.status.danger, fontSize: 14 }}>{error}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle }}>
              <Pressable
                onPress={step === 0 ? onClose : () => setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: theme.radii.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border.strong,
                }}
              >
                <Text style={{ color: theme.colors.text.secondary, fontSize: 14 }}>{step === 0 ? 'Cancel' : 'Back'}</Text>
              </Pressable>
              <Pressable
                disabled={submitting || (step === 1 && !name.trim())}
                onPress={step < 2 ? () => setStep((s) => Math.min(2, s + 1) as 0 | 1 | 2) : handleComplete}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.accent.primary,
                  opacity: (submitting || (step === 1 && !name.trim())) ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
                  {submitting ? 'Submitting...' : step < 2 ? 'Next' : 'Register'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

NodeRegistrationWizard.displayName = 'NodeRegistrationWizard';
