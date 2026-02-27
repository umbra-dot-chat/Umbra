/**
 * Tests for the ConfirmDialog component.
 *
 * Validates that the confirmation dialog renders correctly and
 * handles user interactions (confirm/cancel) properly.
 * The Dialog component underneath uses the Platform.OS fix
 * (View+onClick on web, Pressable on native) for the close button.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when open is false', () => {
    const { toJSON } = render(
      <ConfirmDialog {...defaultProps} open={false} />
    );
    // Dialog mock renders null when open=false
    expect(toJSON()).toBeNull();
  });

  test('renders dialog when open', () => {
    const { getByTestId } = render(
      <ConfirmDialog {...defaultProps} />
    );
    // Dialog renders with the testID from the mock
    expect(getByTestId('Dialog')).toBeTruthy();
  });

  test('renders message text', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} />
    );
    expect(getByText('Are you sure you want to proceed?')).toBeTruthy();
  });

  test('renders default confirm label "Delete"', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} />
    );
    expect(getByText('Delete')).toBeTruthy();
  });

  test('renders custom confirm label', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} confirmLabel="Remove" />
    );
    expect(getByText('Remove')).toBeTruthy();
  });

  test('renders cancel button', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} />
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  test('calls onClose when cancel is pressed', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} />
    );
    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onConfirm when confirm button is pressed', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />
    );

    await act(async () => {
      fireEvent.press(getByText('Delete'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('shows submitting state text', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} submitting={true} />
    );
    expect(getByText('Deleting...')).toBeTruthy();
  });

  test('shows error message when onConfirm throws', async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error('Network error'));
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />
    );

    await act(async () => {
      fireEvent.press(getByText('Delete'));
    });

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });
  });

  test('renders optional image when provided', () => {
    const { toJSON } = render(
      <ConfirmDialog {...defaultProps} image={require('react-native/Libraries/NewAppScreen/components/logo.png')} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
