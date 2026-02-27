/**
 * Tests for the VoiceChannelBar component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ── Mock dependencies ──────────────────────────────────────────────────────

const mockToggleMute = jest.fn();
const mockToggleDeafen = jest.fn();
const mockLeaveVoiceChannel = jest.fn();

let mockVoiceState: any = {
  activeChannelId: null,
  activeChannelName: null,
  participants: [],
  isMuted: false,
  isDeafened: false,
  isConnecting: false,
  toggleMute: mockToggleMute,
  toggleDeafen: mockToggleDeafen,
  leaveVoiceChannel: mockLeaveVoiceChannel,
};

jest.mock('@/contexts/VoiceChannelContext', () => ({
  useVoiceChannel: () => mockVoiceState,
}));

jest.mock('@coexist/wisp-react-native', () => ({
  Text: ({ children, ...props }: any) => {
    const { Text: RNText } = require('react-native');
    return <RNText {...props}>{children}</RNText>;
  },
  useTheme: () => ({
    theme: {
      colors: {
        border: { subtle: '#333' },
        background: { secondary: '#1a1a1a', primary: '#111', tertiary: '#222', sunken: '#0d0d0d' },
        text: { secondary: '#aaa', muted: '#777' },
        status: { success: '#22c55e', error: '#ef4444', danger: '#ef4444' },
      },
    },
  }),
}));

jest.mock('@/components/ui', () => ({
  RadioIcon: () => null,
  MicIcon: () => null,
  MicOffIcon: () => null,
  VolumeIcon: () => null,
  VolumeMuteIcon: () => null,
  PhoneOffIcon: () => null,
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
  Svg: ({ children }: any) => children,
  Path: () => null,
  Circle: () => null,
  Line: () => null,
}));

import { VoiceChannelBar } from '@/components/community/voice/VoiceChannelBar';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('VoiceChannelBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVoiceState = {
      activeChannelId: null,
      activeChannelName: null,
      participants: [],
      isMuted: false,
      isDeafened: false,
      isConnecting: false,
      toggleMute: mockToggleMute,
      toggleDeafen: mockToggleDeafen,
      leaveVoiceChannel: mockLeaveVoiceChannel,
    };
  });

  test('renders nothing when no voice channel is active', () => {
    const { toJSON } = render(<VoiceChannelBar />);
    expect(toJSON()).toBeNull();
  });

  test('renders when voice channel is active', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    const { getByText } = render(<VoiceChannelBar />);
    expect(getByText('Voice Connected')).toBeTruthy();
    expect(getByText('Lounge')).toBeTruthy();
  });

  test('shows channel name', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Gaming';
    mockVoiceState.participants = ['did:key:alice', 'did:key:bob'];
    const { getByText } = render(<VoiceChannelBar />);
    expect(getByText('Gaming')).toBeTruthy();
  });

  test('shows Connecting... status when connecting', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    mockVoiceState.isConnecting = true;
    const { getByText } = render(<VoiceChannelBar />);
    expect(getByText('Connecting\u2026')).toBeTruthy();
  });

  test('falls back to channel ID when name is null', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = null;
    const { getByText } = render(<VoiceChannelBar />);
    expect(getByText('voice-1')).toBeTruthy();
  });

  test('mute button calls toggleMute', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    const { getByLabelText } = render(<VoiceChannelBar />);
    fireEvent.press(getByLabelText('Mute'));
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  test('shows unmute label when muted', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    mockVoiceState.isMuted = true;
    const { getByLabelText } = render(<VoiceChannelBar />);
    expect(getByLabelText('Unmute')).toBeTruthy();
  });

  test('deafen button calls toggleDeafen', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    const { getByLabelText } = render(<VoiceChannelBar />);
    fireEvent.press(getByLabelText('Deafen'));
    expect(mockToggleDeafen).toHaveBeenCalledTimes(1);
  });

  test('shows undeafen label when deafened', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    mockVoiceState.isDeafened = true;
    const { getByLabelText } = render(<VoiceChannelBar />);
    expect(getByLabelText('Undeafen')).toBeTruthy();
  });

  test('leave button calls leaveVoiceChannel', () => {
    mockVoiceState.activeChannelId = 'voice-1';
    mockVoiceState.activeChannelName = 'Lounge';
    const { getByLabelText } = render(<VoiceChannelBar />);
    fireEvent.press(getByLabelText('Leave voice channel'));
    expect(mockLeaveVoiceChannel).toHaveBeenCalledTimes(1);
  });
});
