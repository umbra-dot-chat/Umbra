/**
 * Error codes and error class for Umbra Core
 *
 * @packageDocumentation
 */

/**
 * Error codes from Umbra Core
 *
 * Error codes are organized by category:
 * - 100-199: Core lifecycle
 * - 200-299: Identity
 * - 300-399: Crypto
 * - 400-499: Storage
 * - 500-599: Network
 * - 600-699: Friends
 * - 700-799: Messages
 * - 900-999: Internal
 */
export enum ErrorCode {
  // Core (100-199)
  NotInitialized = 100,
  AlreadyInitialized = 101,
  ShutdownInProgress = 102,

  // Identity (200-299)
  NoIdentity = 200,
  IdentityExists = 201,
  InvalidRecoveryPhrase = 202,
  KeyDerivationFailed = 203,
  InvalidDid = 204,
  ProfileUpdateFailed = 205,

  // Crypto (300-399)
  EncryptionFailed = 300,
  DecryptionFailed = 301,
  SigningFailed = 302,
  VerificationFailed = 303,
  InvalidKey = 304,
  KeyExchangeFailed = 305,
  RngFailed = 306,

  // Storage (400-499)
  StorageNotInitialized = 400,
  StorageReadError = 401,
  StorageWriteError = 402,
  StorageNotFound = 403,
  StorageCorrupted = 404,
  DatabaseError = 405,

  // Network (500-599)
  NotConnected = 500,
  ConnectionFailed = 501,
  Timeout = 502,
  PeerNotFound = 503,
  ProtocolError = 504,
  TransportError = 505,
  DhtError = 506,

  // Friends (600-699)
  AlreadyFriends = 600,
  NotFriends = 601,
  RequestPending = 602,
  RequestNotFound = 603,
  UserBlocked = 604,
  InvalidFriendRequest = 605,
  CannotAddSelf = 606,

  // Messages (700-799)
  ConversationNotFound = 700,
  MessageNotFound = 701,
  RecipientOffline = 702,
  DeliveryFailed = 703,
  InvalidMessageContent = 704,

  // Internal (900-999)
  Internal = 900,
  NotImplemented = 901,
  SerializationError = 902,
  DeserializationError = 903,
}

/**
 * Error from Umbra Core
 */
export class UmbraError extends Error {
  /** Numeric error code */
  readonly code: ErrorCode;
  /** Whether the error is recoverable (can retry) */
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, recoverable: boolean = false) {
    super(message);
    this.name = 'UmbraError';
    this.code = code;
    this.recoverable = recoverable;
  }
}
