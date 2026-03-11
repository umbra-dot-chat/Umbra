// Type declarations for @noble/* packages used by the test bot.

declare module '@noble/curves/ed25519' {
  interface CurveUtils {
    randomPrivateKey(): Uint8Array;
  }

  export const ed25519: {
    utils: CurveUtils;
    getPublicKey(privateKey: Uint8Array): Uint8Array;
    sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
    verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
  };

  export const x25519: {
    utils: CurveUtils;
    getPublicKey(privateKey: Uint8Array): Uint8Array;
    getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
  };
}

declare module '@noble/hashes/sha256' {
  export function sha256(data: Uint8Array): Uint8Array;
}

declare module '@noble/hashes/hkdf' {
  export function hkdf(
    hash: (data: Uint8Array) => Uint8Array,
    inputKeyMaterial: Uint8Array,
    salt: Uint8Array,
    info: string,
    length: number,
  ): Uint8Array;
}

declare module '@noble/ciphers/aes' {
  interface Cipher {
    encrypt(plaintext: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array): Uint8Array;
  }

  export function gcm(key: Uint8Array, nonce: Uint8Array, aad?: Uint8Array): Cipher;
}

declare module '@noble/ciphers/webcrypto' {
  export function randomBytes(length: number): Uint8Array;
}

declare module '@noble/curves/abstract/utils' {
  export function bytesToHex(bytes: Uint8Array): string;
  export function hexToBytes(hex: string): Uint8Array;
}
