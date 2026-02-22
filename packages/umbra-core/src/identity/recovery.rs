//! # Recovery Phrase (BIP39)
//!
//! Implementation of BIP39 mnemonic phrases for identity backup and recovery.
//!
//! ## BIP39 Overview
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      BIP39 MNEMONIC GENERATION                          │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Step 1: Generate Entropy                                              │
//! │  ────────────────────────────                                           │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  256 bits of cryptographically secure random data          │       │
//! │  │                                                             │       │
//! │  │  Source: Operating system CSPRNG (getrandom/CryptGenRandom)│       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 2: Calculate Checksum                                            │
//! │  ───────────────────────────                                            │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  checksum = first 8 bits of SHA256(entropy)                │       │
//! │  │                                                             │       │
//! │  │  For 256-bit entropy: checksum_bits = 256 / 32 = 8 bits    │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 3: Combine and Split                                             │
//! │  ──────────────────────────                                             │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  combined = entropy || checksum = 256 + 8 = 264 bits       │       │
//! │  │                                                             │       │
//! │  │  Split into 24 segments of 11 bits each                    │       │
//! │  │  264 / 11 = 24 words                                       │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 4: Map to Words                                                  │
//! │  ────────────────────                                                   │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  Each 11-bit value (0-2047) maps to BIP39 wordlist         │       │
//! │  │                                                             │       │
//! │  │  Word 1:  bits 0-10   → "abandon" (index 0)               │       │
//! │  │  Word 2:  bits 11-21  → "ability" (index 1)               │       │
//! │  │  ...                                                       │       │
//! │  │  Word 24: bits 253-263 → "zoo" (index 2047)               │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Result: 24 English words that encode 256 bits of entropy             │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Seed Derivation
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      BIP39 SEED DERIVATION                              │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  PBKDF2-HMAC-SHA512(                                       │       │
//! │  │                                                             │       │
//! │  │    password = mnemonic_sentence,                           │       │
//! │  │               (words joined by spaces, NFKD normalized)    │       │
//! │  │                                                             │       │
//! │  │    salt = "mnemonic" + passphrase,                        │       │
//! │  │           (passphrase is optional, empty by default)       │       │
//! │  │                                                             │       │
//! │  │    iterations = 2048,                                      │       │
//! │  │                                                             │       │
//! │  │    key_length = 64 bytes                                   │       │
//! │  │  )                                                         │       │
//! │  │                                                             │       │
//! │  │  → 512-bit seed                                            │       │
//! │  │                                                             │       │
//! │  │  We use the first 256 bits (32 bytes) as our master seed  │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Considerations
//!
//! | Aspect | Measure |
//! |--------|---------|
//! | Entropy | 256 bits from OS CSPRNG |
//! | Checksum | 8 bits prevents typos |
//! | KDF | PBKDF2 with 2048 iterations |
//! | Storage | Phrase should be written down, never stored digitally |
//! | Display | Show once, never log |

use bip39::{Language, Mnemonic};
use rand::RngCore;
use zeroize::ZeroizeOnDrop;

use crate::error::{Error, Result};

/// Number of words in a recovery phrase
pub const WORD_COUNT: usize = 24;

/// Entropy size in bytes for 24 words (256 bits)
const ENTROPY_BYTES: usize = 32;

/// A BIP39 recovery phrase for identity backup
///
/// ## Security Warning
///
/// - This phrase can fully recover the user's identity
/// - Should be shown to the user exactly once
/// - Should never be logged or stored in plaintext
/// - User should write it down on paper
#[derive(ZeroizeOnDrop)]
pub struct RecoveryPhrase {
    /// The underlying BIP39 mnemonic
    #[zeroize(skip)] // bip39::Mnemonic doesn't implement Zeroize
    mnemonic: Mnemonic,
}

impl RecoveryPhrase {
    /// Generate a new random recovery phrase
    ///
    /// Uses 256 bits of entropy for maximum security (24 words).
    pub fn generate() -> Result<Self> {
        // Generate 256 bits of entropy
        let mut entropy = [0u8; ENTROPY_BYTES];
        rand::rngs::OsRng.fill_bytes(&mut entropy);

        let mnemonic = Mnemonic::from_entropy(&entropy).map_err(|e| {
            Error::KeyDerivationFailed(format!("Failed to generate mnemonic: {}", e))
        })?;

        Ok(Self { mnemonic })
    }

    /// Parse a recovery phrase from words
    ///
    /// ## Validation
    ///
    /// - Must be exactly 24 words
    /// - All words must be in BIP39 English wordlist
    /// - Checksum must be valid
    pub fn from_phrase(phrase: &str) -> Result<Self> {
        let mnemonic = Mnemonic::parse_normalized(phrase)
            .map_err(|e| Error::InvalidRecoveryPhrase(format!("{}", e)))?;

        if mnemonic.word_count() != WORD_COUNT {
            return Err(Error::InvalidRecoveryPhrase(format!(
                "Expected {} words, got {}",
                WORD_COUNT,
                mnemonic.word_count()
            )));
        }

        Ok(Self { mnemonic })
    }

    /// Parse from a list of words
    pub fn from_words(words: &[&str]) -> Result<Self> {
        if words.len() != WORD_COUNT {
            return Err(Error::InvalidRecoveryPhrase(format!(
                "Expected {} words, got {}",
                WORD_COUNT,
                words.len()
            )));
        }

        let phrase = words.join(" ");
        Self::from_phrase(&phrase)
    }

    /// Get the words as a vector
    pub fn words(&self) -> Vec<&'static str> {
        self.mnemonic.words().collect()
    }

    /// Get the phrase as a single string (words separated by spaces)
    ///
    /// ## Security Warning
    ///
    /// Only use this for display to user. Never log or store.
    pub fn phrase(&self) -> String {
        self.mnemonic.to_string()
    }

    /// Derive the master seed from this recovery phrase
    ///
    /// Uses empty passphrase (standard BIP39 behavior).
    pub fn to_seed(&self) -> Result<[u8; 32]> {
        self.to_seed_with_passphrase("")
    }

    /// Derive the master seed with an optional passphrase
    ///
    /// The passphrase provides an additional layer of security:
    /// - Same mnemonic + different passphrase = different keys
    /// - Allows plausible deniability (different passphrases reveal different wallets)
    pub fn to_seed_with_passphrase(&self, passphrase: &str) -> Result<[u8; 32]> {
        // BIP39 seed derivation produces 64 bytes
        let seed_bytes = self.mnemonic.to_seed(passphrase);

        // We use the first 32 bytes as our master seed
        let mut master_seed = [0u8; 32];
        master_seed.copy_from_slice(&seed_bytes[..32]);

        Ok(master_seed)
    }

    /// Validate a phrase without creating a RecoveryPhrase
    ///
    /// Useful for UI validation before submission.
    pub fn validate(phrase: &str) -> Result<()> {
        Self::from_phrase(phrase)?;
        Ok(())
    }

    /// Check if a single word is in the BIP39 wordlist
    pub fn is_valid_word(word: &str) -> bool {
        let word_lower = word.to_lowercase();
        Language::English
            .word_list()
            .iter()
            .any(|w| *w == word_lower)
    }

    /// Get word suggestions for autocomplete
    ///
    /// Returns words from the BIP39 wordlist that start with the given prefix.
    pub fn suggest_words(prefix: &str) -> Vec<&'static str> {
        if prefix.is_empty() {
            return vec![];
        }

        let prefix_lower = prefix.to_lowercase();
        let mut suggestions = Vec::new();

        for word in Language::English.word_list().iter() {
            if word.starts_with(&prefix_lower) {
                suggestions.push(*word);
                if suggestions.len() >= 10 {
                    break;
                }
            }
        }

        suggestions
    }
}

// Prevent accidental logging
impl std::fmt::Debug for RecoveryPhrase {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "RecoveryPhrase([REDACTED])")
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_recovery_phrase() {
        let phrase = RecoveryPhrase::generate().unwrap();
        assert_eq!(phrase.words().len(), 24);
    }

    #[test]
    fn test_parse_valid_phrase() {
        // This is a valid BIP39 phrase (DO NOT USE FOR REAL!)
        let test_phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

        let phrase = RecoveryPhrase::from_phrase(test_phrase).unwrap();
        assert_eq!(phrase.words().len(), 24);
    }

    #[test]
    fn test_parse_invalid_word() {
        let invalid_phrase = "invalid word here abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

        let result = RecoveryPhrase::from_phrase(invalid_phrase);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_wrong_word_count() {
        let short_phrase = "abandon abandon abandon";
        let result = RecoveryPhrase::from_phrase(short_phrase);
        assert!(result.is_err());
    }

    #[test]
    fn test_seed_derivation_deterministic() {
        let phrase = RecoveryPhrase::generate().unwrap();

        let seed1 = phrase.to_seed().unwrap();
        let seed2 = phrase.to_seed().unwrap();

        assert_eq!(seed1, seed2);
    }

    #[test]
    fn test_different_phrases_different_seeds() {
        let phrase1 = RecoveryPhrase::generate().unwrap();
        let phrase2 = RecoveryPhrase::generate().unwrap();

        let seed1 = phrase1.to_seed().unwrap();
        let seed2 = phrase2.to_seed().unwrap();

        assert_ne!(seed1, seed2);
    }

    #[test]
    fn test_passphrase_changes_seed() {
        let phrase = RecoveryPhrase::generate().unwrap();

        let seed_no_pass = phrase.to_seed_with_passphrase("").unwrap();
        let seed_with_pass = phrase.to_seed_with_passphrase("secret").unwrap();

        assert_ne!(seed_no_pass, seed_with_pass);
    }

    #[test]
    fn test_is_valid_word() {
        assert!(RecoveryPhrase::is_valid_word("abandon"));
        assert!(RecoveryPhrase::is_valid_word("zoo"));
        assert!(!RecoveryPhrase::is_valid_word("notaword"));
    }

    #[test]
    fn test_suggest_words() {
        let suggestions = RecoveryPhrase::suggest_words("ab");
        assert!(suggestions.contains(&"abandon"));
        assert!(suggestions.contains(&"ability"));
        assert!(suggestions.contains(&"able"));
    }

    #[test]
    fn test_debug_redacts() {
        let phrase = RecoveryPhrase::generate().unwrap();
        let debug = format!("{:?}", phrase);
        assert!(debug.contains("REDACTED"));
        assert!(!debug.contains("abandon")); // Should not contain any actual words
    }
}
