/**
 * Community Invite Handler Route
 *
 * Handles URLs:
 * - Deep link: umbra://invite/CODE
 * - Web URL:   https://umbra.chat/invite/CODE
 * - In-app:    /invite/CODE
 *
 * Flow:
 * 1. Parse invite code from URL params
 * 2. If authenticated: show JoinCommunityModal with code pre-filled
 * 3. If not authenticated: store pending invite, redirect to auth
 *    (handled by AuthGate in _layout.tsx via usePendingInvite)
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { JoinCommunityModal } from '@/components/community/invite/JoinCommunityModal';
import { usePendingInvite } from '@/hooks/usePendingInvite';

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isAuthenticated } = useAuth();
  const { setPendingCode } = usePendingInvite();
  const router = useRouter();
  const { theme } = useTheme();

  // If not authenticated, store the invite code and redirect to auth
  useEffect(() => {
    if (!isAuthenticated && code) {
      setPendingCode(code);
      router.replace('/(auth)');
    }
  }, [isAuthenticated, code]);

  // Don't render anything while redirecting to auth
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <JoinCommunityModal
        open
        initialCode={code}
        onClose={() => router.replace('/(main)')}
      />
    </View>
  );
}
