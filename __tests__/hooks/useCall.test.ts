/**
 * Tests for the useCall hook.
 */

import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useCall } from '@/hooks/useCall';

// Mock the CallContext
const mockStartCall = jest.fn();
const mockAcceptCall = jest.fn();
const mockEndCall = jest.fn();
const mockToggleMute = jest.fn();
const mockToggleCamera = jest.fn();

jest.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({
    activeCall: null,
    startCall: mockStartCall,
    acceptCall: mockAcceptCall,
    endCall: mockEndCall,
    toggleMute: mockToggleMute,
    toggleCamera: mockToggleCamera,
  }),
}));

describe('useCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns call context value', () => {
    const { result } = renderHook(() => useCall());

    expect(result.current).toHaveProperty('activeCall');
    expect(result.current).toHaveProperty('startCall');
    expect(result.current).toHaveProperty('acceptCall');
    expect(result.current).toHaveProperty('endCall');
    expect(result.current).toHaveProperty('toggleMute');
    expect(result.current).toHaveProperty('toggleCamera');
  });

  test('activeCall is null initially', () => {
    const { result } = renderHook(() => useCall());
    expect(result.current.activeCall).toBeNull();
  });

  test('exposes startCall function', () => {
    const { result } = renderHook(() => useCall());
    expect(typeof result.current.startCall).toBe('function');
  });

  test('exposes acceptCall function', () => {
    const { result } = renderHook(() => useCall());
    expect(typeof result.current.acceptCall).toBe('function');
  });

  test('exposes endCall function', () => {
    const { result } = renderHook(() => useCall());
    expect(typeof result.current.endCall).toBe('function');
  });

  test('exposes toggleMute function', () => {
    const { result } = renderHook(() => useCall());
    expect(typeof result.current.toggleMute).toBe('function');
  });

  test('exposes toggleCamera function', () => {
    const { result } = renderHook(() => useCall());
    expect(typeof result.current.toggleCamera).toBe('function');
  });
});
