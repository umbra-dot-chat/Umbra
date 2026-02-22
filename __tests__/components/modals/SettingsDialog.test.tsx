import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsDialog } from '@/components/modals/SettingsDialog';
import { AuthProvider } from '@/contexts/AuthContext';
import { UmbraProvider } from '@/contexts/UmbraContext';
import { HelpProvider } from '@/contexts/HelpContext';

// expo-router mock
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: jest.fn(() => ({
    isConnected: false,
    peerCount: 0,
    listenAddresses: [],
    startNetwork: jest.fn(),
    stopNetwork: jest.fn(),
    getRelayWs: jest.fn(() => null),
    relayConnected: false,
    relayUrl: null,
    connectRelay: jest.fn(),
    disconnectRelay: jest.fn(),
    createOfferSession: jest.fn(),
    acceptSession: jest.fn(),
    connectionState: 'disconnected',
    offerData: null,
    answerData: null,
    createOffer: jest.fn(),
    acceptOffer: jest.fn(),
    completeHandshake: jest.fn(),
    resetSignaling: jest.fn(),
    sendSignal: jest.fn(),
    error: null,
    relayServers: [],
    addRelayServer: jest.fn(),
    removeRelayServer: jest.fn(),
    setDefaultRelay: jest.fn(),
    relayLatencies: {},
  })),
  pushPendingRelayAck: jest.fn(),
}));

jest.mock('@/hooks/useCall', () => ({
  useCall: () => ({
    activeCall: null,
    startCall: jest.fn(),
    acceptCall: jest.fn(),
    endCall: jest.fn(),
    toggleMute: jest.fn(),
    toggleCamera: jest.fn(),
    switchCamera: jest.fn(),
    videoQuality: 'auto',
    audioQuality: 'auto',
    setVideoQuality: jest.fn(),
    setAudioQuality: jest.fn(),
    callStats: null,
  }),
}));

jest.mock('@/hooks/useCallSettings', () => ({
  useCallSettings: () => ({
    videoQuality: 'auto',
    audioQuality: 'auto',
    opusConfig: {},
    setVideoQuality: jest.fn(),
    setAudioQuality: jest.fn(),
    setOpusConfig: jest.fn(),
    resetToDefaults: jest.fn(),
  }),
}));

jest.mock('@/hooks/useMediaDevices', () => ({
  useMediaDevices: () => ({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
    selectedAudioInput: null,
    selectedAudioOutput: null,
    selectedVideoInput: null,
    setSelectedAudioInput: jest.fn(),
    setSelectedAudioOutput: jest.fn(),
    setSelectedVideoInput: jest.fn(),
    refreshDevices: jest.fn(),
  }),
}));

jest.mock('@/contexts/PluginContext', () => ({
  usePlugins: jest.fn(() => ({
    getSlotComponents: jest.fn(() => []),
    plugins: [],
    installPlugin: jest.fn(),
    enablePlugin: jest.fn(),
    disablePlugin: jest.fn(),
    uninstallPlugin: jest.fn(),
  })),
}));

jest.mock('@/contexts/FontContext', () => ({
  useFonts: () => ({
    currentFont: 'system',
    setFont: jest.fn(),
    availableFonts: [],
  }),
  FONT_REGISTRY: [],
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useAppTheme: () => ({
    mode: 'light',
    setMode: jest.fn(),
    accentColor: '#000',
    setAccentColor: jest.fn(),
  }),
}));

jest.mock('@umbra/wasm', () => ({
  clearDatabaseExport: jest.fn(),
  getSqlDatabase: jest.fn(),
}));

jest.mock('@/config', () => ({
  PRIMARY_RELAY_URL: 'wss://relay.example.com',
  DEFAULT_RELAY_SERVERS: [],
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    playSound: jest.fn(),
    masterVolume: 0.8,
    setMasterVolume: jest.fn(),
    muted: false,
    setMuted: jest.fn(),
    categoryVolumes: {},
    setCategoryVolume: jest.fn(),
    categoryEnabled: {},
    setCategoryEnabled: jest.fn(),
    activeTheme: 'playful',
    setActiveTheme: jest.fn(),
    preferencesLoaded: true,
  }),
  SoundProvider: ({ children }: any) => children,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <UmbraProvider>
      <HelpProvider>
        {children}
      </HelpProvider>
    </UmbraProvider>
  </AuthProvider>
);

describe('SettingsDialog', () => {
  test('renders when open', () => {
    const { getByTestId } = render(
      <SettingsDialog open={true} onClose={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByTestId('Overlay')).toBeTruthy();
  });

  test('renders account section by default', () => {
    const { getByText } = render(
      <SettingsDialog open={true} onClose={jest.fn()} />,
      { wrapper: Wrapper },
    );
    // Account section header
    expect(getByText('Account')).toBeTruthy();
  });

  test('does not render when closed', () => {
    const { queryByTestId } = render(
      <SettingsDialog open={false} onClose={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(queryByTestId('Overlay')).toBeNull();
  });

  // ── Network settings section ──

  test('renders Network nav item', () => {
    const { getByText } = render(
      <SettingsDialog open={true} onClose={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('Network')).toBeTruthy();
  });

  test('switches to Network section when clicked', () => {
    const { getByText, getAllByText } = render(
      <SettingsDialog open={true} onClose={jest.fn()} />,
      { wrapper: Wrapper },
    );
    const networkItem = getByText('Network');
    fireEvent.press(networkItem);
    // After clicking, should show network-related content
    // The NetworkSection shows "Disconnected" (from useNetwork mock) and "P2P Network"
    expect(getByText('Disconnected')).toBeTruthy();
    expect(getByText('P2P Network')).toBeTruthy();
  });
});
