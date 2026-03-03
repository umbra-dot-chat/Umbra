/**
 * Test fixture data for E2E tests.
 * Used by both Detox (iOS) and Playwright (web).
 */

export const FIXTURES = {
  /** User A — primary test account */
  USER_A: {
    displayName: 'Alice Test',
    pin: '12345',
  },

  /** User B — second account for two-user flows */
  USER_B: {
    displayName: 'Bob Test',
    pin: '67890',
  },

  /** Known seed phrase for import tests (24 words) */
  KNOWN_SEED_PHRASE:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',

  /** Invalid seed phrase for error tests */
  INVALID_SEED_PHRASE:
    'invalid words that are not a real recovery phrase at all',

  /** Short PIN for validation tests */
  SHORT_PIN: '123',

  /** Mismatched PIN for confirm-mismatch tests */
  MISMATCHED_PIN: '99999',

  /** Test messages */
  MESSAGES: {
    HELLO: 'Hello from E2E test!',
    REPLY: 'This is a reply message',
    LONG: 'A'.repeat(500),
    EMOJI: 'Test with emoji: smile face',
    SPECIAL_CHARS: 'Special chars: <>&"\' @#$%',
  },

  /** Test group names */
  GROUPS: {
    NAME: 'Test Group',
    DESCRIPTION: 'A test group for E2E testing',
    RENAMED: 'Renamed Test Group',
  },

  /** Relay config */
  RELAY: {
    URL: 'relay.umbra.chat',
  },
} as const;
