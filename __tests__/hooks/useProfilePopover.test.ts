import { renderHook, act } from '@testing-library/react-native';
import { useProfilePopover } from '@/hooks/useProfilePopover';

describe('useProfilePopover', () => {
  test('initial state is null', () => {
    const { result } = renderHook(() => useProfilePopover());
    expect(result.current.selectedMember).toBeNull();
    expect(result.current.popoverAnchor).toBeNull();
  });

  test('showProfile sets selectedMember with name and default offline status', () => {
    const { result } = renderHook(() => useProfilePopover());
    const mockEvent = { nativeEvent: { pageX: 100, pageY: 200 } };

    act(() => {
      result.current.showProfile('Alice', mockEvent);
    });

    expect(result.current.selectedMember).toEqual({
      id: 'Alice',
      name: 'Alice',
      status: 'offline',
    });
    expect(result.current.popoverAnchor).toEqual({ x: 100, y: 200 });
  });

  test('showProfile works for any name (no lookup required)', () => {
    const { result } = renderHook(() => useProfilePopover());
    const mockEvent = { nativeEvent: { pageX: 50, pageY: 75 } };

    act(() => {
      result.current.showProfile('Unknown Person', mockEvent);
    });

    expect(result.current.selectedMember).toEqual({
      id: 'Unknown Person',
      name: 'Unknown Person',
      status: 'offline',
    });
    expect(result.current.popoverAnchor).toEqual({ x: 50, y: 75 });
  });

  test('showProfile extracts coordinates from nativeEvent', () => {
    const { result } = renderHook(() => useProfilePopover());
    const mockEvent = { nativeEvent: { pageX: 300, pageY: 400 } };

    act(() => {
      result.current.showProfile('Bob', mockEvent);
    });

    expect(result.current.popoverAnchor).toEqual({ x: 300, y: 400 });
  });

  test('showProfile falls back to top-level pageX/pageY when nativeEvent is absent', () => {
    const { result } = renderHook(() => useProfilePopover());
    const mockEvent = { pageX: 150, pageY: 250 };

    act(() => {
      result.current.showProfile('Charlie', mockEvent);
    });

    expect(result.current.popoverAnchor).toEqual({ x: 150, y: 250 });
  });

  test('closeProfile resets both states', () => {
    const { result } = renderHook(() => useProfilePopover());
    const mockEvent = { nativeEvent: { pageX: 100, pageY: 200 } };

    act(() => {
      result.current.showProfile('Alice', mockEvent);
    });
    expect(result.current.selectedMember).not.toBeNull();

    act(() => {
      result.current.closeProfile();
    });
    expect(result.current.selectedMember).toBeNull();
    expect(result.current.popoverAnchor).toBeNull();
  });

  test('showProfile can be called multiple times to switch profiles', () => {
    const { result } = renderHook(() => useProfilePopover());

    act(() => {
      result.current.showProfile('Alice', { nativeEvent: { pageX: 10, pageY: 20 } });
    });
    expect(result.current.selectedMember?.name).toBe('Alice');

    act(() => {
      result.current.showProfile('Bob', { nativeEvent: { pageX: 30, pageY: 40 } });
    });
    expect(result.current.selectedMember?.name).toBe('Bob');
    expect(result.current.popoverAnchor).toEqual({ x: 30, y: 40 });
  });
});
