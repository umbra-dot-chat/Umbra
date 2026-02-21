/**
 * @module QRCodeScanner
 * @description Camera-based QR code scanner for invite links.
 *
 * Uses expo-camera's barcode scanning to detect QR codes containing
 * invite URLs (https://umbra.chat/invite/CODE) or bare codes.
 *
 * Usage:
 * ```tsx
 * <QRCodeScanner
 *   onScanned={(code) => console.log('Invite code:', code)}
 *   onClose={() => setShowScanner(false)}
 * />
 * ```
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QRCodeScannerProps {
  /** Called when a valid invite code is scanned. */
  onScanned: (code: string) => void;
  /** Called when the scanner should close. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract an invite code from a scanned QR code value.
 * Handles full URLs, deep links, and bare codes.
 */
function extractInviteCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Match URL patterns: https://umbra.chat/invite/CODE or umbra://invite/CODE
  const urlMatch = trimmed.match(
    /(?:https?:\/\/[^/]+|umbra:)\/?\/?\/?invite\/([a-zA-Z0-9]+)/,
  );
  if (urlMatch) return urlMatch[1];

  // If it looks like a bare alphanumeric code (8+ chars), accept it
  const bare = trimmed.replace(/[^a-zA-Z0-9]/g, '');
  if (bare.length >= 6) return bare;

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QRCodeScanner({ onScanned, onClose }: QRCodeScannerProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (scanned) return;

      const code = extractInviteCode(data);
      if (!code) return;

      // Prevent duplicate scans of the same code
      if (lastScannedRef.current === code) return;
      lastScannedRef.current = code;

      setScanned(true);
      onScanned(code);
    },
    [scanned, onScanned],
  );

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background.canvas }]}>
        <Text style={{ color: tc.text.muted }}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background.canvas }]}>
        <View style={styles.permissionBox}>
          <Text size="lg" weight="bold" style={{ color: tc.text.primary, textAlign: 'center' }}>
            Camera Access Required
          </Text>
          <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
            To scan invite QR codes, Umbra needs access to your camera.
          </Text>
          <View style={{ gap: defaultSpacing.sm }}>
            <Button variant="primary" onPress={requestPermission}>
              Grant Camera Access
            </Button>
            <Button variant="tertiary" onPress={onClose}>
              Cancel
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // Camera not available on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: tc.background.canvas }]}>
        <View style={styles.permissionBox}>
          <Text size="lg" weight="bold" style={{ color: tc.text.primary, textAlign: 'center' }}>
            QR Scanning
          </Text>
          <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
            QR code scanning is only available on mobile. On desktop, paste the
            invite link or code directly.
          </Text>
          <Button variant="tertiary" onPress={onClose}>
            Close
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay with viewfinder */}
      <View style={styles.overlay}>
        {/* Top area */}
        <View style={styles.overlayTop}>
          <Text size="lg" weight="bold" style={{ color: '#fff', textAlign: 'center' }}>
            Scan Invite QR Code
          </Text>
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
            Point your camera at a community invite QR code
          </Text>
        </View>

        {/* Viewfinder frame */}
        <View style={styles.viewfinderRow}>
          <View style={styles.overlayFill} />
          <View style={styles.viewfinder}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlayFill} />
        </View>

        {/* Bottom area */}
        <View style={styles.overlayBottom}>
          {scanned ? (
            <View style={{ gap: defaultSpacing.sm, alignItems: 'center' }}>
              <Text size="sm" style={{ color: '#fff' }}>
                QR code detected! Joining...
              </Text>
              <Button
                variant="tertiary"
                onPress={() => {
                  setScanned(false);
                  lastScannedRef.current = null;
                }}
              >
                Scan Again
              </Button>
            </View>
          ) : (
            <Button variant="tertiary" onPress={onClose}>
              Cancel
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const VIEWFINDER_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    padding: defaultSpacing.xl,
    gap: defaultSpacing.md,
    maxWidth: 320,
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: defaultSpacing.lg,
    gap: defaultSpacing.xs,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: defaultSpacing.xl,
  },
  viewfinderRow: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlayFill: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
});
