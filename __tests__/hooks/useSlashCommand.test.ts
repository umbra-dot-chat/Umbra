/**
 * Tests for useSlashCommand hook
 *
 * Covers: slash trigger detection, filtering, command selection,
 * sendAsMessage vs local execution, suggestions, close behavior.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSlashCommand, SlashCommandDef } from '@/hooks/useSlashCommand';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCommands: SlashCommandDef[] = [
  {
    id: 'system:clear',
    command: 'clear',
    label: 'Clear Chat',
    description: 'Clear the chat history',
    icon: '🧹',
    category: 'System',
    onExecute: jest.fn(),
  },
  {
    id: 'system:help',
    command: 'help',
    label: 'Help',
    description: 'Show available commands',
    icon: '❓',
    category: 'System',
    sendAsMessage: false,
    onExecute: jest.fn(),
  },
  {
    id: 'ghost:ask',
    command: 'ghost ask',
    label: 'Ask Ghost',
    description: 'Ask the AI assistant',
    icon: '👻',
    category: 'Ghost',
    sendAsMessage: true,
    onExecute: jest.fn(),
  },
  {
    id: 'ghost:play',
    command: 'ghost play',
    label: 'Play Music',
    description: 'Play a track',
    icon: '🎵',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<track-id>',
    getSuggestions: jest.fn((partial: string) => {
      const tracks = [
        { label: 'lofi-beats', description: 'Lo-fi Hip Hop' },
        { label: 'jazz-cafe', description: 'Jazz Cafe Vibes' },
        { label: 'lo-key', description: 'Low Key Chill' },
      ];
      if (!partial) return tracks;
      return tracks.filter((t) => t.label.includes(partial));
    }),
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSlashCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with menu closed', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    expect(result.current.slashOpen).toBe(false);
    expect(result.current.slashQuery).toBe('');
    expect(result.current.filteredCommands).toEqual([]);
  });

  it('opens menu when "/" is typed at the start', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/');
    });

    expect(result.current.slashOpen).toBe(true);
    expect(result.current.slashQuery).toBe('');
    // With empty query, returns all commands up to maxSuggestions
    expect(result.current.filteredCommands.length).toBe(mockCommands.length);
  });

  it('does not open menu when "/" is not at start', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('hello /clear');
    });

    expect(result.current.slashOpen).toBe(false);
  });

  it('filters commands by command name prefix', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/cle');
    });

    expect(result.current.slashOpen).toBe(true);
    expect(result.current.filteredCommands.length).toBe(1);
    expect(result.current.filteredCommands[0].id).toBe('system:clear');
  });

  it('filters commands by description text', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/available');
    });

    expect(result.current.filteredCommands.length).toBe(1);
    expect(result.current.filteredCommands[0].id).toBe('system:help');
  });

  it('filters by category', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/ghost');
    });

    expect(result.current.filteredCommands.length).toBe(2);
    expect(result.current.filteredCommands.every((c) => c.category === 'Ghost')).toBe(true);
  });

  it('respects maxSuggestions', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands, maxSuggestions: 2 }),
    );

    act(() => {
      result.current.handleTextChange('/');
    });

    expect(result.current.filteredCommands.length).toBe(2);
  });

  it('selectCommand with sendAsMessage returns shouldSend=true', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    const ghostAsk = mockCommands[2]; // sendAsMessage: true
    let selectResult: { newText: string; shouldSend: boolean };

    act(() => {
      result.current.handleTextChange('/ghost ask');
      selectResult = result.current.selectCommand(ghostAsk, '/ghost ask');
    });

    expect(selectResult!.shouldSend).toBe(true);
    expect(selectResult!.newText).toBe('/ghost ask');
    expect(result.current.slashOpen).toBe(false);
  });

  it('selectCommand without sendAsMessage executes locally and clears text', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    const clearCmd = mockCommands[0];
    let selectResult: { newText: string; shouldSend: boolean };

    act(() => {
      result.current.handleTextChange('/clear');
      selectResult = result.current.selectCommand(clearCmd, '/clear');
    });

    expect(selectResult!.shouldSend).toBe(false);
    expect(selectResult!.newText).toBe('');
    expect(clearCmd.onExecute).toHaveBeenCalled();
  });

  it('closeSlash closes the menu', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/');
    });
    expect(result.current.slashOpen).toBe(true);

    act(() => {
      result.current.closeSlash();
    });
    expect(result.current.slashOpen).toBe(false);
    expect(result.current.slashQuery).toBe('');
  });

  it('resets activeIndex when query changes', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/');
      result.current.setActiveIndex(2);
    });
    expect(result.current.activeIndex).toBe(2);

    act(() => {
      result.current.handleTextChange('/c');
    });
    // activeIndex should reset to 0 on new query
    expect(result.current.activeIndex).toBe(0);
  });

  it('getSuggestions returns argument suggestions for a fully typed command', () => {
    const { result } = renderHook(() =>
      useSlashCommand({ commands: mockCommands }),
    );

    act(() => {
      result.current.handleTextChange('/ghost play lo');
    });

    // Should show suggestions matching "lo"
    expect(result.current.filteredCommands.length).toBeGreaterThan(0);
    expect(result.current.filteredCommands.some((c) => c.label === 'lofi-beats')).toBe(true);
    expect(result.current.filteredCommands.some((c) => c.label === 'lo-key')).toBe(true);
  });
});
