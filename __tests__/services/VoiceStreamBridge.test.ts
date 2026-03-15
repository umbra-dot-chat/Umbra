/**
 * Tests for VoiceStreamBridge
 *
 * Covers stream management, participant tracking, events, signals, and clear.
 *
 * @jest-environment jsdom
 */

import { VoiceStreamBridge } from '@/services/VoiceStreamBridge';

/** Minimal mock MediaStream */
function mockStream(id = 'stream-1'): MediaStream {
  return { id, getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] } as unknown as MediaStream;
}

beforeEach(() => {
  VoiceStreamBridge.clear();
});

// =============================================================================
// Stream management
// =============================================================================

describe('Stream management', () => {
  it('setLocalStream / getLocalStream round-trip', () => {
    const stream = mockStream('local');
    VoiceStreamBridge.setLocalStream(stream);
    expect(VoiceStreamBridge.getLocalStream()).toBe(stream);
  });

  it('setPeerStream / getPeerStream round-trip', () => {
    const stream = mockStream('peer-1');
    VoiceStreamBridge.setPeerStream('did:key:abc', stream);
    expect(VoiceStreamBridge.getPeerStream('did:key:abc')).toBe(stream);
  });

  it('removePeerStream removes the stream', () => {
    VoiceStreamBridge.setPeerStream('did:key:abc', mockStream());
    VoiceStreamBridge.removePeerStream('did:key:abc');
    expect(VoiceStreamBridge.getPeerStream('did:key:abc')).toBeNull();
  });

  it('getAllPeerStreams returns a copy', () => {
    VoiceStreamBridge.setPeerStream('a', mockStream('s1'));
    VoiceStreamBridge.setPeerStream('b', mockStream('s2'));

    const all = VoiceStreamBridge.getAllPeerStreams();
    expect(all.size).toBe(2);

    // Modifying the returned map should not affect internal state
    all.delete('a');
    expect(VoiceStreamBridge.getPeerStream('a')).not.toBeNull();
  });

  it('screenShareStream set / get', () => {
    const stream = mockStream('screen');
    VoiceStreamBridge.setScreenShareStream(stream);
    expect(VoiceStreamBridge.getScreenShareStream()).toBe(stream);

    VoiceStreamBridge.setScreenShareStream(null);
    expect(VoiceStreamBridge.getScreenShareStream()).toBeNull();
  });
});

// =============================================================================
// Participant tracking
// =============================================================================

describe('Participant tracking', () => {
  it('addParticipant adds to the list', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    const participants = VoiceStreamBridge.getParticipants();
    expect(participants).toHaveLength(1);
    expect(participants[0].displayName).toBe('Alice');
  });

  it('removeParticipant removes from the list', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    VoiceStreamBridge.removeParticipant('did:key:1');
    expect(VoiceStreamBridge.getParticipants()).toHaveLength(0);
  });

  it('duplicate add is ignored', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice v2' });
    expect(VoiceStreamBridge.getParticipants()).toHaveLength(1);
    // Original name is kept
    expect(VoiceStreamBridge.getParticipants()[0].displayName).toBe('Alice');
  });

  it('getParticipants returns a copy, not a reference', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    const copy = VoiceStreamBridge.getParticipants();
    copy.push({ did: 'did:key:2', displayName: 'Bob' });
    expect(VoiceStreamBridge.getParticipants()).toHaveLength(1);
  });

  it('setParticipants replaces all', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    VoiceStreamBridge.setParticipants([
      { did: 'did:key:2', displayName: 'Bob' },
      { did: 'did:key:3', displayName: 'Charlie' },
    ]);
    const participants = VoiceStreamBridge.getParticipants();
    expect(participants).toHaveLength(2);
    expect(participants[0].displayName).toBe('Bob');
  });
});

// =============================================================================
// Events: participant changes
// =============================================================================

describe('Participant change events', () => {
  it('fires callback on addParticipant', () => {
    const cb = jest.fn();
    VoiceStreamBridge.onParticipantChange(cb);
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    expect(cb).toHaveBeenCalledWith({ type: 'joined', did: 'did:key:1', displayName: 'Alice' });
  });

  it('fires callback on removeParticipant', () => {
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    const cb = jest.fn();
    VoiceStreamBridge.onParticipantChange(cb);
    VoiceStreamBridge.removeParticipant('did:key:1');
    expect(cb).toHaveBeenCalledWith({ type: 'left', did: 'did:key:1', displayName: 'Alice' });
  });

  it('unsubscribe prevents further calls', () => {
    const cb = jest.fn();
    const unsub = VoiceStreamBridge.onParticipantChange(cb);
    unsub();
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('callback errors do not crash', () => {
    VoiceStreamBridge.onParticipantChange(() => { throw new Error('boom'); });
    expect(() => {
      VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    }).not.toThrow();
  });
});

// =============================================================================
// Signal forwarding
// =============================================================================

describe('Signal forwarding', () => {
  it('onSignal subscription receives emitted signals', () => {
    const cb = jest.fn();
    VoiceStreamBridge.onSignal(cb);
    VoiceStreamBridge.emitSignal({ type: 'offer', sdp: '...' });
    expect(cb).toHaveBeenCalledWith({ type: 'offer', sdp: '...' });
  });

  it('sendSignal delivers to signal sender', () => {
    const sender = jest.fn();
    VoiceStreamBridge.setSignalSender(sender);
    VoiceStreamBridge.sendSignal({ type: 'answer' });
    expect(sender).toHaveBeenCalledWith({ type: 'answer' });
  });

  it('onSignal unsubscribe prevents further calls', () => {
    const cb = jest.fn();
    const unsub = VoiceStreamBridge.onSignal(cb);
    unsub();
    VoiceStreamBridge.emitSignal({ type: 'ice' });
    expect(cb).not.toHaveBeenCalled();
  });
});

// =============================================================================
// clear
// =============================================================================

describe('clear', () => {
  it('resets all state', () => {
    VoiceStreamBridge.setLocalStream(mockStream());
    VoiceStreamBridge.setPeerStream('a', mockStream());
    VoiceStreamBridge.setScreenShareStream(mockStream());
    VoiceStreamBridge.addParticipant({ did: 'did:key:1', displayName: 'Alice' });
    VoiceStreamBridge.setActive(true);
    VoiceStreamBridge.setSignalSender(jest.fn());

    VoiceStreamBridge.clear();

    expect(VoiceStreamBridge.getLocalStream()).toBeNull();
    expect(VoiceStreamBridge.getAllPeerStreams().size).toBe(0);
    expect(VoiceStreamBridge.getScreenShareStream()).toBeNull();
    expect(VoiceStreamBridge.getParticipants()).toHaveLength(0);
    expect(VoiceStreamBridge.isActive()).toBe(false);

    // Signal sender should be cleared — sendSignal should not throw
    expect(() => VoiceStreamBridge.sendSignal({ test: true })).not.toThrow();
  });
});
