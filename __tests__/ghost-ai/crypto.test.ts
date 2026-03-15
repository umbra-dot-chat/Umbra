/**
 * Ghost AI crypto.ts — unit tests for identity, encryption, signing, and UUID.
 */

import {
  createIdentity,
  encryptMessage,
  decryptMessage,
  computeConversationId,
  sign,
  uuid,
  type GhostIdentity,
} from '../../packages/umbra-ghost-ai/src/crypto';

// ---------------------------------------------------------------------------
// createIdentity
// ---------------------------------------------------------------------------

describe('createIdentity', () => {
  it('returns an object with all expected fields', () => {
    const id = createIdentity('Ghost');
    expect(id).toHaveProperty('did');
    expect(id).toHaveProperty('displayName', 'Ghost');
    expect(id).toHaveProperty('signingPrivateKey');
    expect(id).toHaveProperty('signingPublicKey');
    expect(id).toHaveProperty('encryptionPrivateKey');
    expect(id).toHaveProperty('encryptionPublicKey');
  });

  it('DID starts with "did:key:z"', () => {
    const id = createIdentity('TestBot');
    expect(id.did).toMatch(/^did:key:z/);
  });

  it('keys are hex strings of correct length', () => {
    const id = createIdentity('TestBot');
    // Ed25519 public key = 32 bytes = 64 hex chars
    expect(id.signingPublicKey).toMatch(/^[0-9a-f]{64}$/);
    // Ed25519 private key = 32 bytes = 64 hex chars
    expect(id.signingPrivateKey).toMatch(/^[0-9a-f]{64}$/);
    // X25519 keys = 32 bytes = 64 hex chars
    expect(id.encryptionPublicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(id.encryptionPrivateKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique identities on each call', () => {
    const a = createIdentity('A');
    const b = createIdentity('B');
    expect(a.did).not.toBe(b.did);
    expect(a.signingPrivateKey).not.toBe(b.signingPrivateKey);
    expect(a.encryptionPrivateKey).not.toBe(b.encryptionPrivateKey);
  });
});

// ---------------------------------------------------------------------------
// encryptMessage / decryptMessage round-trip
// ---------------------------------------------------------------------------

describe('encryptMessage / decryptMessage', () => {
  let alice: GhostIdentity;
  let bob: GhostIdentity;
  let conversationId: string;

  beforeAll(() => {
    alice = createIdentity('Alice');
    bob = createIdentity('Bob');
    conversationId = computeConversationId(alice.did, bob.did);
  });

  it('round-trip: encrypt then decrypt recovers original plaintext', () => {
    const plaintext = 'Hello from the shadows!';
    const timestamp = Date.now();

    const { ciphertext, nonce } = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    const decrypted = decryptMessage(
      ciphertext,
      nonce,
      bob.encryptionPrivateKey,
      alice.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    expect(decrypted).toBe(plaintext);
  });

  it('wrong recipient key fails to decrypt', () => {
    const eve = createIdentity('Eve');
    const plaintext = 'Secret message';
    const timestamp = Date.now();

    const { ciphertext, nonce } = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    expect(() =>
      decryptMessage(
        ciphertext,
        nonce,
        eve.encryptionPrivateKey,
        alice.encryptionPublicKey,
        alice.did,
        bob.did,
        timestamp,
        conversationId,
      ),
    ).toThrow();
  });

  it('different conversations produce different ciphertext', () => {
    const plaintext = 'Same message';
    const timestamp = Date.now();

    const enc1 = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    const enc2 = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      'different-conversation-id',
    );

    // Nonces are random, so ciphertext will always differ, but let's also
    // check that even with different conversation IDs the ciphertext differs
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('tampered ciphertext fails to decrypt', () => {
    const plaintext = 'Integrity check';
    const timestamp = Date.now();

    const { ciphertext, nonce } = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    // Flip a byte in the ciphertext
    const buf = Buffer.from(ciphertext, 'base64');
    buf[0] ^= 0xff;
    const tampered = buf.toString('base64');

    expect(() =>
      decryptMessage(
        tampered,
        nonce,
        bob.encryptionPrivateKey,
        alice.encryptionPublicKey,
        alice.did,
        bob.did,
        timestamp,
        conversationId,
      ),
    ).toThrow();
  });

  it('wrong timestamp in AAD fails to decrypt', () => {
    const plaintext = 'AAD check';
    const timestamp = Date.now();

    const { ciphertext, nonce } = encryptMessage(
      plaintext,
      alice.encryptionPrivateKey,
      bob.encryptionPublicKey,
      alice.did,
      bob.did,
      timestamp,
      conversationId,
    );

    expect(() =>
      decryptMessage(
        ciphertext,
        nonce,
        bob.encryptionPrivateKey,
        alice.encryptionPublicKey,
        alice.did,
        bob.did,
        timestamp + 1, // wrong timestamp
        conversationId,
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// computeConversationId
// ---------------------------------------------------------------------------

describe('computeConversationId', () => {
  it('is deterministic — same inputs produce same output', () => {
    const a = 'did:key:zAlice';
    const b = 'did:key:zBob';
    expect(computeConversationId(a, b)).toBe(computeConversationId(a, b));
  });

  it('is order-independent — (A,B) == (B,A)', () => {
    const a = 'did:key:zAlice';
    const b = 'did:key:zBob';
    expect(computeConversationId(a, b)).toBe(computeConversationId(b, a));
  });

  it('different DIDs produce different conversation IDs', () => {
    const a = 'did:key:zAlice';
    const b = 'did:key:zBob';
    const c = 'did:key:zCharlie';
    expect(computeConversationId(a, b)).not.toBe(computeConversationId(a, c));
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const result = computeConversationId('did:key:zX', 'did:key:zY');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// sign
// ---------------------------------------------------------------------------

describe('sign', () => {
  it('produces a valid hex signature', () => {
    const id = createIdentity('Signer');
    const data = new TextEncoder().encode('hello');
    const sig = sign(data, id.signingPrivateKey);
    // Ed25519 signature is 64 bytes = 128 hex chars
    expect(sig).toMatch(/^[0-9a-f]{128}$/);
  });

  it('different data produces different signatures', () => {
    const id = createIdentity('Signer');
    const sig1 = sign(new TextEncoder().encode('hello'), id.signingPrivateKey);
    const sig2 = sign(new TextEncoder().encode('world'), id.signingPrivateKey);
    expect(sig1).not.toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// uuid
// ---------------------------------------------------------------------------

describe('uuid', () => {
  it('matches 8-4-4-4-12 format', () => {
    const id = uuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('is version 4 (13th hex char is "4")', () => {
    const id = uuid();
    // Version nibble is at position 14 (index 14 in the full string with dashes)
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id[14]).toBe('4');
  });

  it('has correct variant bits (y is 8, 9, a, or b)', () => {
    const id = uuid();
    // Variant nibble is at position 19
    expect(id[19]).toMatch(/[89ab]/);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
  });
});
