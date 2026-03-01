/**
 * IdentityCardDialog — Preview and download a printable account recovery PDF.
 *
 * A clean dialog for generating a black-and-white PDF containing the
 * user's DID, QR code, profile picture, and optionally the 24-word
 * recovery phrase. Designed to be printed and stored in a safe.
 *
 * Web only: uses jsPDF for PDF generation and iframe for preview.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Platform, Text as RNText } from 'react-native';
import {
  Dialog,
  Button,
  Toggle,
  Text,
  Separator,
  useTheme,
} from '@coexist/wisp-react-native';
import {
  AlertTriangleIcon,
  DownloadIcon,
  LockIcon,
  FileTextIcon,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  downloadIdentityCardPDF,
  getIdentityCardPreviewUrl,
} from '@/utils/identity-card-pdf';
import type { IdentityCardData } from '@/utils/identity-card-pdf';

// ── Types ──────────────────────────────────────────────────────────────

export interface IdentityCardDialogProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export function IdentityCardDialog({ open, onClose }: IdentityCardDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { identity, recoveryPhrase } = useAuth();

  const [includePhrase, setIncludePhrase] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const cardData: IdentityCardData | null = useMemo(() => {
    if (!identity) return null;
    return {
      displayName: identity.displayName,
      did: identity.did,
      avatar: identity.avatar || null,
      createdAt: identity.createdAt,
      recoveryPhrase: recoveryPhrase || null,
      includeRecoveryPhrase: includePhrase,
    };
  }, [identity, recoveryPhrase, includePhrase]);

  useEffect(() => {
    if (!open || !cardData || Platform.OS !== 'web') return;

    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
    }

    try {
      const url = getIdentityCardPreviewUrl(cardData);
      setPreviewUrl(url);
      prevUrlRef.current = url;
    } catch {
      setPreviewUrl(null);
    }

    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [open, cardData]);

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    }
  }, [open]);

  const handleDownload = useCallback(() => {
    if (!cardData) return;
    downloadIdentityCardPDF(cardData);
  }, [cardData]);

  const handleTogglePhrase = useCallback((val: boolean) => {
    setIncludePhrase(val);
  }, []);

  if (!identity) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Account Recovery Details"
      size="lg"
    >
      <View style={{ gap: 16, paddingVertical: 8 }}>
        {/* Description */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: isDark ? '#18181B' : tc.background.sunken,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: isDark ? '#27272A' : tc.border.subtle,
        }}>
          <FileTextIcon size={18} color={tc.text.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
              Printable Recovery Document
            </Text>
            <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              Generate a black-and-white PDF with your account details and QR code.
              Print it and store it somewhere safe.
            </Text>
          </View>
        </View>

        {/* PDF Preview */}
        {Platform.OS === 'web' && previewUrl && (
          <View style={{
            borderRadius: 10,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : tc.border.subtle,
            backgroundColor: isDark ? '#09090B' : '#F1F5F9',
          }}>
            <iframe
              src={previewUrl}
              style={{
                width: '100%',
                height: 400,
                border: 'none',
                borderRadius: 10,
              }}
              title="Account Recovery Details Preview"
            />
          </View>
        )}

        {Platform.OS !== 'web' && (
          <View style={{
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#18181B' : tc.background.sunken,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : tc.border.subtle,
          }}>
            <Text style={{ fontSize: 13, color: tc.text.muted }}>
              PDF preview is available on web only.
            </Text>
          </View>
        )}

        <Separator spacing="sm" />

        {/* Recovery Phrase Toggle */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: includePhrase
            ? (isDark ? '#7F1D1D30' : '#FEF2F2')
            : (isDark ? '#18181B' : tc.background.sunken),
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: includePhrase
            ? (isDark ? '#991B1B' : '#FECACA')
            : (isDark ? '#27272A' : tc.border.subtle),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {includePhrase ? (
              <AlertTriangleIcon size={18} color="#EF4444" />
            ) : (
              <LockIcon size={18} color={tc.text.muted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: includePhrase ? '#EF4444' : tc.text.primary,
              }}>
                Include Recovery Phrase
              </Text>
              <Text style={{
                fontSize: 11,
                color: includePhrase ? '#FCA5A5' : tc.text.secondary,
                marginTop: 1,
              }}>
                {includePhrase
                  ? 'Anyone with this document can access your account!'
                  : 'Your 24-word phrase will be printed on the document'}
              </Text>
            </View>
          </View>
          <Toggle
            checked={includePhrase}
            onChange={handleTogglePhrase}
          />
        </View>

        {/* Download Button */}
        <Button
          variant="primary"
          onPress={handleDownload}
          iconLeft={<DownloadIcon size={16} color="#FFFFFF" />}
        >
          <RNText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
            Download PDF
          </RNText>
        </Button>

        {/* Footer note */}
        <Text style={{ fontSize: 11, color: tc.text.muted, textAlign: 'center' }}>
          {includePhrase
            ? 'This document contains sensitive recovery data. Store it securely.'
            : 'This document contains your public DID and QR code only.'}
        </Text>
      </View>
    </Dialog>
  );
}
