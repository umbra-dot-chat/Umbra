/**
 * Test fixture data for E2E tests.
 * Used by both Detox (iOS) and Playwright (web).
 */

const ADJECTIVES = [
  'Swift', 'Brave', 'Calm', 'Eager', 'Fierce',
  'Happy', 'Jolly', 'Lucky', 'Noble', 'Quick',
  'Quiet', 'Sharp', 'Witty', 'Bold', 'Clever',
  'Gentle', 'Mighty', 'Proud', 'Steady', 'Wise',
] as const;

const ANIMALS = [
  'Fox', 'Wolf', 'Bear', 'Hawk', 'Lynx',
  'Otter', 'Raven', 'Owl', 'Panda', 'Tiger',
  'Falcon', 'Badger', 'Heron', 'Crane', 'Elk',
  'Cobra', 'Wren', 'Finch', 'Bison', 'Moose',
] as const;

/** Generate a unique display name like "SwiftFox42" */
export function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}

/** Generate a random 5-digit PIN */
export function generatePin(): string {
  return String(10000 + Math.floor(Math.random() * 90000));
}

// Pre-generated names for each test run (stable within a run, unique across runs)
const _userAName = generateDisplayName();
const _userBName = generateDisplayName();

export const FIXTURES = {
  /** User A — primary test account (unique name per test run) */
  USER_A: {
    displayName: _userAName,
    pin: '12345',
  },

  /** User B — second account for two-user flows */
  USER_B: {
    displayName: _userBName,
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
    /** DM conversation test messages */
    DM_HELLO: 'Hey from User A in DM!',
    DM_REPLY: 'Got your message User A!',
    DM_SECOND: 'Sending a second message',
    DM_EMOJI: 'DM emoji test hello world',
    DM_LONG: 'B'.repeat(300),
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
