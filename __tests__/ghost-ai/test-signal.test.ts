/**
 * Ghost AI test-signal.ts — unit tests for audio/video test signal generators.
 */

import {
  generate440HzFrame,
  AudioTestSignal,
  generateTestFrame,
  VideoTestSignal,
} from '../../packages/umbra-ghost-ai/src/media/test-signal';

// ---------------------------------------------------------------------------
// generate440HzFrame
// ---------------------------------------------------------------------------

describe('generate440HzFrame', () => {
  it('returns Int16Array of 480 samples (48kHz / 100fps = 480)', () => {
    const { samples } = generate440HzFrame(0);
    expect(samples).toBeInstanceOf(Int16Array);
    expect(samples.length).toBe(480);
  });

  it('nextOffset advances by 480 each call', () => {
    const r1 = generate440HzFrame(0);
    expect(r1.nextOffset).toBe(480);
    const r2 = generate440HzFrame(r1.nextOffset);
    expect(r2.nextOffset).toBe(960);
  });

  it('amplitude scaling works — lower amplitude produces smaller values', () => {
    const loud = generate440HzFrame(0, 1.0);
    const quiet = generate440HzFrame(0, 0.1);

    const maxLoud = Math.max(...Array.from(loud.samples).map(Math.abs));
    const maxQuiet = Math.max(...Array.from(quiet.samples).map(Math.abs));

    expect(maxLoud).toBeGreaterThan(maxQuiet * 5);
  });

  it('phase continuity — consecutive frames produce smooth transitions', () => {
    const r1 = generate440HzFrame(0);
    const r2 = generate440HzFrame(r1.nextOffset);

    // The last sample of frame 1 and first sample of frame 2 should be close
    const lastSample = r1.samples[r1.samples.length - 1];
    const firstSample = r2.samples[0];

    // For a 440Hz wave at 48kHz, adjacent samples differ by at most
    // sin(2*pi*440/48000) * 32767 ~= ~1880. Allow generous margin.
    expect(Math.abs(lastSample - firstSample)).toBeLessThan(3000);
  });
});

// ---------------------------------------------------------------------------
// generateTestFrame (video)
// ---------------------------------------------------------------------------

describe('generateTestFrame', () => {
  it('returns a buffer of correct I420 size', () => {
    const w = 640;
    const h = 480;
    const frame = generateTestFrame(w, h, 0);
    const expectedSize = w * h + (w / 2) * (h / 2) * 2; // Y + U + V
    expect(frame.length).toBe(expectedSize);
  });

  it('embeds different frame numbers as different patterns', () => {
    const frame0 = generateTestFrame(640, 480, 0);
    const frame42 = generateTestFrame(640, 480, 42);
    // The frames should differ (at least in the binary pattern region)
    expect(frame0.equals(frame42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AudioTestSignal class
// ---------------------------------------------------------------------------

describe('AudioTestSignal', () => {
  it('start/stop lifecycle: delivers frames then stops', async () => {
    const frames: any[] = [];
    const mockSource = {
      onData: jest.fn((data: any) => frames.push(data)),
    };

    const signal = new AudioTestSignal(mockSource);
    signal.start();

    // Let it run for ~150ms (should get several frames at 10ms each)
    await new Promise((r) => setTimeout(r, 150));
    signal.stop();

    expect(frames.length).toBeGreaterThanOrEqual(1);
    expect(signal.framesDelivered).toBe(frames.length);

    // Each frame should have the correct structure
    const frame = frames[0];
    expect(frame.samples).toBeInstanceOf(Int16Array);
    expect(frame.sampleRate).toBe(48000);
    expect(frame.bitsPerSample).toBe(16);
    expect(frame.channelCount).toBe(1);
    expect(frame.numberOfFrames).toBe(480);
  });

  it('stop prevents further frame delivery', async () => {
    const mockSource = { onData: jest.fn() };
    const signal = new AudioTestSignal(mockSource);

    signal.start();
    await new Promise((r) => setTimeout(r, 30));
    signal.stop();

    const countAtStop = mockSource.onData.mock.calls.length;
    await new Promise((r) => setTimeout(r, 50));

    expect(mockSource.onData.mock.calls.length).toBe(countAtStop);
  });
});

// ---------------------------------------------------------------------------
// VideoTestSignal class
// ---------------------------------------------------------------------------

describe('VideoTestSignal', () => {
  it('start/stop lifecycle: delivers frames then stops', async () => {
    const frames: any[] = [];
    const mockSource = {
      onFrame: jest.fn((data: any) => frames.push(data)),
    };

    const signal = new VideoTestSignal(mockSource, 320, 240, 30);
    signal.start();

    // Let it run for ~120ms (should get ~3 frames at 33ms each)
    await new Promise((r) => setTimeout(r, 150));
    signal.stop();

    expect(frames.length).toBeGreaterThanOrEqual(2);
    expect(signal.framesGenerated).toBe(frames.length);

    // Each frame should have correct dimensions
    const frame = frames[0];
    expect(frame.width).toBe(320);
    expect(frame.height).toBe(240);
    expect(frame.data).toBeInstanceOf(Uint8ClampedArray);
  });

  it('stop prevents further frame delivery', async () => {
    const mockSource = { onFrame: jest.fn() };
    const signal = new VideoTestSignal(mockSource, 160, 120, 10);

    signal.start();
    await new Promise((r) => setTimeout(r, 150));
    signal.stop();

    const countAtStop = mockSource.onFrame.mock.calls.length;
    await new Promise((r) => setTimeout(r, 200));

    expect(mockSource.onFrame.mock.calls.length).toBe(countAtStop);
  });
});
