import React, { useState, useCallback } from 'react';
import { View, Pressable, Text as RNText, Image } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Card, Separator, useTheme } from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import { useUsername } from '../../../packages/umbra-service/src/discovery/hooks';
import { PRIMARY_RELAY_URL } from '@/config';
import { CopyIcon, RadioIcon, KeyIcon, QrCodeIcon } from '@/components/ui';
import { QRCardDialog } from '@/components/ui/QRCardDialog';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';

interface ProfileCardProps {
  style?: ViewStyle;
}

/**
 * Compact profile card showing avatar, display name, join date, DID with copy button,
 * and relay connection status.
 */
export function ProfileCard({ style }: ProfileCardProps) {
  const { identity } = useAuth();
  const { theme } = useTheme();
  const tc = theme.colors;
  const [didCopied, setDidCopied] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [qrCardOpen, setQrCardOpen] = useState(false);
  const { relayConnected, connectRelay } = useNetwork();
  const { username } = useUsername(identity?.did ?? null);

  const handleCopyDid = useCallback(() => {
    if (!identity) return;
    try {
      navigator.clipboard.writeText(identity.did);
      setDidCopied(true);
      setTimeout(() => setDidCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [identity]);

  const handleCopyUsername = useCallback(() => {
    if (!username) return;
    try {
      navigator.clipboard.writeText(username);
      setUsernameCopied(true);
      setTimeout(() => setUsernameCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [username]);

  const handleReconnect = useCallback(async () => {
    try {
      await connectRelay(PRIMARY_RELAY_URL);
    } catch (err) {
      console.error('[ProfileCard] Reconnect failed:', err);
    }
  }, [connectRelay]);

  if (!identity) return null;

  const truncatedDid =
    identity.did.length > 40
      ? `${identity.did.slice(0, 20)}...${identity.did.slice(-20)}`
      : identity.did;

  // Convert Unix timestamp (seconds) to milliseconds for Date constructor
  const createdAtMs = identity.createdAt < 1000000000000 ? identity.createdAt * 1000 : identity.createdAt;
  const memberSince = new Date(createdAtMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card variant="outlined" padding="lg" style={{ width: '100%', ...style }}>
      <View style={{ gap: 10 }}>
        {/* Avatar + Name + Join Date row + Relay status top-right */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: tc.accent.primary,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {identity.avatar ? (
              <Image
                source={{ uri: identity.avatar }}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <RNText style={{ fontSize: 17, fontWeight: '700', color: tc.text.inverse }}>
                {identity.displayName.charAt(0).toUpperCase()}
              </RNText>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <RNText style={{ fontSize: 16, fontWeight: '700', color: tc.text.primary }}>
              {identity.displayName}
            </RNText>
            {username && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <RNText style={{ fontSize: 12, color: tc.text.secondary, fontWeight: '500' }}>
                  {username}
                </RNText>
                <Pressable
                  onPress={handleCopyUsername}
                  hitSlop={6}
                  style={{ padding: 2 }}
                >
                  <CopyIcon size={11} color={usernameCopied ? tc.status.success : tc.text.muted} />
                </Pressable>
              </View>
            )}
            <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
              Member since {memberSince}
            </RNText>
          </View>
          {/* Relay status — compact top-right badge */}
          <Pressable
            onPress={!relayConnected ? handleReconnect : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 6,
              backgroundColor: tc.background.sunken,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: relayConnected ? tc.status.success : tc.status.danger,
              }}
            />
            <RNText style={{ fontSize: 11, color: tc.text.secondary, fontWeight: '500' }}>
              {relayConnected ? 'Relay' : 'Offline'}
            </RNText>
            <HelpIndicator
              id="relay-status"
              title="Relay Server"
              priority={20}
              size={13}
            >
              <HelpText>
                The relay server helps deliver messages and friend requests when you can't connect directly peer-to-peer.
              </HelpText>
              <HelpHighlight icon={<RadioIcon size={22} color={tc.accent.primary} />}>
                Friend requests are sent through the relay server. Both you and your friend need to be registered with the relay for requests to be delivered.
              </HelpHighlight>
              <HelpListItem>Green dot means you're connected and can receive requests</HelpListItem>
              <HelpListItem>Red dot means you're disconnected — tap to retry</HelpListItem>
              <HelpListItem>The relay never sees your message content — everything is encrypted end-to-end</HelpListItem>
            </HelpIndicator>
          </Pressable>
        </View>

        {/* DID section — hidden when user has a username (discoverable via search) */}
        {!username && (
          <>
            <Separator spacing="sm" />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <RNText
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: tc.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Decentralized ID
                </RNText>
                <HelpIndicator
                  id="profile-did"
                  title="What is a DID?"
                  priority={10}
                  size={14}
                >
                  <HelpText>
                    Your Decentralized ID (DID) is your unique identity on the network. It's derived from your cryptographic keys and can't be forged.
                  </HelpText>
                  <HelpHighlight icon={<KeyIcon size={22} color={tc.accent.primary} />}>
                    Share your DID with friends so they can send you a connection request. Copy it with the button below.
                  </HelpHighlight>
                  <HelpListItem>Starts with did:key:z6Mk...</HelpListItem>
                  <HelpListItem>Unique to your wallet</HelpListItem>
                  <HelpListItem>Can be shared publicly</HelpListItem>
                </HelpIndicator>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <RNText
                  style={{
                    fontSize: 12,
                    color: tc.text.secondary,
                    fontFamily: 'monospace',
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {truncatedDid}
                </RNText>
                <Pressable
                  onPress={handleCopyDid}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: didCopied ? tc.status.successSurface : tc.background.sunken,
                  }}
                >
                  <CopyIcon size={14} color={didCopied ? tc.status.success : tc.text.secondary} />
                  <RNText
                    style={{
                      fontSize: 11,
                      color: didCopied ? tc.status.success : tc.text.secondary,
                      fontWeight: '500',
                    }}
                  >
                    {didCopied ? 'Copied' : 'Copy'}
                  </RNText>
                </Pressable>
                <Pressable
                  onPress={() => setQrCardOpen(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: tc.background.sunken,
                  }}
                >
                  <QrCodeIcon size={14} color={tc.text.secondary} />
                  <RNText
                    style={{
                      fontSize: 11,
                      color: tc.text.secondary,
                      fontWeight: '500',
                    }}
                  >
                    QR
                  </RNText>
                </Pressable>
              </View>
            </View>
          </>
        )}

      </View>

      <QRCardDialog
        open={qrCardOpen}
        onClose={() => setQrCardOpen(false)}
        mode="profile"
        value={identity.did}
        label={identity.displayName}
        title="My QR Code"
      />
    </Card>
  );
}
