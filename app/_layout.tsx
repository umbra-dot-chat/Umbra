import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Slot, useSegments, useRouter, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WispProvider, ToastProvider } from '@coexist/wisp-react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UmbraProvider, useUmbra } from '@/contexts/UmbraContext';
import { HelpProvider } from '@/contexts/HelpContext';
import { HelpPopoverHost } from '@/components/ui/HelpPopoverHost';
import { PinLockScreen } from '@/components/auth/PinLockScreen';
import { LoadingScreen } from '@/components/loading/LoadingScreen';
import type { LoadingStep } from '@/components/loading/LoadingScreen';
import { useNetwork } from '@/hooks/useNetwork';
import { PRIMARY_RELAY_URL } from '@/config';

/** Max time (ms) to wait for the relay before dismissing loading screen */
const RELAY_TIMEOUT_MS = 5000;

function AuthGate() {
  const { isAuthenticated, hasPin, isPinVerified, identity } = useAuth();
  const { isReady, isLoading, initStage } = useUmbra();
  const { relayConnected, connectRelay } = useNetwork();
  const segments = useSegments();
  const router = useRouter();
  const rootNav = useNavigationContainerRef();
  const [navReady, setNavReady] = useState(false);
  const [loadingDismissed, setLoadingDismissed] = useState(false);
  const [relayTimedOut, setRelayTimedOut] = useState(false);
  const retryCountRef = useRef(0);
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

  // Show PIN lock screen when authenticated + has PIN + not yet verified
  const showPinLock = isAuthenticated && hasPin && !isPinVerified;

  // Retry relay connection if not connected after hydration.
  // The auto-start in useNetwork fires once, but if it fails or the WebSocket
  // doesn't open in time, we retry here.
  useEffect(() => {
    if (relayConnected || relayTimedOut) return;
    if (initStage !== 'hydrated') return;

    const retryInterval = setInterval(() => {
      if (relayConnected || retryCountRef.current >= 3) {
        clearInterval(retryInterval);
        return;
      }
      retryCountRef.current += 1;
      console.log(`[AuthGate] Relay retry attempt ${retryCountRef.current}...`);
      connectRelay(PRIMARY_RELAY_URL).catch(() => {});
    }, 1500);

    // Overall timeout — dismiss loading screen even if relay never connects
    const timeout = setTimeout(() => {
      if (!relayConnected) {
        console.warn('[AuthGate] Relay timed out after', RELAY_TIMEOUT_MS, 'ms');
        setRelayTimedOut(true);
      }
    }, RELAY_TIMEOUT_MS);

    return () => {
      clearInterval(retryInterval);
      clearTimeout(timeout);
    };
  }, [initStage, relayConnected, relayTimedOut, connectRelay]);

  // Clear timeout flag if relay connects later
  useEffect(() => {
    if (relayConnected && relayTimedOut) {
      setRelayTimedOut(false);
    }
  }, [relayConnected, relayTimedOut]);

  // Build loading steps based on initialization state.
  // Uses granular initStage from UmbraContext to show detailed progress,
  // including IndexedDB database restoration when a persisted identity exists.
  const loadingSteps = useMemo<LoadingStep[]>(() => {
    // Core: WASM + sql.js + database schema
    const coreComplete = isReady;
    const coreStatus: LoadingStep['status'] =
      coreComplete ? 'complete' : isLoading ? 'active' : 'pending';

    // Database: IndexedDB persistence restore (only shown when a DID was available at init)
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

    // Relay: Connecting to relay server
    const relayDone = relayConnected || relayTimedOut;
    const relayStatus: LoadingStep['status'] =
      relayDone ? 'complete' :
      (initStage === 'hydrated' || (isReady && !identity)) ? 'active' :
      'pending';

    const allDone =
      coreStatus === 'complete' &&
      identityStatus === 'complete' &&
      relayStatus === 'complete';

    return [
      { id: 'core', label: 'Initializing core', status: coreStatus },
      { id: 'db', label: 'Loading database', status: dbStatus },
      { id: 'identity', label: 'Restoring identity', status: identityStatus },
      { id: 'relay', label: 'Connecting to relay', status: relayStatus },
      { id: 'ready', label: 'Ready', status: allDone ? 'complete' : 'pending' },
    ];
  }, [isReady, isLoading, initStage, identity, relayConnected, relayTimedOut]);

  // Show loading screen while authenticated and steps are not all complete
  const showLoading = isAuthenticated && !loadingDismissed && !loadingSteps.every(s => s.status === 'complete');

  const handleLoadingComplete = useCallback(() => {
    setLoadingDismissed(true);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {showPinLock && <PinLockScreen />}
      {showLoading && (
        <LoadingScreen
          steps={loadingSteps}
          onComplete={handleLoadingComplete}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <WispProvider mode="light">
      <ToastProvider maxToasts={3}>
        <AuthProvider>
          <UmbraProvider>
            <HelpProvider>
              <StatusBar style="dark" />
              <AuthGate />
              <HelpPopoverHost />
            </HelpProvider>
          </UmbraProvider>
        </AuthProvider>
      </ToastProvider>
    </WispProvider>
  );
}
