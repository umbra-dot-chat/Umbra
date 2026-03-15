import '@/utils/wdyr'; // Must be before React — patches React for render profiling
import 'react-native-gesture-handler';
import React, { Profiler, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import '@/i18n/config'; // Initialize i18next after React is loaded
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useSegments, useRouter, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WispProvider, ToastProvider, useTheme, Box } from '@coexist/wisp-react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UmbraProvider, useUmbra } from '@/contexts/UmbraContext';
import { PluginProvider } from '@/contexts/PluginContext';
import { HelpProvider } from '@/contexts/HelpContext';
import { FontProvider } from '@/contexts/FontContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { SoundProvider } from '@/contexts/SoundContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { HelpPopoverHost } from '@/components/ui/HelpPopoverHost';
import { PinLockScreen } from '@/components/auth/PinLockScreen';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { LoadingStep } from '@/components/ui/LoadingScreen';
import { usePendingInvite } from '@/hooks/usePendingInvite';
import * as Linking from 'expo-linking';
import { dbg, initCrashGuard, markBootSuccess } from '@/utils/debug';
import { initSentry, SentryErrorBoundary } from '@/utils/sentry';
import { DebugVitalsOverlay } from '@/components/debug/DebugVitalsOverlay';

// ── Debug infrastructure init ──────────────────────────────────────────────
const { isSafeMode: __safeMode, crashCount: __crashCount } = initCrashGuard();
if (__crashCount > 1) {
  dbg.warn('lifecycle', `CrashGuard: crash count ${__crashCount}/3`, { crashCount: __crashCount }, 'RootLayout');
}
dbg.startLongTaskDetection();
initSentry();

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

const AUTH_GATE_SRC = 'AuthGate';

function AuthGate() {
  if (__DEV__) dbg.trackRender(AUTH_GATE_SRC);
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
      if (__DEV__) dbg.info('lifecycle', 'navigate → /(auth)', undefined, AUTH_GATE_SRC);
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      if (__DEV__) dbg.info('lifecycle', 'navigate → /(main)', undefined, AUTH_GATE_SRC);
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
    if (__DEV__) dbg.info('lifecycle', 'Loading screen dismissed — app ready', { initStage }, AUTH_GATE_SRC);
    markBootSuccess();
  }, [initStage]);

  return (
    <Box style={{ flex: 1 }}>
      <Slot />
      {showPinLock && <PinLockScreen accountName={identity?.displayName} />}
      {(showLoading || isSwitching) && (
        <LoadingScreen
          steps={isSwitching ? [
            { id: 'switch', label: 'Switching account', status: 'active' as const },
          ] : loadingSteps}
          onComplete={isSwitching ? undefined : handleLoadingComplete}
        />
      )}
    </Box>
  );
}

/** Sentry crash fallback — shown when the React tree throws an uncaught error */
function SentryCrashFallback() {
  // Using a plain div for the fallback since the component tree (including Wisp) is dead
  if (typeof document !== 'undefined') {
    return React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'monospace', background: '#111', color: '#e0e0e0' },
    },
      React.createElement('div', { style: { fontSize: 24, fontWeight: 'bold', color: '#f44336', marginBottom: 12 } }, 'Umbra crashed'),
      React.createElement('div', { style: { fontSize: 14, color: '#999' } }, 'Check console for CRASH REPORT. Refresh to restart.'),
    );
  }
  return null;
}

export default function RootLayout() {
  return (
    <SentryErrorBoundary fallback={<SentryCrashFallback />}>
    <SafeAreaProvider>
      <WispProvider mode="light">
        <ToastProvider maxToasts={3}>
          <AuthProvider>
            <UmbraProviderWithSwitch>
              <FontProvider>
                <ThemeProvider>
                  <SoundProvider>
                  <MessagingProvider>
                  <SyncProvider>
                  <PluginProvider>
                  <ConversationsProvider>
                  <FriendsProvider>
                  <GroupsProvider>
                    <HelpProvider>
                      <DynamicStatusBar />
                      {__DEV__ ? (
                        <Profiler id="App" onRender={dbg.onProfilerRender}>
                          <AuthGate />
                        </Profiler>
                      ) : (
                        <AuthGate />
                      )}
                      <HelpPopoverHost />
                      <DebugVitalsOverlay />
                    </HelpProvider>
                  </GroupsProvider>
                  </FriendsProvider>
                  </ConversationsProvider>
                  </PluginProvider>
                  </SyncProvider>
                  </MessagingProvider>
                  </SoundProvider>
                </ThemeProvider>
              </FontProvider>
            </UmbraProviderWithSwitch>
          </AuthProvider>
        </ToastProvider>
      </WispProvider>
    </SafeAreaProvider>
    </SentryErrorBoundary>
  );
}
