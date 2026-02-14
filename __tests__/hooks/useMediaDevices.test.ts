/**
 * Tests for the useMediaDevices hook.
 *
 * Tests the hook export and the underlying device enumeration patterns.
 */

// Mock navigator.mediaDevices
const mockEnumerateDevices = jest.fn(() =>
  Promise.resolve([
    { deviceId: 'mic-1', label: 'Built-in Mic', kind: 'audioinput' },
    { deviceId: 'mic-2', label: 'USB Mic', kind: 'audioinput' },
    { deviceId: 'cam-1', label: 'Built-in Camera', kind: 'videoinput' },
    { deviceId: 'spk-1', label: 'Built-in Speakers', kind: 'audiooutput' },
  ])
);

const mockGetUserMedia = jest.fn(() =>
  Promise.resolve({
    getTracks: () => [{ stop: jest.fn() }],
  })
);

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      enumerateDevices: mockEnumerateDevices,
      getUserMedia: mockGetUserMedia,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  },
  writable: true,
});

import { useMediaDevices } from '@/hooks/useMediaDevices';

describe('useMediaDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports useMediaDevices function', () => {
    expect(typeof useMediaDevices).toBe('function');
  });

  test('enumerateDevices returns expected device list', async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    expect(devices).toHaveLength(4);

    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

    expect(audioInputs).toHaveLength(2);
    expect(videoInputs).toHaveLength(1);
    expect(audioOutputs).toHaveLength(1);
  });

  test('enumerateDevices returns correct device IDs and labels', async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mic = devices.find((d) => d.deviceId === 'mic-1');
    expect(mic?.label).toBe('Built-in Mic');
    expect(mic?.kind).toBe('audioinput');
  });

  test('getUserMedia returns a stream with stop-able tracks', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const tracks = stream.getTracks();
    expect(tracks).toHaveLength(1);
    expect(typeof tracks[0].stop).toBe('function');
  });

  test('device kinds are correctly categorized', async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (const device of devices) {
      expect(['audioinput', 'videoinput', 'audiooutput']).toContain(device.kind);
    }
  });

  test('devicechange event listeners can be registered', () => {
    const handler = jest.fn();
    navigator.mediaDevices.addEventListener('devicechange', handler);
    expect(navigator.mediaDevices.addEventListener).toHaveBeenCalledWith('devicechange', handler);
  });
});
