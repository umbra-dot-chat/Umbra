/**
 * Tests for SlashCommandRegistry
 *
 * Covers getSystemCommands, GHOST_COMMANDS, isGhostBot, registerGhostDid.
 *
 * @jest-environment jsdom
 */

import {
  getSystemCommands,
  GHOST_COMMANDS,
  isGhostBot,
  registerGhostDid,
} from '@/services/SlashCommandRegistry';

// =============================================================================
// getSystemCommands
// =============================================================================

describe('getSystemCommands', () => {
  it('returns help and clear commands', () => {
    const commands = getSystemCommands({});
    const ids = commands.map((c) => c.id);
    expect(ids).toContain('system:help');
    expect(ids).toContain('system:clear');
  });

  it('returns exactly 2 system commands', () => {
    expect(getSystemCommands({})).toHaveLength(2);
  });

  it('attaches onHelp callback to help command', () => {
    const onHelp = jest.fn();
    const commands = getSystemCommands({ onHelp });
    const helpCmd = commands.find((c) => c.id === 'system:help');
    helpCmd?.onExecute?.();
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('attaches onClear callback to clear command', () => {
    const onClear = jest.fn();
    const commands = getSystemCommands({ onClear });
    const clearCmd = commands.find((c) => c.id === 'system:clear');
    clearCmd?.onExecute?.();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('all system commands have category "System"', () => {
    const commands = getSystemCommands({});
    expect(commands.every((c) => c.category === 'System')).toBe(true);
  });
});

// =============================================================================
// GHOST_COMMANDS
// =============================================================================

describe('GHOST_COMMANDS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(GHOST_COMMANDS)).toBe(true);
    expect(GHOST_COMMANDS.length).toBeGreaterThan(0);
  });

  it('all ghost commands have category "Ghost"', () => {
    expect(GHOST_COMMANDS.every((c) => c.category === 'Ghost')).toBe(true);
  });

  it('all ghost commands have sendAsMessage set to true', () => {
    expect(GHOST_COMMANDS.every((c) => c.sendAsMessage === true)).toBe(true);
  });

  it('each ghost command has a unique id', () => {
    const ids = GHOST_COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// =============================================================================
// isGhostBot
// =============================================================================

describe('isGhostBot', () => {
  it('returns true for a known Ghost DID', () => {
    expect(
      isGhostBot('did:key:z6MkhSo7UBSqfsnF6dM2iw5qbPbKoKBHQ6XnAGGMo7XV5Fyd')
    ).toBe(true);
  });

  it('returns false for an unknown DID', () => {
    expect(isGhostBot('did:key:unknown')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGhostBot(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isGhostBot(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isGhostBot('')).toBe(false);
  });
});

// =============================================================================
// registerGhostDid
// =============================================================================

describe('registerGhostDid', () => {
  it('registers a new DID that is then recognized by isGhostBot', () => {
    const newDid = 'did:key:z6Mktest123';
    expect(isGhostBot(newDid)).toBe(false);
    registerGhostDid(newDid);
    expect(isGhostBot(newDid)).toBe(true);
  });
});
