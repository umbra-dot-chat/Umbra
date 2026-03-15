/**
 * Tests for useVideoEffects hook
 *
 * Covers: initial state, effect=none returns source, background presets list.
 * Note: Full pipeline testing requires DOM canvas/video which is limited in jsdom.
 */

// ---------------------------------------------------------------------------
// Mocks — must be before import
// ---------------------------------------------------------------------------

jest.mock('../../assets/backgrounds', () => ({
  bgOffice: 'office.png',
  bgNature: 'nature.png',
  bgAbstract: 'abstract.png',
  bgGradient: 'gradient.png',
  bgSolidDark: 'solid-dark.png',
  bgSolidLight: 'solid-light.png',
  bgBeach: 'beach.png',
  bgCity: 'city.png',
}));

import { renderHook } from '@testing-library/react-native';
import { useVideoEffects, BACKGROUND_PRESETS } from '@/hooks/useVideoEffects';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useVideoEffects', () => {
  it('returns null output when no source stream', () => {
    const { result } = renderHook(() =>
      useVideoEffects({
        sourceStream: null,
        effect: 'none',
      }),
    );

    expect(result.current.outputStream).toBeNull();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns source stream when effect is none', () => {
    const mockStream = { id: 'test-stream' } as unknown as MediaStream;

    const { result } = renderHook(() =>
      useVideoEffects({
        sourceStream: mockStream,
        effect: 'none',
        enabled: true,
      }),
    );

    // When effect is none, needsPipeline is false, should pass through source
    expect(result.current.outputStream).toBe(mockStream);
    expect(result.current.isProcessing).toBe(false);
  });

  it('provides background presets', () => {
    const { result } = renderHook(() =>
      useVideoEffects({
        sourceStream: null,
        effect: 'none',
      }),
    );

    expect(result.current.backgroundPresets.length).toBe(8);
    expect(result.current.backgroundPresets[0].id).toBe('office');
  });

  it('BACKGROUND_PRESETS has correct structure', () => {
    expect(BACKGROUND_PRESETS).toHaveLength(8);
    for (const preset of BACKGROUND_PRESETS) {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('thumbnail');
      expect(preset).toHaveProperty('url');
    }
  });

  it('returns null output when disabled', () => {
    const mockStream = { id: 'test-stream' } as unknown as MediaStream;

    const { result } = renderHook(() =>
      useVideoEffects({
        sourceStream: mockStream,
        effect: 'blur',
        enabled: false,
      }),
    );

    expect(result.current.outputStream).toBeNull();
  });
});
