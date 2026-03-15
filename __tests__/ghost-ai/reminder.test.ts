/**
 * Ghost AI reminder.ts — unit tests for parseReminder.
 */

import { parseReminder } from '../../packages/umbra-ghost-ai/src/handlers/reminder';

const USER_DID = 'did:key:zTestUser';
const CONV_ID = 'conv-abc-123';

describe('parseReminder', () => {
  it('parses "remind me in 5 minutes to check the server"', () => {
    const result = parseReminder(
      'remind me in 5 minutes to check the server',
      USER_DID,
      CONV_ID,
      'en',
    );
    expect(result).not.toBeNull();
    expect(result!.message).toBe('check the server');
    expect(result!.userDid).toBe(USER_DID);
    expect(result!.conversationId).toBe(CONV_ID);
    expect(result!.fired).toBe(0);
    // fireAt should be ~5 minutes from now
    const expectedMs = 5 * 60 * 1000;
    const drift = Math.abs(result!.fireAt - (Date.now() + expectedMs));
    expect(drift).toBeLessThan(1000); // within 1 second tolerance
  });

  it('parses "remind me in 2 hours to take a break"', () => {
    const result = parseReminder(
      'remind me in 2 hours to take a break',
      USER_DID,
      CONV_ID,
      'en',
    );
    expect(result).not.toBeNull();
    expect(result!.message).toBe('take a break');
    const expectedMs = 2 * 3600 * 1000;
    const drift = Math.abs(result!.fireAt - (Date.now() + expectedMs));
    expect(drift).toBeLessThan(1000);
  });

  it('parses abbreviated units: "remind me in 30 min to eat"', () => {
    const result = parseReminder(
      'remind me in 30 min to eat',
      USER_DID,
      CONV_ID,
      'en',
    );
    expect(result).not.toBeNull();
    expect(result!.message).toBe('eat');
  });

  it('parses "set reminder for 1 day: deploy the fix"', () => {
    const result = parseReminder(
      'set reminder for 1 day: deploy the fix',
      USER_DID,
      CONV_ID,
      'en',
    );
    expect(result).not.toBeNull();
    expect(result!.message).toBe('deploy the fix');
  });

  it('returns null for non-reminder messages', () => {
    expect(parseReminder('hello there', USER_DID, CONV_ID, 'en')).toBeNull();
    expect(parseReminder('what time is it?', USER_DID, CONV_ID, 'en')).toBeNull();
  });

  it('returns a valid uuid as id', () => {
    const result = parseReminder(
      'remind me in 10 seconds to breathe',
      USER_DID,
      CONV_ID,
      'en',
    );
    expect(result).not.toBeNull();
    expect(result!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
