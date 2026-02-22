/**
 * @module QRCardDialog
 * @description Reusable QR code dialog with Share/Scan toggle.
 *
 * Share tab displays a QR code encoding a DID or invite URL.
 * Scan tab uses the device camera (mobile) or a paste input (web)
 * to read QR codes containing DIDs or invite URLs.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Dialog,
  QRCode,
  SegmentedControl,
  Button,
  Text,
  Input,
  useTheme,
} from '@coexist/wisp-react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ---------------------------------------------------------------------------
// QR parsing helper
// ---------------------------------------------------------------------------

/**
 * Parse scanned QR data into a typed result.
 * Recognizes DID strings (`did:key:...`) and invite URLs.
 */
export function parseScannedQR(
  data: string,
): { type: 'did'; value: string } | { type: 'invite'; code: string } | null {
  const trimmed = data.trim();
  if (!trimmed) return null;

  // DID pattern
  if (trimmed.startsWith('did:key:')) {
    return { type: 'did', value: trimmed };
  }

  // Invite URL pattern
  const urlMatch = trimmed.match(
    /(?:https?:\/\/[^/]+|umbra:)\/?\/?\/?invite\/([a-zA-Z0-9]+)/,
  );
  if (urlMatch) {
    return { type: 'invite', code: urlMatch[1] };
  }

  // Bare code fallback (6+ alphanumeric chars)
  const bare = trimmed.replace(/[^a-zA-Z0-9]/g, '');
  if (bare.length >= 6) {
    return { type: 'invite', code: bare };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QRCardMode = 'profile' | 'community-invite';

export interface QRCardDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** What kind of data the QR encodes / the scanner expects. */
  mode: QRCardMode;
  /** The value to encode as a QR code (DID string or invite URL). */
  value: string;
  /** Optional label shown below the QR code (e.g., display name). */
  label?: string;
  /** Called when a QR code is successfully scanned. Receives the raw scanned data. */
  onScanned?: (data: string) => void;
  /** Dialog title override. */
  title?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_OPTIONS = [
  { value: 'share', label: 'Share' },
  { value: 'scan', label: 'Scan' },
];

const VIEWFINDER_SIZE = 220;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QRCardDialog({
  open,
  onClose,
  mode,
  value,
  label,
  onScanned,
  title,
}: QRCardDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const [tab, setTab] = useState<'share' | 'scan'>('share');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const [pasteValue, setPasteValue] = useState('');

  // Reset state when dialog opens/closes
  const handleClose = useCallback(() => {
    setTab('share');
    setScanned(false);
    lastScannedRef.current = null;
    setPasteValue('');
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback((val: string) => {
    setTab(val as 'share' | 'scan');
    setScanned(false);
    lastScannedRef.current = null;
  }, []);

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (scanned) return;
      const parsed = parseScannedQR(data);
      if (!parsed) return;
      if (lastScannedRef.current === data) return;
      lastScannedRef.current = data;
      setScanned(true);
      onScanned?.(data);
    },
    [scanned, onScanned],
  );

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteValue.trim();
    if (!trimmed) return;
    const parsed = parseScannedQR(trimmed);
    if (!parsed) return;
    onScanned?.(trimmed);
    setPasteValue('');
  }, [pasteValue, onScanned]);

  const defaultTitle =
    mode === 'profile' ? 'My QR Code' : 'Community Invite';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title ?? defaultTitle}
      size="sm"
    >
      <View style={{ gap: defaultSpacing.md, alignItems: 'center', minHeight: 320 }}>
        {/* ── Share Tab ── */}
        {tab === 'share' && (
          <View style={{ alignItems: 'center', gap: defaultSpacing.sm, paddingVertical: defaultSpacing.md }}>
            {value ? (
              <>
                <QRCode
                  value={value}
                  size="lg"
                  dotStyle="rounded"
                  eyeFrameStyle="rounded"
                  eyePupilStyle="rounded"
                />
                {label && (
                  <Text size="sm" weight="medium" style={{ color: tc.text.primary, textAlign: 'center' }}>
                    {label}
                  </Text>
                )}
                <Text
                  size="xs"
                  style={{ color: tc.text.muted, textAlign: 'center', maxWidth: 260 }}
                  numberOfLines={2}
                >
                  {mode === 'profile'
                    ? 'Scan this code to add me as a friend'
                    : 'Scan this code to join the community'}
                </Text>
              </>
            ) : (
              <View style={{ paddingVertical: defaultSpacing.xl, alignItems: 'center' }}>
                <Text size="sm" style={{ color: tc.text.muted }}>
                  {mode === 'profile' ? 'Identity not available' : 'No invite link available'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Scan Tab ── */}
        {tab === 'scan' && (
          <View style={{ alignItems: 'center', width: '100%', gap: defaultSpacing.sm }}>
            {Platform.OS === 'web' ? (
              /* Web fallback: paste input */
              <View style={{ width: '100%', gap: defaultSpacing.sm, paddingVertical: defaultSpacing.md }}>
                <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
                  Camera scanning is only available on mobile.{'\n'}Paste a DID or invite link below.
                </Text>
                <Input
                  value={pasteValue}
                  onChangeText={setPasteValue}
                  placeholder={mode === 'profile' ? 'did:key:z6Mk...' : 'https://umbra.chat/invite/...'}
                  size="md"
                  fullWidth
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  variant="primary"
                  onPress={handlePasteSubmit}
                  disabled={!pasteValue.trim()}
                >
                  Submit
                </Button>
              </View>
            ) : !permission ? (
              <View style={{ paddingVertical: defaultSpacing.xl }}>
                <Text size="sm" style={{ color: tc.text.muted }}>
                  Requesting camera permission...
                </Text>
              </View>
            ) : !permission.granted ? (
              <View style={{ alignItems: 'center', gap: defaultSpacing.sm, paddingVertical: defaultSpacing.md }}>
                <Text size="sm" weight="bold" style={{ color: tc.text.primary, textAlign: 'center' }}>
                  Camera Access Required
                </Text>
                <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
                  To scan QR codes, Umbra needs access to your camera.
                </Text>
                <Button variant="primary" onPress={requestPermission}>
                  Grant Camera Access
                </Button>
              </View>
            ) : (
              /* Camera scanner */
              <View style={{ width: VIEWFINDER_SIZE + 20, height: VIEWFINDER_SIZE + 20, borderRadius: 12, overflow: 'hidden' }}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />
                {/* Viewfinder overlay */}
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                </View>
                {scanned && (
                  <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Text size="sm" style={{ color: '#fff', marginBottom: 8 }}>
                      QR code detected!
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
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Segmented Toggle ── */}
        <View style={{ paddingTop: defaultSpacing.sm }}>
          <SegmentedControl
            options={TAB_OPTIONS}
            value={tab}
            onChange={handleTabChange}
            size="sm"
          />
        </View>
      </View>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
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
