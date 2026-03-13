/**
 * IdentityCardDialog — Preview and download a printable account recovery PDF.
 *
 * A clean dialog for generating a black-and-white PDF containing the
 * user's DID, QR code, profile picture, and optionally the 24-word
 * recovery phrase. Designed to be printed and stored in a safe.
 *
 * Web only: uses jsPDF for PDF generation and iframe for preview.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  Dialog,
  Button,
  Toggle,
  Text,
  Box,
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
import { dbg } from '@/utils/debug';

// ── Types ──────────────────────────────────────────────────────────────

export interface IdentityCardDialogProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export function IdentityCardDialog({ open, onClose }: IdentityCardDialogProps) {
  if (__DEV__) dbg.trackRender('IdentityCardDialog');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { identity, recoveryPhrase } = useAuth();

  const [includePhrase, setIncludePhrase] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    let cancelled = false;

    getIdentityCardPreviewUrl(cardData)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => { cancelled = true; };
  }, [open, cardData]);

  useEffect(() => {
    if (!open) setPreviewUrl(null);
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!cardData) return;
    await downloadIdentityCardPDF(cardData);
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
      <Box style={{ gap: 16, paddingVertical: 8 }}>
        {/* Description */}
        <Box style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: tc.background.sunken,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: tc.border.subtle,
        }}>
          <FileTextIcon size={18} color={tc.text.secondary} />
          <Box style={{ flex: 1 }}>
            <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>
              Printable Recovery Document
            </Text>
            <Text size="xs" style={{ color: tc.text.secondary, marginTop: 2 }}>
              Generate a black-and-white PDF with your account details and QR code.
              Print it and store it somewhere safe.
            </Text>
          </Box>
        </Box>

        {/* PDF Preview */}
        {Platform.OS === 'web' && previewUrl && (
          <Box style={{
            borderRadius: 10,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: tc.border.subtle,
            backgroundColor: tc.background.sunken,
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
          </Box>
        )}

        {Platform.OS !== 'web' && (
          <Box style={{
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tc.background.sunken,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: tc.border.subtle,
          }}>
            <Text size="sm" style={{ color: tc.text.muted }}>
              PDF preview is available on web only.
            </Text>
          </Box>
        )}

        <Separator spacing="sm" />

        {/* Recovery Phrase Toggle */}
        <Box style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: includePhrase
            ? tc.status.dangerSurface
            : tc.background.sunken,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: includePhrase
            ? tc.status.dangerBorder
            : tc.border.subtle,
        }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {includePhrase ? (
              <AlertTriangleIcon size={18} color={tc.status.danger} />
            ) : (
              <LockIcon size={18} color={tc.text.muted} />
            )}
            <Box style={{ flex: 1 }}>
              <Text size="sm" weight="semibold" style={{
                color: includePhrase ? tc.status.danger : tc.text.primary,
              }}>
                Include Recovery Phrase
              </Text>
              <Text size="xs" style={{
                color: includePhrase ? tc.status.danger : tc.text.secondary,
                marginTop: 1,
              }}>
                {includePhrase
                  ? 'Anyone with this document can access your account!'
                  : 'Your 24-word phrase will be printed on the document'}
              </Text>
            </Box>
          </Box>
          <Toggle
            checked={includePhrase}
            onChange={handleTogglePhrase}
          />
        </Box>

        {/* Download Button */}
        <Button
          variant="primary"
          onPress={handleDownload}
          iconLeft={<DownloadIcon size={16} color={tc.text.inverse} />}
        >
          Download PDF
        </Button>

        {/* Footer note */}
        <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
          {includePhrase
            ? 'This document contains sensitive recovery data. Store it securely.'
            : 'This document contains your public DID and QR code only.'}
        </Text>
      </Box>
    </Dialog>
  );
}
