/**
 * Tests for useMention hook
 *
 * Covers: @ detection, autocomplete filtering, insertion, cursor tracking,
 * keyboard navigation, close behavior, edge cases.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useMention } from '@/hooks/useMention';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUsers = [
  { id: '1', name: 'Alice', username: 'alice' },
  { id: '2', name: 'Bob', username: 'bob' },
  { id: '3', name: 'Charlie', username: 'charlie' },
  { id: '4', name: 'Diana', username: 'diana' },
  { id: '5', name: 'Eve', username: 'eve' },
  { id: '6', name: 'Frank', username: 'frank' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMention', () => {
  it('starts with mention closed', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    expect(result.current.mentionOpen).toBe(false);
    expect(result.current.mentionQuery).toBe('');
  });

  it('opens mention menu when "@" is typed', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('Hello @');
    });

    expect(result.current.mentionOpen).toBe(true);
    expect(result.current.mentionQuery).toBe('');
  });

  it('filters users by name', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('Hello @ali');
    });

    expect(result.current.mentionOpen).toBe(true);
    expect(result.current.filteredUsers.length).toBe(1);
    expect(result.current.filteredUsers[0].name).toBe('Alice');
  });

  it('filters users by username', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('@cha');
    });

    expect(result.current.filteredUsers.length).toBe(1);
    expect(result.current.filteredUsers[0].name).toBe('Charlie');
  });

  it('returns empty when no match', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('@zzz');
    });

    expect(result.current.mentionOpen).toBe(true);
    expect(result.current.filteredUsers.length).toBe(0);
  });

  it('does not trigger when "@" is mid-word (no word boundary)', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('email@test');
    });

    expect(result.current.mentionOpen).toBe(false);
  });

  it('insertMention replaces the query with the mention', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('Hey @ali');
    });

    let newText: string;
    act(() => {
      newText = result.current.insertMention(mockUsers[0], 'Hey @ali');
    });

    expect(newText!).toBe('Hey @Alice ');
    expect(result.current.mentionOpen).toBe(false);
  });

  it('closeMention closes the dropdown', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('@');
    });
    expect(result.current.mentionOpen).toBe(true);

    act(() => {
      result.current.closeMention();
    });
    expect(result.current.mentionOpen).toBe(false);
  });

  it('closes when query contains a space', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers }),
    );

    act(() => {
      result.current.handleTextChange('@alice ');
    });

    // Space in query should close the dropdown
    expect(result.current.mentionOpen).toBe(false);
  });

  it('respects maxSuggestions', () => {
    const { result } = renderHook(() =>
      useMention({ users: mockUsers, maxSuggestions: 2 }),
    );

    act(() => {
      result.current.handleTextChange('@');
    });

    expect(result.current.filteredUsers.length).toBe(2);
  });
});
