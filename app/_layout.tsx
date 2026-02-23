import 'react-native-gesture-handler';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useSegments, useRouter, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WispProvider, ToastProvider, useTheme } from '@coexist/wisp-react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UmbraProvider, useUmbra } from '@/contexts/UmbraContext';
import { PluginProvider } from '@/contexts/PluginContext';
import { HelpProvider } from '@/contexts/HelpContext';
import { FontProvider } from '@/contexts/FontContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { SoundProvider } from '@/contexts/SoundContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { HelpPopoverHost } from '@/components/ui/HelpPopoverHost';
import { PinLockScreen } from '@/components/auth/PinLockScreen';
import { LoadingScreen } from '@/components/loading/LoadingScreen';
import type { LoadingStep } from '@/components/loading/LoadingScreen';
import { usePendingInvite } from '@/hooks/usePendingInvite';
import * as Linking from 'expo-linking';

/** Dynamic iOS status bar: light text on dark themes, dark text on light themes. */
function DynamicStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

/** Wrapper that forces UmbraProvider to remount on account switch via React key */
function UmbraProviderWithSwitch({ children }: { children: React.ReactNode }) {
  const { switchGeneration } = useAuth();
  return <UmbraProvider key={switchGeneration}>{children}</UmbraProvider>;
}

function AuthGate() {
  const { isAuthenticated, hasPin, isPinVerified, identity, isHydrated: authHydrated, isSwitching } = useAuth();
  const { isReady, isLoading, initStage } = useUmbra();
  const { preferencesLoaded } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();
  const rootNav = useNavigationContainerRef();
  const [navReady, setNavReady] = useState(false);
  const [loadingDismissed, setLoadingDismissed] = useState(false);
  const pendingInviteHandledRef = useRef(false);
  const { pendingCode, isLoaded: inviteLoaded, consumePendingCode } = usePendingInvite();
  const inAuthGroup = segments[0] === '(auth)';

  // Wait for the navigation tree to be ready before attempting navigation
  useEffect(() => {
    if (rootNav?.isReady()) {
      setNavReady(true);
    }
    const unsub = rootNav?.addListener?.('state', () => {
      if (rootNav.isReady()) setNavReady(true);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [rootNav]);

  useEffect(() => {
    if (!navReady) return;
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, inAuthGroup, navReady]);

  // ── Deep link handler ─────────────────────────────────────────────────
  // Listens for umbra://invite/CODE and https://umbra.chat/invite/CODE
  useEffect(() => {
    if (!navReady) return;

    const handleUrl = (url: string) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed.path?.startsWith('invite/')) {
          const code = parsed.path.replace('invite/', '').replace(/\/$/, '');
          if (code) {
            router.push(`/invite/${code}` as any);
          }
        }
      } catch {
        // Ignore malformed URLs
      }
    };

    // Handle URL that launched the app
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Handle URLs received while app is running
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [navReady, router]);

  // ── Pending invite consumption ────────────────────────────────────────
  // After auth completes + service is ready, check for a pending invite
  // that was stored before the user signed up/in.
  useEffect(() => {
    if (!isAuthenticated || !isReady || !inviteLoaded || !pendingCode || pendingInviteHandledRef.current) return;
    pendingInviteHandledRef.current = true;
    consumePendingCode().then((code) => {
      if (code) {
        router.push(`/invite/${code}` as any);
      }
    });
  }, [isAuthenticated, isReady, inviteLoaded, pendingCode, consumePendingCode, router]);

  // Show PIN lock screen when authenticated + has PIN + not yet verified
  const showPinLock = isAuthenticated && hasPin && !isPinVerified;

  // ── Loading screen steps ──────────────────────────────────────────────
  // Only shown for essential init: core, database, identity, preferences.
  // Relay connection is non-blocking and happens in the background.

  const loadingSteps = useMemo<LoadingStep[]>(() => {
    // Core: WASM + sql.js + database schema
    const coreComplete = isReady;
    const coreStatus: LoadingStep['status'] =
      coreComplete ? 'complete' : isLoading ? 'active' : 'pending';

    // For unauthenticated users, only show core init progress
    if (authHydrated && !isAuthenticated) {
      return [
        { id: 'core', label: 'Initializing core', status: coreStatus },
        { id: 'ready', label: 'Ready', status: coreComplete ? 'complete' : 'pending' },
      ];
    }

    // Database: IndexedDB persistence restore
    const dbStatus: LoadingStep['status'] =
      initStage === 'loading-db' ? 'active' :
      coreComplete ? 'complete' :
      'pending';

    // Identity: Restoring identity from recovery phrase
    const identityStatus: LoadingStep['status'] =
      initStage === 'hydrated' ? 'complete' :
      initStage === 'restoring-identity' ? 'active' :
      initStage === 'loading-data' ? 'complete' :
      initStage === 'hydrating' ? 'active' :
      isReady ? (identity ? 'active' : 'complete') :
      'pending';

    // Preferences: Theme, font, accent color loaded from WASM KV
    const prefsStatus: LoadingStep['status'] =
      preferencesLoaded ? 'complete' :
      (initStage === 'hydrated' || initStage === 'loading-data') ? 'active' :
      'pending';

    const allDone =
      coreStatus === 'complete' &&
      identityStatus === 'complete' &&
      prefsStatus === 'complete';

    return [
      { id: 'core', label: 'Initializing core', status: coreStatus },
      { id: 'db', label: 'Loading database', status: dbStatus },
      { id: 'identity', label: 'Restoring identity', status: identityStatus },
      { id: 'prefs', label: 'Loading preferences', status: prefsStatus },
      { id: 'ready', label: 'Ready', status: allDone ? 'complete' : 'pending' },
    ];
  }, [isReady, isLoading, initStage, identity, preferencesLoaded, authHydrated, isAuthenticated]);

  // ── Loading screen visibility ────────────────────────────────────────
  // Show loading screen on initial mount to prevent flash of auth screen.
  // - Before auth hydration: always show (we don't know auth state yet)
  // - Unauthenticated + core ready: dismiss loading → show auth screen
  // - Authenticated: keep loading until all steps complete
  const allStepsComplete = loadingSteps.every(s => s.status === 'complete');
  const showLoading = !loadingDismissed && (
    !authHydrated ||                              // Auth state not yet known
    (isAuthenticated && !allStepsComplete) ||      // Authenticated, still initializing
    (!isAuthenticated && !isReady)                 // Not authenticated, core not ready yet
  );

  const handleLoadingComplete = useCallback(() => {
    setLoadingDismissed(true);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {showPinLock && <PinLockScreen />}
      {(showLoading || isSwitching) && (
        <LoadingScreen
          steps={isSwitching ? [
            { id: 'switch', label: 'Switching account', status: 'active' as const },
          ] : loadingSteps}
          onComplete={isSwitching ? undefined : handleLoadingComplete}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const initialMode = systemColorScheme === 'dark' ? 'dark' : 'light';

  return (
    <SafeAreaProvider>
      <WispProvider mode={initialMode}>
        <ToastProvider maxToasts={3}>
          <AuthProvider>
            <UmbraProviderWithSwitch>
              <FontProvider>
                <ThemeProvider>
                  <SoundProvider>
                  <MessagingProvider>
                  <PluginProvider>
                    <HelpProvider>
                      <DynamicStatusBar />
                      <AuthGate />
                      <HelpPopoverHost />
                    </HelpProvider>
                  </PluginProvider>
                  </MessagingProvider>
                  </SoundProvider>
                </ThemeProvider>
              </FontProvider>
            </UmbraProviderWithSwitch>
          </AuthProvider>
        </ToastProvider>
      </WispProvider>
    </SafeAreaProvider>
  );
}
