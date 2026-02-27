/**
 * Rotating taglines shown on the auth screen and loading screen.
 * Extracted to a shared module so LoadingScreen doesn't need to import
 * the auth index (which pulls in heavy auth flow modules).
 */

export const TAGLINES = [
  // Original taglines
  'Private by math, not by promise.',
  'Messaging that forgets you exist.',
  'The chat app that can\u2019t read your chats.',
  'Zero-trust messaging for everyone.',
  // Privacy & Encryption
  'Encrypted before it leaves your fingertips.',
  'Even we can\u2019t read your messages.',
  '256-bit encryption. Zero compromises.',
  'Your secrets, mathematically protected.',
  'End-to-end encryption, no exceptions.',
  'Where "private" actually means private.',
  'Servers see ciphertext. You see conversations.',
  'Privacy you don\u2019t have to trust\u2014you can verify.',
  // Identity & Ownership
  'No phone number. No email. No problem.',
  '24 words. One identity. Total control.',
  'Your keys live on your device. Always.',
  'Self-sovereign identity for everyone.',
  'Own your identity with a recovery phrase.',
  'No accounts to hack. No passwords to leak.',
  'Your identity, powered by cryptography.',
  'Portable identity across every device.',
  // Architecture & P2P
  'Messages flow peer-to-peer, not through servers.',
  'Direct connections. No middleman.',
  'Decentralized by design, not by buzzword.',
  'Your data stays on your devices.',
  'No honeypot servers to breach.',
  'P2P messaging with relay fallback.',
  'The network gets stronger with every user.',
  // Anti-Surveillance
  'Mass surveillance? Architecturally impossible.',
  'No metadata to mine. No graphs to build.',
  'We can\u2019t comply with data requests\u2014we don\u2019t have the data.',
  'Built for journalists, activists, and you.',
  'Where SIM swap attacks can\u2019t follow.',
  'No third-party SMS. No Twilio breaches.',
  // File Sharing
  'Share files of any size. No limits. No uploads.',
  'P2P file transfers, encrypted per-file.',
  'Your files never touch our servers.',
  // Features
  'Communities without corporate control.',
  'Voice calls that stay between you.',
  'Plugins built by community, not committees.',
  'Discord features. Signal privacy.',
  'Cross-platform: iOS, Android, Web, Desktop.',
  // Philosophy
  'Open source. Auditable. Trustless.',
  'When the company dies, your data lives on.',
  'No terms of service can delete your community.',
];
