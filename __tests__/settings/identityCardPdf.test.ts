/**
 * Tests for identity card PDF generation utility.
 *
 * Validates the PDF generation pipeline: correct jsPDF API calls,
 * QR code rendering, recovery phrase inclusion, download/preview
 * output, and edge cases.
 *
 * Test IDs: T-IC.1 - T-IC.8
 */

import type { IdentityCardData } from '@/utils/identity-card-pdf';

// ── jsPDF mock ─────────────────────────────────────────────────────────

const mockSave = jest.fn();
const mockOutput = jest.fn(() => new Blob(['mock-pdf'], { type: 'application/pdf' }));
const mockText = jest.fn();
const mockRect = jest.fn();
const mockRoundedRect = jest.fn();
const mockLine = jest.fn();
const mockAddImage = jest.fn();
const mockSetFont = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetFillColor = jest.fn();
const mockSetDrawColor = jest.fn();
const mockSetLineWidth = jest.fn();
const mockSetLineDashPattern = jest.fn();

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    text: mockText,
    rect: mockRect,
    roundedRect: mockRoundedRect,
    line: mockLine,
    addImage: mockAddImage,
    setFont: mockSetFont,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setFillColor: mockSetFillColor,
    setDrawColor: mockSetDrawColor,
    setLineWidth: mockSetLineWidth,
    setLineDashPattern: mockSetLineDashPattern,
    save: mockSave,
    output: mockOutput,
  })),
}));

// ── qrcode-generator mock ──────────────────────────────────────────────

jest.mock('qrcode-generator', () => {
  return jest.fn().mockImplementation(() => ({
    addData: jest.fn(),
    make: jest.fn(),
    getModuleCount: jest.fn(() => 4),
    isDark: jest.fn((r: number, c: number) => (r + c) % 2 === 0),
  }));
});

// ── Import after mocks ─────────────────────────────────────────────────

import {
  generateIdentityCardPDF,
  downloadIdentityCardPDF,
  getIdentityCardPreviewUrl,
} from '@/utils/identity-card-pdf';
import { jsPDF } from 'jspdf';

// ── Test data ──────────────────────────────────────────────────────────

const baseData: IdentityCardData = {
  displayName: 'Alice',
  did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  avatar: null,
  createdAt: 1700000000000,
  status: 'Online',
};

const phraseWords = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent',
  'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
  'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
  'across', 'act', 'action', 'actor', 'actress', 'actual',
];

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Identity Card PDF Generation', () => {

  test('T-IC.1: generateIdentityCardPDF creates an A4 portrait jsPDF document', () => {
    const doc = generateIdentityCardPDF(baseData);
    expect(jsPDF).toHaveBeenCalledWith(expect.objectContaining({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }));
    expect(doc).toBeDefined();
  });

  test('T-IC.2: PDF includes passenger name and DID', () => {
    generateIdentityCardPDF(baseData);
    // Check that the display name appears
    expect(mockText).toHaveBeenCalledWith(
      'Alice',
      expect.any(Number),
      expect.any(Number),
    );
    // Check that the DID appears (may be split across lines)
    const didCalls = mockText.mock.calls.filter(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('did:key:'),
    );
    expect(didCalls.length).toBeGreaterThan(0);
  });

  test('T-IC.3: PDF renders QR code modules', () => {
    generateIdentityCardPDF(baseData);
    // QR code draws individual module rectangles
    expect(mockRect).toHaveBeenCalled();
    // Should draw dark modules (from our mock: (r+c)%2 === 0 = 8 dark modules in a 4x4 grid)
    const rectCalls = mockRect.mock.calls.filter(
      (call: any[]) => call.length >= 5 && call[4] === 'F',
    );
    expect(rectCalls.length).toBeGreaterThan(0);
  });

  test('T-IC.4: PDF without recovery phrase does not render seed words', () => {
    generateIdentityCardPDF({ ...baseData, includeRecoveryPhrase: false });
    // None of the seed words should appear
    const wordCalls = mockText.mock.calls.filter(
      (call: any[]) => typeof call[0] === 'string' && call[0] === 'abandon',
    );
    expect(wordCalls.length).toBe(0);
  });

  test('T-IC.5: PDF with recovery phrase renders all 24 words', () => {
    generateIdentityCardPDF({
      ...baseData,
      recoveryPhrase: phraseWords,
      includeRecoveryPhrase: true,
    });

    // All 24 words should appear
    for (const word of phraseWords) {
      expect(mockText).toHaveBeenCalledWith(
        word,
        expect.any(Number),
        expect.any(Number),
      );
    }
  });

  test('T-IC.6: PDF renders avatar fallback initial when no avatar provided', () => {
    generateIdentityCardPDF({ ...baseData, avatar: null });
    // Should render the initial "A" for "Alice"
    const initialCalls = mockText.mock.calls.filter(
      (call: any[]) => call[0] === 'A' && typeof call[3] === 'object' && call[3].align === 'center',
    );
    expect(initialCalls.length).toBeGreaterThan(0);
  });

  test('T-IC.7: downloadIdentityCardPDF triggers save with correct filename', () => {
    downloadIdentityCardPDF(baseData);
    expect(mockSave).toHaveBeenCalledWith('umbra-recovery-alice.pdf');
  });

  test('T-IC.8: getIdentityCardPreviewUrl returns a blob URL', () => {
    // Mock URL.createObjectURL
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    const url = getIdentityCardPreviewUrl(baseData);
    expect(url).toBe('blob:mock-url');
    expect(mockOutput).toHaveBeenCalledWith('blob');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
