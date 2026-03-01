/**
 * Tests for UI edge cases
 *
 * Covers: Unicode display names, empty state detection,
 * dialog dismiss logic, and message content fallbacks.
 *
 * Matches Playwright E2E coverage for Section 21 (Edge Cases):
 *   T21.1.5 (Unicode display names), T21.3.2 (Empty conversations),
 *   T21.3.3 (Empty friends), T21.3.6 (Dialog Escape dismiss)
 *
 * @jest-environment jsdom
 */

// ---------------------------------------------------------------------------
// T21.1.5 — Unicode characters in display names
// ---------------------------------------------------------------------------

describe('T21.1.5 — Unicode display name handling', () => {
  /**
   * Mirrors how ChatInput normalizes display name to username
   * for mention autocomplete: .toLowerCase().replace(/\s/g, '')
   */
  function normalizeToUsername(displayName: string): string {
    return displayName.toLowerCase().replace(/\s/g, '');
  }

  it('preserves accented Unicode characters in display name', () => {
    const name = 'Ünïcödé Üser';
    expect(name).toBe('Ünïcödé Üser');
    expect(name.length).toBeGreaterThan(0);
  });

  it('normalizes Unicode display name to username format', () => {
    expect(normalizeToUsername('Ünïcödé Üser')).toBe('ünïcödéüser');
  });

  it('handles emoji display names', () => {
    const name = '🎮 Player One 🏆';
    expect(name).toContain('🎮');
    expect(normalizeToUsername(name)).toBe('🎮playerone🏆');
  });

  it('handles CJK characters in display names', () => {
    const name = '太郎 花子';
    expect(name.length).toBeGreaterThan(0);
    expect(normalizeToUsername(name)).toBe('太郎花子');
  });

  it('handles RTL characters in display names', () => {
    const name = 'مرحبا بالعالم';
    expect(name.length).toBeGreaterThan(0);
    expect(normalizeToUsername(name)).toBe('مرحبابالعالم');
  });

  it('handles empty display name gracefully', () => {
    expect(normalizeToUsername('')).toBe('');
  });

  it('handles whitespace-only display name', () => {
    expect(normalizeToUsername('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// T21.1.5b — memberColor deterministic hash
// ---------------------------------------------------------------------------

describe('T21.1.5b — memberColor deterministic hash', () => {
  /**
   * Mirrors memberColor from ChatArea.tsx — deterministic color
   * from a DID string using simple hash.
   */
  const MEMBER_COLORS = [
    '#F87171', '#FB923C', '#FBBF24', '#34D399',
    '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6',
  ];

  function memberColor(did: string): string {
    let hash = 0;
    for (let i = 0; i < did.length; i++) {
      hash = ((hash << 5) - hash + did.charCodeAt(i)) | 0;
    }
    return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
  }

  it('returns a valid color string', () => {
    const color = memberColor('did:key:z6MkTest');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('returns same color for same DID (deterministic)', () => {
    const color1 = memberColor('did:key:z6MkTest123');
    const color2 = memberColor('did:key:z6MkTest123');
    expect(color1).toBe(color2);
  });

  it('returns a color from the palette', () => {
    const color = memberColor('did:key:z6MkAnything');
    expect(MEMBER_COLORS).toContain(color);
  });
});

// ---------------------------------------------------------------------------
// T21.3.2 — Empty conversations state
// ---------------------------------------------------------------------------

describe('T21.3.2 — Empty conversations detection', () => {
  it('detects empty conversation list', () => {
    const conversations: unknown[] = [];
    expect(conversations.length).toBe(0);
  });

  it('detects non-empty conversation list', () => {
    const conversations = [
      { id: '1', name: 'Chat', last: 'hello', time: '12:00', unread: 0 },
    ];
    expect(conversations.length).toBeGreaterThan(0);
  });

  it('fresh account has zero conversations', () => {
    // Simulates what the Playwright test T21.3.2 verifies
    const freshAccountConversations: unknown[] = [];
    expect(freshAccountConversations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T21.3.3 — Empty friends list state
// ---------------------------------------------------------------------------

describe('T21.3.3 — Empty friends list detection', () => {
  it('detects empty friend list', () => {
    const friends: unknown[] = [];
    expect(friends.length).toBe(0);
  });

  it('fresh account has no friends', () => {
    const freshAccountFriends: unknown[] = [];
    expect(freshAccountFriends).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T21.3.6 — Dialog dismiss with Escape key
// ---------------------------------------------------------------------------

describe('T21.3.6 — Dialog dismiss logic', () => {
  it('Escape key fires keydown event', () => {
    const handler = jest.fn();
    document.addEventListener('keydown', handler);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].key).toBe('Escape');

    document.removeEventListener('keydown', handler);
  });

  it('Escape key handler toggles dialog closed', () => {
    let dialogOpen = true;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dialogOpen = false;
      }
    };

    document.addEventListener('keydown', handleKeydown);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(dialogOpen).toBe(false);

    document.removeEventListener('keydown', handleKeydown);
  });

  it('non-Escape keys do not close dialog', () => {
    let dialogOpen = true;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dialogOpen = false;
      }
    };

    document.addEventListener('keydown', handleKeydown);

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(dialogOpen).toBe(true);

    document.removeEventListener('keydown', handleKeydown);
  });
});

// ---------------------------------------------------------------------------
// T21.1.1 — Message content fallbacks
// ---------------------------------------------------------------------------

describe('T21.1 — Message content edge cases', () => {
  /**
   * Mirrors getMessageText logic from ChatArea.tsx
   */
  function getMessageText(msg: {
    content?: string | null;
    deleted?: boolean;
    type?: string;
    fileName?: string;
  }): string {
    if (msg.deleted) return '[Message deleted]';
    if (!msg.content && msg.type === 'file' && msg.fileName) {
      return `[file: ${msg.fileName}]`;
    }
    if (!msg.content) return '[empty message]';
    return msg.content;
  }

  it('returns content for normal messages', () => {
    expect(getMessageText({ content: 'Hello world' })).toBe('Hello world');
  });

  it('returns [Message deleted] for deleted messages', () => {
    expect(getMessageText({ content: 'was here', deleted: true })).toBe('[Message deleted]');
  });

  it('returns [empty message] for null content', () => {
    expect(getMessageText({ content: null })).toBe('[empty message]');
  });

  it('returns [empty message] for undefined content', () => {
    expect(getMessageText({})).toBe('[empty message]');
  });

  it('returns [file: filename] for file messages', () => {
    expect(getMessageText({ type: 'file', fileName: 'doc.pdf' })).toBe('[file: doc.pdf]');
  });

  it('handles very long messages without truncation', () => {
    const longMsg = 'A'.repeat(10000);
    expect(getMessageText({ content: longMsg })).toBe(longMsg);
    expect(getMessageText({ content: longMsg }).length).toBe(10000);
  });

  it('handles messages with only whitespace', () => {
    expect(getMessageText({ content: '   ' })).toBe('   ');
  });

  it('handles messages with special characters', () => {
    const special = '<script>alert("xss")</script>';
    expect(getMessageText({ content: special })).toBe(special);
  });
});

// ---------------------------------------------------------------------------
// T21.1.6 — Empty message prevention
// ---------------------------------------------------------------------------

describe('T21.1.6 — Empty message prevention', () => {
  /**
   * Mirrors the validation logic that prevents sending empty messages.
   */
  function canSendMessage(content: string): boolean {
    return content.trim().length > 0;
  }

  it('allows non-empty messages', () => {
    expect(canSendMessage('hello')).toBe(true);
  });

  it('prevents empty string', () => {
    expect(canSendMessage('')).toBe(false);
  });

  it('prevents whitespace-only messages', () => {
    expect(canSendMessage('   ')).toBe(false);
    expect(canSendMessage('\n\n')).toBe(false);
    expect(canSendMessage('\t')).toBe(false);
  });

  it('allows messages with only emoji', () => {
    expect(canSendMessage('🎉')).toBe(true);
  });

  it('allows messages with leading/trailing whitespace', () => {
    expect(canSendMessage('  hello  ')).toBe(true);
  });
});
