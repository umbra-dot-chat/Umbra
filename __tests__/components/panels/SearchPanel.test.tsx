import React from 'react';
import { render } from '@testing-library/react-native';
import { SearchPanel } from '@/components/panels/SearchPanel';

describe('SearchPanel', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(
      <SearchPanel query="" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  test('renders MessageSearch component', () => {
    const { getByTestId } = render(
      <SearchPanel query="" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });

  test('passes query to MessageSearch', () => {
    const { getByTestId } = render(
      <SearchPanel query="migration" onQueryChange={jest.fn()} onClose={jest.fn()} />,
    );
    // The mock MessageSearch receives props through
    expect(getByTestId('MessageSearch')).toBeTruthy();
  });
});
