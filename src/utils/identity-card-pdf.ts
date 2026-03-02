/**
 * identity-card-pdf.ts — Generate a printable account recovery details PDF.
 *
 * A clean, black-and-white document designed to be printed and stored
 * in a safe or other secure location. Contains the user's DID, QR code,
 * profile picture, and optionally the 24-word recovery phrase.
 */

import qrcode from 'qrcode-generator';

// jsPDF is loaded lazily to avoid crashing React Native on iOS/Android.
// The library uses Node.js `latin1` encoding at import time which doesn't
// exist in the Hermes runtime. PDF generation is web-only anyway.
let _jsPDF: typeof import('jspdf')['jsPDF'] | null = null;
async function loadJsPDF() {
  if (!_jsPDF) {
    const mod = await import('jspdf');
    _jsPDF = mod.jsPDF;
  }
  return _jsPDF;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface IdentityCardData {
  displayName: string;
  did: string;
  avatar?: string | null;
  createdAt: number;
  status?: string;
  recoveryPhrase?: string[] | null;
  includeRecoveryPhrase?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateQrMatrix(data: string): { matrix: boolean[][]; moduleCount: number } {
  const qr = qrcode(0, 'M');
  qr.addData(data);
  qr.make();
  const count = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.isDark(r, c));
    }
    matrix.push(row);
  }
  return { matrix, moduleCount: count };
}

function drawQrCode(doc: any, data: string, x: number, y: number, size: number) {
  const { matrix, moduleCount } = generateQrMatrix(data);
  const moduleSize = size / moduleCount;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(x - 2, y - 2, size + 4, size + 4, 'F');

  // Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x - 2, y - 2, size + 4, size + 4, 'S');

  // Dark modules
  doc.setFillColor(0, 0, 0);
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        doc.rect(x + c * moduleSize, y + r * moduleSize, moduleSize, moduleSize, 'F');
      }
    }
  }
}

function drawHorizontalRule(doc: any, x: number, y: number, w: number) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
}

function drawThinRule(doc: any, x: number, y: number, w: number) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.line(x, y, x + w, y);
}

// ── Main PDF generator ─────────────────────────────────────────────────

export async function generateIdentityCardPDF(data: IdentityCardData) {
  const jsPDF = await loadJsPDF();
  const showPhrase = data.includeRecoveryPhrase && data.recoveryPhrase && data.recoveryPhrase.length === 24;

  // A4 portrait
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Title ──

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Account Recovery Details', margin, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Umbra  \u2022  umbra.chat', margin + contentW, y + 6, { align: 'right' });

  y += 10;
  drawHorizontalRule(doc, margin, y, contentW);
  y += 8;

  // ── Profile section ──

  // Avatar
  const avatarSize = 18;
  const avatarX = margin;
  const avatarY = y;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(avatarX, avatarY, avatarSize, avatarSize, 'S');

  if (data.avatar) {
    try {
      const imgFormat = data.avatar.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(data.avatar, imgFormat, avatarX + 0.5, avatarY + 0.5, avatarSize - 1, avatarSize - 1);
    } catch {
      drawAvatarFallback(doc, data.displayName, avatarX, avatarY, avatarSize);
    }
  } else {
    drawAvatarFallback(doc, data.displayName, avatarX, avatarY, avatarSize);
  }

  // Name + date next to avatar
  const infoX = avatarX + avatarSize + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.displayName, infoX, avatarY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Created ' + formatDate(data.createdAt), infoX, avatarY + 13);

  y = avatarY + avatarSize + 6;
  drawThinRule(doc, margin, y, contentW);
  y += 8;

  // ── DID section ──

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Decentralized Identifier (DID)', margin, y);
  y += 5;

  // DID in monospace
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  const didStr = data.did;
  const maxCharsPerLine = 72;
  if (didStr.length > maxCharsPerLine) {
    doc.text(didStr.slice(0, maxCharsPerLine), margin, y);
    y += 4;
    doc.text(didStr.slice(maxCharsPerLine), margin, y);
  } else {
    doc.text(didStr, margin, y);
  }

  y += 6;
  drawThinRule(doc, margin, y, contentW);
  y += 8;

  // ── QR code section ──

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('QR Code', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Scan to add this identity as a friend', margin + 20, y);

  y += 4;

  const qrSize = 36;
  drawQrCode(doc, data.did, margin, y, qrSize);

  y += qrSize + 8;
  drawThinRule(doc, margin, y, contentW);
  y += 8;

  // ── Recovery phrase section ──

  if (showPhrase && data.recoveryPhrase) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Recovery Phrase', margin, y);
    y += 5;

    // Warning text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(
      'These 24 words are the only way to recover your account. Store this document securely.',
      margin,
      y,
    );
    y += 3;
    doc.text(
      'Anyone with access to these words has full control of your account.',
      margin,
      y,
    );
    y += 6;

    // Word grid — 4 columns x 6 rows
    const cols = 4;
    const rows = 6;
    const cellW = contentW / cols;
    const cellH = 8;

    for (let i = 0; i < 24; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = margin + col * cellW;
      const cy = y + row * cellH;

      // Cell border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(cx, cy, cellW - 1, cellH - 1, 'S');

      // Number
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(String(i + 1) + '.', cx + 1.5, cy + 3);

      // Word
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(data.recoveryPhrase[i], cx + 1.5, cy + 6.5);
    }

    y += rows * cellH + 4;
    drawThinRule(doc, margin, y, contentW);
    y += 6;
  }

  // ── Footer ──

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Generated ' + new Date().toISOString().slice(0, 10) + '  \u2022  Keep in a safe place  \u2022  Do not share digitally',
    margin,
    y,
  );

  return doc;
}

function drawAvatarFallback(doc: any, name: string, x: number, y: number, size: number) {
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, size, size, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(name.charAt(0).toUpperCase(), x + size / 2, y + size / 2 + 2, { align: 'center' });
}

/**
 * Generate the PDF and trigger a browser download.
 */
export async function downloadIdentityCardPDF(data: IdentityCardData): Promise<void> {
  const doc = await generateIdentityCardPDF(data);
  const safeName = data.displayName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`umbra-recovery-${safeName}.pdf`);
}

/**
 * Generate the PDF and return a Blob URL for preview.
 */
export async function getIdentityCardPreviewUrl(data: IdentityCardData): Promise<string> {
  const doc = await generateIdentityCardPDF(data);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
