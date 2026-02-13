import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { UmbraProvider, useUmbra } from '@/contexts/UmbraContext';
import { AuthProvider } from '@/contexts/AuthContext';

// The mock at __mocks__/@umbra/service.js is automatically resolved
// via the moduleNameMapper in jest.config.js.

// UmbraProvider now uses useAuth() internally, so we need AuthProvider as a wrapper.
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

function TestConsumer() {
  const { isReady, isLoading, version, error } = useUmbra();
  return (
    <Text testID="status">
      {isLoading ? 'loading' : isReady ? `ready:${version}` : `error:${error?.message}`}
    </Text>
  );
}

function ServiceConsumer() {
  const { service, isReady } = useUmbra();
  return (
    <Text testID="service">
      {isReady && service ? 'service-available' : 'no-service'}
    </Text>
  );
}

describe('UmbraContext', () => {
  test('renders loading state initially', () => {
    const { getByTestId } = render(
      <UmbraProvider>
        <TestConsumer />
      </UmbraProvider>,
      { wrapper: Wrapper },
    );
    // On the very first synchronous render, isLoading is true
    expect(getByTestId('status').props.children).toBe('loading');
  });

  test('transitions to ready state after initialization', async () => {
    const { getByTestId } = render(
      <UmbraProvider>
        <TestConsumer />
      </UmbraProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(getByTestId('status').props.children).toMatch(/^ready:/);
    });
  });

  test('provides version string', async () => {
    const { getByTestId } = render(
      <UmbraProvider>
        <TestConsumer />
      </UmbraProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('ready:0.1.0-test');
    });
  });

  test('throws when useUmbra is used outside provider', () => {
    // Suppress the expected error output during this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useUmbra must be used within an <UmbraProvider>');

    consoleSpy.mockRestore();
  });

  test('service is available when ready', async () => {
    const { getByTestId } = render(
      <UmbraProvider>
        <ServiceConsumer />
      </UmbraProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(getByTestId('service').props.children).toBe('service-available');
    });
  });
});
