//! # Recovery Phrase Demo
//!
//! Demonstrates BIP39 mnemonic generation and validation.
//!
//! ## Run
//!
//! ```bash
//! cargo run --example recovery_phrase_demo
//! ```

use umbra_core::identity::RecoveryPhrase;

fn main() {
    println!("=== Umbra Core: Recovery Phrase (BIP39) Demo ===\n");

    // Step 1: Explain BIP39
    println!("Step 1: Understanding BIP39 Mnemonics");
    println!();
    println!("  ┌─────────────────────────────────────────────────────────────┐");
    println!("  │                    BIP39 OVERVIEW                           │");
    println!("  ├─────────────────────────────────────────────────────────────┤");
    println!("  │                                                             │");
    println!("  │  256 bits entropy ──► SHA256 checksum ──► 264 bits total   │");
    println!("  │                                                             │");
    println!("  │  264 bits / 11 bits per word = 24 words                    │");
    println!("  │                                                             │");
    println!("  │  Each 11-bit segment maps to one of 2048 English words     │");
    println!("  │                                                             │");
    println!("  │  Security: 2^256 possible combinations                     │");
    println!("  │                                                             │");
    println!("  │  Checksum: Last word includes verification bits            │");
    println!("  │            (catches typos during recovery)                 │");
    println!("  │                                                             │");
    println!("  └─────────────────────────────────────────────────────────────┘");
    println!();

    // Step 2: Generate a recovery phrase
    println!("Step 2: Generating new recovery phrase...");

    let phrase = RecoveryPhrase::generate().expect("Failed to generate phrase");
    let words = phrase.words();

    println!();
    println!("  ┌────────────────────────────────────────────────────────────┐");
    println!("  │                   YOUR RECOVERY PHRASE                     │");
    println!("  ├────────────────────────────────────────────────────────────┤");

    for (i, chunk) in words.chunks(6).enumerate() {
        print!("  │  ");
        for (j, word) in chunk.iter().enumerate() {
            let num = i * 6 + j + 1;
            print!("{:2}. {:12}", num, word);
        }
        println!("│");
    }

    println!("  └────────────────────────────────────────────────────────────┘");
    println!();

    // Step 3: Validate phrase
    println!("Step 3: Validating the phrase...");

    let phrase_string = phrase.phrase();
    match RecoveryPhrase::validate(&phrase_string) {
        Ok(()) => println!("  [OK] Phrase is valid (checksum verified)"),
        Err(e) => println!("  [FAILED] Phrase invalid: {}", e),
    }
    println!();

    // Step 4: Test invalid phrases
    println!("Step 4: Demonstrating validation failures...");
    println!();

    // Wrong word count
    let short_phrase = "abandon abandon abandon";
    match RecoveryPhrase::validate(short_phrase) {
        Ok(()) => println!("  Short phrase: [FAILED] Should have been rejected!"),
        Err(_) => println!("  Short phrase (3 words): [OK] Correctly rejected"),
    }

    // Invalid word
    let invalid_word_phrase = "notaword abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
    match RecoveryPhrase::validate(invalid_word_phrase) {
        Ok(()) => println!("  Invalid word: [FAILED] Should have been rejected!"),
        Err(_) => println!("  Invalid word: [OK] Correctly rejected"),
    }

    // Wrong checksum (valid words but invalid combination)
    let bad_checksum = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
    match RecoveryPhrase::validate(bad_checksum) {
        Ok(()) => println!("  Bad checksum: [FAILED] Should have been rejected!"),
        Err(_) => println!("  Bad checksum: [OK] Correctly rejected"),
    }
    println!();

    // Step 5: Word validation and suggestions
    println!("Step 5: Word validation and autocomplete...");
    println!();

    let test_words = ["abandon", "ability", "hello", "crypto", "zebra"];

    println!("  Word validity check:");
    for word in test_words {
        let is_valid = RecoveryPhrase::is_valid_word(word);
        let status = if is_valid { "[VALID]  " } else { "[INVALID]" };
        println!("    {} \"{}\"", status, word);
    }
    println!();

    println!("  Autocomplete suggestions:");
    let prefixes = ["ab", "cr", "ze", "xyz"];

    for prefix in prefixes {
        let suggestions = RecoveryPhrase::suggest_words(prefix);
        if suggestions.is_empty() {
            println!("    \"{}\": (no matches)", prefix);
        } else {
            let display: Vec<_> = suggestions.iter().take(5).collect();
            println!("    \"{}\": {:?}", prefix, display);
        }
    }
    println!();

    // Step 6: Seed derivation
    println!("Step 6: Deriving seed from phrase...");

    let seed = phrase.to_seed().expect("Failed to derive seed");
    println!("  Seed (hex): {}", hex::encode(seed));
    println!("  Seed length: {} bytes (256 bits)", seed.len());
    println!();

    // With passphrase
    println!("  With passphrase \"secret\":");
    let seed_with_pass = phrase.to_seed_with_passphrase("secret")
        .expect("Failed to derive seed with passphrase");
    println!("  Seed (hex): {}", hex::encode(seed_with_pass));

    if seed != seed_with_pass {
        println!("  [OK] Different passphrase produces different seed");
    } else {
        println!("  [FAILED] Seeds should be different!");
    }
    println!();

    // Step 7: Determinism check
    println!("Step 7: Verifying deterministic derivation...");

    let seed_again = phrase.to_seed().expect("Failed to derive seed");
    if seed == seed_again {
        println!("  [OK] Same phrase produces same seed (deterministic)");
    } else {
        println!("  [FAILED] Seeds should be identical!");
    }
    println!();

    println!("=== Example Complete ===");
}
