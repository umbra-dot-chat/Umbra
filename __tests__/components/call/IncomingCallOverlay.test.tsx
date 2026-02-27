/**
 * Tests for the IncomingCallOverlay component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock the dependencies
const mockAcceptCall = jest.fn();
const mockEndCall = jest.fn();
let mockActiveCall: any = null;

jest.mock('@/hooks/useCall', () => ({
  useCall: () => ({
    activeCall: mockActiveCall,
    acceptCall: mockAcceptCall,
    endCall: mockEndCall,
    startCall: jest.fn(),
    toggleMute: jest.fn(),
    toggleCamera: jest.fn(),
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
  CallNotification: ({ callerName, callType, onAccept, onDecline, ...props }: any) => {
    const { View, Text: RNText, Pressable } = require('react-native');
    const typeLabel = callType === 'video' ? 'video' : 'voice';
    return (
      <View testID="CallNotification" {...props}>
        <RNText>{callerName}</RNText>
        <RNText>{`Incoming ${typeLabel} call...`}</RNText>
        <Pressable onPress={onAccept} accessibilityLabel="Accept call"><RNText>Accept</RNText></Pressable>
        <Pressable onPress={onDecline} accessibilityLabel="Decline call"><RNText>Decline</RNText></Pressable>
      </View>
    );
  },
  useTheme: () => ({
    theme: {
      colors: {
        surface: { primary: '#1a1a1a' },
        text: { primary: '#fff', secondary: '#aaa' },
        status: { danger: '#ef4444', success: '#22c55e' },
      },
    },
  }),
}));

jest.mock('@/components/ui', () => ({
  PhoneIcon: () => null,
  PhoneOffIcon: () => null,
  VideoIcon: () => null,
}));

import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';

describe('IncomingCallOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveCall = null;
  });

  test('renders nothing when no active call', () => {
    const { toJSON } = render(<IncomingCallOverlay />);
    expect(toJSON()).toBeNull();
  });

  test('renders nothing when call is not incoming', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'connected',
      callType: 'voice',
      remoteDisplayName: 'Alice',
    };
    const { toJSON } = render(<IncomingCallOverlay />);
    expect(toJSON()).toBeNull();
  });

  test('renders overlay for incoming voice call', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'incoming',
      callType: 'voice',
      remoteDisplayName: 'Alice',
    };
    const { getByText, getByLabelText } = render(<IncomingCallOverlay />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Incoming voice call...')).toBeTruthy();
    expect(getByLabelText('Accept call')).toBeTruthy();
    expect(getByLabelText('Decline call')).toBeTruthy();
  });

  test('renders overlay for incoming video call', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'incoming',
      callType: 'video',
      remoteDisplayName: 'Bob',
    };
    const { getByText } = render(<IncomingCallOverlay />);
    expect(getByText('Incoming video call...')).toBeTruthy();
  });

  test('calls acceptCall when accept button pressed', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'incoming',
      callType: 'voice',
      remoteDisplayName: 'Alice',
    };
    const { getByLabelText } = render(<IncomingCallOverlay />);
    fireEvent.press(getByLabelText('Accept call'));
    expect(mockAcceptCall).toHaveBeenCalledTimes(1);
  });

  test('calls endCall with declined when decline button pressed', () => {
    mockActiveCall = {
      callId: 'call-1',
      status: 'incoming',
      callType: 'voice',
      remoteDisplayName: 'Alice',
    };
    const { getByLabelText } = render(<IncomingCallOverlay />);
    fireEvent.press(getByLabelText('Decline call'));
    expect(mockEndCall).toHaveBeenCalledWith('declined');
  });
});
