/**
 * Tests for the ActiveCallBar component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock the dependencies
const mockToggleMute = jest.fn();
const mockToggleCamera = jest.fn();
const mockEndCall = jest.fn();
let mockActiveCall: any = null;

jest.mock('@/hooks/useCall', () => ({
  useCall: () => ({
    activeCall: mockActiveCall,
    toggleMute: mockToggleMute,
    toggleCamera: mockToggleCamera,
    endCall: mockEndCall,
    startCall: jest.fn(),
    acceptCall: jest.fn(),
  }),
}));

jest.mock('@coexist/wisp-react-native', () => ({
  Avatar: () => {
    const { View } = require('react-native');
    return <View testID="avatar" />;
  },
  Text: ({ children, ...props }: any) => {
    const { Text: RNText } = require('react-native');
    return <RNText {...props}>{children}</RNText>;
  },
  CallTimer: ({ startedAt }: any) => {
    const { Text } = require('react-native');
    return <Text>0:00</Text>;
  },
  useTheme: () => ({
    theme: {
      colors: {
        status: { success: '#22c55e', danger: '#ef4444' },
      },
    },
  }),
}));

jest.mock('@/components/icons', () => ({
  PhoneIcon: () => null,
  PhoneOffIcon: () => null,
  VideoIcon: () => null,
  VideoOffIcon: () => null,
  MicOffIcon: () => null,
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
  Svg: ({ children }: any) => children,
  Path: () => null,
}));

import { ActiveCallBar } from '@/components/call/ActiveCallBar';

describe('ActiveCallBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveCall = null;
  });

  test('renders nothing when no active call', () => {
    const { toJSON } = render(<ActiveCallBar />);
    expect(toJSON()).toBeNull();
  });

  test('renders nothing when call is incoming (overlay handles that)', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'incoming',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: null,
    };
    const { toJSON } = render(<ActiveCallBar />);
    expect(toJSON()).toBeNull();
  });

  test('renders bar when call is outgoing', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'outgoing',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: null,
    };
    const { getByText } = render(<ActiveCallBar />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Calling...')).toBeTruthy();
  });

  test('renders bar when call is connected', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'voice',
      remoteDisplayName: 'Bob',
      isMuted: false,
      isCameraOff: true,
      connectedAt: Date.now(),
    };
    const { getByText } = render(<ActiveCallBar />);
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('0:00')).toBeTruthy(); // Mocked CallTimer
  });

  test('shows Connecting... status when connecting', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connecting',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: null,
    };
    const { getByText } = render(<ActiveCallBar />);
    expect(getByText('Connecting...')).toBeTruthy();
  });

  test('calls toggleMute when mute button pressed', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: Date.now(),
    };
    const { getByLabelText } = render(<ActiveCallBar />);
    fireEvent.press(getByLabelText('Mute'));
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  test('calls endCall when end call button pressed', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: Date.now(),
    };
    const { getByLabelText } = render(<ActiveCallBar />);
    fireEvent.press(getByLabelText('End call'));
    expect(mockEndCall).toHaveBeenCalledTimes(1);
  });

  test('shows camera toggle for video calls', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'video',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: false,
      connectedAt: Date.now(),
    };
    const { getByLabelText } = render(<ActiveCallBar />);
    expect(getByLabelText('Turn off camera')).toBeTruthy();
  });

  test('does not show camera toggle for voice calls', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'voice',
      remoteDisplayName: 'Alice',
      isMuted: false,
      isCameraOff: true,
      connectedAt: Date.now(),
    };
    const { queryByLabelText } = render(<ActiveCallBar />);
    expect(queryByLabelText('Turn off camera')).toBeNull();
    expect(queryByLabelText('Turn on camera')).toBeNull();
  });
});
