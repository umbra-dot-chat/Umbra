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
