// Web Worker for RTCRtpScriptTransform media E2EE
// Encrypts outgoing and decrypts incoming WebRTC media frames using AES-256-GCM

let encryptionKey: CryptoKey | null = null;

// Handle messages from main thread
self.onmessage = (event: MessageEvent) => {
  if (event.data.type === 'setKey') {
    encryptionKey = event.data.key; // CryptoKey for AES-256-GCM
  }
};

// Constants
const IV_LENGTH = 12; // AES-GCM IV size in bytes
const TAG_LENGTH = 128; // AES-GCM auth tag bits

// Handle the rtctransform event (sent by RTCRtpScriptTransform)
// @ts-expect-error - rtctransform is not in standard TS types yet
self.onrtctransform = (event: any) => {
  const { readable, writable } = event.transformer;
  const direction = event.transformer.options?.direction || 'send';

  if (direction === 'send') {
    transformStream(readable, writable, encryptFrame);
  } else {
    transformStream(readable, writable, decryptFrame);
  }
};

async function transformStream(
  readable: ReadableStream,
  writable: WritableStream,
  transform: (frame: any) => Promise<any>,
) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      try {
        const transformed = await transform(value);
        await writer.write(transformed);
      } catch (err) {
        // On decryption failure, pass frame through unmodified (graceful degradation)
        await writer.write(value);
      }
    }
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}

async function encryptFrame(frame: any): Promise<any> {
  if (!encryptionKey) return frame; // No key yet, pass through

  const data = new Uint8Array(frame.data);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
    encryptionKey,
    data,
  );

  // New frame layout: [IV (12 bytes)] [encrypted data + auth tag]
  const result = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), IV_LENGTH);

  frame.data = result.buffer;
  return frame;
}

async function decryptFrame(frame: any): Promise<any> {
  if (!encryptionKey) return frame; // No key yet, pass through

  const data = new Uint8Array(frame.data);
  if (data.length <= IV_LENGTH) return frame; // Too short, not encrypted

  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
    encryptionKey,
    ciphertext,
  );

  frame.data = decrypted;
  return frame;
}
