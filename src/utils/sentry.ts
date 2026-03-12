/**
 * Sentry crash reporting setup.
 *
 * Captures errors, breadcrumbs, and session replay data.
 * Currently configured for local-only capture (no DSN by default).
 * Set EXPO_PUBLIC_SENTRY_DSN env var to enable cloud reporting.
 *
 * Import in app/_layout.tsx after the crash guard init.
 */

import * as Sentry from '@sentry/react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Only initialize on web (Sentry React is browser-only)
let _initialized = false;

export function initSentry() {
  if (!isWeb || _initialized) return;

  // DSN from env — if empty, Sentry runs in "noop" mode (captures locally only)
  const dsn = typeof process !== 'undefined'
    ? (process.env as any).EXPO_PUBLIC_SENTRY_DSN
    : undefined;

  Sentry.init({
    dsn: dsn || undefined,
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
    // Capture 100% of errors in dev, 10% in prod
    sampleRate: __DEV__ ? 1.0 : 0.1,
    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.05,
    // Attach breadcrumbs for console logs, DOM clicks, XHR
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        xhr: true,
      }),
    ],
    // Custom before-send: enrich with CrashVitals
    beforeSend(event) {
      try {
        const vitalsRaw = localStorage.getItem('__umbra_vitals__');
        if (vitalsRaw) {
          const vitals = JSON.parse(vitalsRaw);
          event.contexts = {
            ...event.contexts,
            crashVitals: {
              heap: `${(vitals.heap / 1024 / 1024).toFixed(0)}MB`,
              heapPct: vitals.heapLimit > 0
                ? `${((vitals.heap / vitals.heapLimit) * 100).toFixed(0)}%`
                : '?',
              domNodes: vitals.domNodes,
              renderRate: `${vitals.renderRate}/s`,
              msgRate: `${vitals.messageEventRate}/2s`,
              nonFriendFails: vitals.nonFriendFailures,
              globalListeners: vitals.globalListenerBalance,
            },
          };
        }
      } catch { /* ignore */ }
      return event;
    },
  });

  _initialized = true;
}

/** Wrap a component tree with Sentry error boundary */
export const SentryErrorBoundary = isWeb
  ? Sentry.ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => children;

/** Add a breadcrumb manually */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (!isWeb) return;
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

/** Capture an exception manually */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!isWeb) return;
  Sentry.captureException(error, { extra: context });
}
