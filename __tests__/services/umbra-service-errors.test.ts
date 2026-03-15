/**
 * umbra-service errors.ts — unit tests for UmbraError and ErrorCode.
 */

import { UmbraError, ErrorCode } from '../../packages/umbra-service/src/errors';

describe('ErrorCode enum', () => {
  it('has expected category ranges', () => {
    // Core
    expect(ErrorCode.NotInitialized).toBe(100);
    // Identity
    expect(ErrorCode.NoIdentity).toBe(200);
    // Crypto
    expect(ErrorCode.EncryptionFailed).toBe(300);
    // Storage
    expect(ErrorCode.StorageNotInitialized).toBe(400);
    // Network
    expect(ErrorCode.NotConnected).toBe(500);
    // Friends
    expect(ErrorCode.AlreadyFriends).toBe(600);
    // Messages
    expect(ErrorCode.ConversationNotFound).toBe(700);
    // Internal
    expect(ErrorCode.Internal).toBe(900);
  });
});

describe('UmbraError', () => {
  it('constructs with code, message, and default recoverable=false', () => {
    const err = new UmbraError(ErrorCode.NotInitialized, 'Not ready');
    expect(err.code).toBe(ErrorCode.NotInitialized);
    expect(err.message).toBe('Not ready');
    expect(err.recoverable).toBe(false);
  });

  it('accepts recoverable=true', () => {
    const err = new UmbraError(ErrorCode.Timeout, 'Timed out', true);
    expect(err.recoverable).toBe(true);
  });

  it('is instanceof Error', () => {
    const err = new UmbraError(ErrorCode.Internal, 'Oops');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name "UmbraError"', () => {
    const err = new UmbraError(ErrorCode.DecryptionFailed, 'Bad key');
    expect(err.name).toBe('UmbraError');
  });
});
