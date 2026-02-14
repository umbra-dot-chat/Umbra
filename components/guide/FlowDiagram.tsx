/**
 * FlowDiagram — Visual flow diagrams for architecture.
 *
 * Uses simple block-and-arrow layout to illustrate:
 * - Message encryption flow
 * - Friend request flow
 * - Group creation flow
 * - P2P vs relay delivery
 */

import React from 'react';
import { View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

export interface FlowStep {
  /** Label for this step */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Color accent for this step */
  color?: string;
}

export interface FlowDiagramProps {
  /** Title of the diagram */
  title: string;
  /** Steps in the flow */
  steps: FlowStep[];
  /** Direction of flow */
  direction?: 'horizontal' | 'vertical';
}

function FlowBlock({ label, icon, color = '#3B82F6' }: FlowStep) {
  return (
    <View
      style={{
        backgroundColor: color + '20',
        borderWidth: 1,
        borderColor: color + '40',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minWidth: 80,
      }}
    >
      {icon && (
        <Text style={{ fontSize: 16, marginBottom: 2 }}>{icon}</Text>
      )}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600' as const,
          color: color,
          textAlign: 'center' as const,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Arrow({ direction }: { direction: 'horizontal' | 'vertical' }) {
  const { theme } = useTheme();
  const arrowColor = theme.colors.text.muted;

  if (direction === 'horizontal') {
    return (
      <Text style={{ color: arrowColor, fontSize: 16, marginHorizontal: 4 }}>
        {'\u2192'}
      </Text>
    );
  }
  return (
    <Text style={{ color: arrowColor, fontSize: 16, marginVertical: 2, textAlign: 'center' as const }}>
      {'\u2193'}
    </Text>
  );
}

export function FlowDiagram({
  title,
  steps,
  direction = 'horizontal',
}: FlowDiagramProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isHorizontal = direction === 'horizontal';

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: tc.background.sunken,
        padding: 14,
        gap: 10,
      } as ViewStyle,
      title: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: tc.text.secondary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      } as TextStyle,
      flow: {
        flexDirection: isHorizontal ? ('row' as const) : ('column' as const),
        alignItems: 'center' as const,
        flexWrap: isHorizontal ? ('wrap' as const) : ('nowrap' as const),
        gap: 4,
        justifyContent: 'center' as const,
      } as ViewStyle,
    }),
    [isHorizontal, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.flow}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <FlowBlock {...step} />
            {i < steps.length - 1 && <Arrow direction={direction} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Pre-built diagrams ────────────────────────────────────────────────────

export function MessageEncryptionFlow() {
  return (
    <FlowDiagram
      title="Message Encryption Flow"
      steps={[
        { label: 'Plaintext', icon: '\uD83D\uDCDD', color: '#22C55E' },
        { label: 'AES-256-GCM\nEncrypt', icon: '\uD83D\uDD12', color: '#3B82F6' },
        { label: 'Relay\nServer', icon: '\uD83C\uDF10', color: '#EAB308' },
        { label: 'AES-256-GCM\nDecrypt', icon: '\uD83D\uDD13', color: '#3B82F6' },
        { label: 'Plaintext', icon: '\uD83D\uDCDD', color: '#22C55E' },
      ]}
    />
  );
}

export function FriendRequestFlow() {
  return (
    <FlowDiagram
      title="Friend Request Flow"
      direction="vertical"
      steps={[
        { label: 'Send Request\n(with public key)', icon: '\uD83D\uDC64', color: '#8B5CF6' },
        { label: 'Relay delivers\nto recipient DID', icon: '\uD83C\uDF10', color: '#EAB308' },
        { label: 'Recipient accepts\n(ECDH key exchange)', icon: '\u2705', color: '#22C55E' },
        { label: 'Shared secret\nestablished', icon: '\uD83D\uDD11', color: '#3B82F6' },
        { label: 'Encrypted messaging\nbegins', icon: '\uD83D\uDCAC', color: '#EC4899' },
      ]}
    />
  );
}

export function NetworkArchitectureFlow() {
  return (
    <FlowDiagram
      title="Network Architecture"
      steps={[
        { label: 'Your\nDevice', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E' },
        { label: 'Relay\nServer', icon: '\uD83C\uDF10', color: '#EAB308' },
        { label: "Friend's\nDevice", icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E' },
      ]}
    />
  );
}

export function RelayFederationFlow() {
  return (
    <FlowDiagram
      title="Relay Federation Mesh"
      steps={[
        { label: 'You\n(US Relay)', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E' },
        { label: 'US East\nRelay', icon: '\uD83C\uDDFA\uD83C\uDDF8', color: '#3B82F6' },
        { label: 'Seoul\nRelay', icon: '\uD83C\uDDF0\uD83C\uDDF7', color: '#8B5CF6' },
        { label: 'Friend\n(Seoul Relay)', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E' },
      ]}
    />
  );
}

export function KeyDerivationFlow() {
  return (
    <FlowDiagram
      title="Key Derivation Chain"
      direction="vertical"
      steps={[
        { label: '24-word\nRecovery Phrase', icon: '\uD83D\uDCDD', color: '#8B5CF6' },
        { label: 'BIP39\nSeed Bytes', icon: '\uD83C\uDF31', color: '#06B6D4' },
        { label: 'HKDF-SHA256\nKey Derivation', icon: '\u2699\uFE0F', color: '#EAB308' },
        { label: 'Ed25519 Signing\n+ X25519 Encryption', icon: '\uD83D\uDD11', color: '#3B82F6' },
        { label: 'did:key\nIdentifier', icon: '\uD83C\uDD94', color: '#22C55E' },
      ]}
    />
  );
}

export function OfflineDeliveryFlow() {
  return (
    <FlowDiagram
      title="Offline Message Delivery"
      direction="vertical"
      steps={[
        { label: 'You send message\n(friend offline)', icon: '\u2709\uFE0F', color: '#3B82F6' },
        { label: 'Relay queues\nencrypted payload', icon: '\uD83D\uDCE5', color: '#EAB308' },
        { label: 'Friend comes\nonline', icon: '\uD83D\uDFE2', color: '#22C55E' },
        { label: 'Relay delivers\nqueued messages', icon: '\uD83D\uDCE8', color: '#06B6D4' },
        { label: 'Friend decrypts\nand reads', icon: '\uD83D\uDD13', color: '#8B5CF6' },
      ]}
    />
  );
}

export function ZeroKnowledgeFlow() {
  return (
    <FlowDiagram
      title="What the Relay Sees"
      steps={[
        { label: 'Sender\nDID', icon: '\uD83D\uDC64', color: '#3B82F6' },
        { label: 'Encrypted\nBlob', icon: '\uD83D\uDD12', color: '#EF4444' },
        { label: 'Recipient\nDID', icon: '\uD83D\uDC64', color: '#3B82F6' },
        { label: 'Timestamp', icon: '\uD83D\uDD51', color: '#71717A' },
      ]}
    />
  );
}

export function GroupKeyDistributionFlow() {
  return (
    <FlowDiagram
      title="Group Key Distribution"
      direction="vertical"
      steps={[
        { label: 'Admin creates group\n+ AES-256-GCM key', icon: '\uD83D\uDD11', color: '#8B5CF6' },
        { label: 'Key encrypted per member\nvia ECDH (X25519)', icon: '\uD83D\uDD12', color: '#3B82F6' },
        { label: 'Encrypted keys sent\nvia relay invites', icon: '\uD83C\uDF10', color: '#EAB308' },
        { label: 'Each member decrypts\ntheir copy of the key', icon: '\uD83D\uDD13', color: '#22C55E' },
        { label: 'All members can\nencrypt/decrypt group messages', icon: '\uD83D\uDCAC', color: '#EC4899' },
      ]}
    />
  );
}

export function GroupKeyRotationFlow() {
  return (
    <FlowDiagram
      title="Key Rotation (on member removal)"
      direction="vertical"
      steps={[
        { label: 'Admin removes\na member', icon: '\u274C', color: '#EF4444' },
        { label: 'New AES-256-GCM\nkey generated', icon: '\uD83D\uDD11', color: '#8B5CF6' },
        { label: 'New key encrypted\nfor remaining members', icon: '\uD83D\uDD12', color: '#3B82F6' },
        { label: 'Distributed via\ngroup_key_rotation', icon: '\uD83C\uDF10', color: '#EAB308' },
        { label: 'Removed member\ncannot decrypt new messages', icon: '\uD83D\uDEAB', color: '#EF4444' },
      ]}
    />
  );
}
