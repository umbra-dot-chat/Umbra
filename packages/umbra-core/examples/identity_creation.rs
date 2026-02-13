//! # Identity Creation Example
//!
//! Demonstrates how to create a new identity with a recovery phrase.
//!
//! ## Run
//!
//! ```bash
//! cargo run --example identity_creation
//! ```

use umbra_core::identity::Identity;

fn main() {
    println!("=== Umbra Core: Identity Creation Example ===\n");

    // Step 1: Create a new identity
    println!("Step 1: Creating new identity...");
    let (identity, recovery_phrase) = Identity::create("Alice".to_string())
        .expect("Failed to create identity");

    println!("  Identity created successfully!");
    println!("  Display Name: {}", identity.profile().display_name);
    println!("  DID: {}", identity.did());
    println!();

    // Step 2: Display recovery phrase (ONLY SHOW ONCE IN PRODUCTION!)
    println!("Step 2: Recovery Phrase (24 words)");
    println!("  ┌────────────────────────────────────────────────────────┐");
    println!("  │ SECURITY WARNING: Write these words down on paper!    │");
    println!("  │ Never store digitally. Never share with anyone.       │");
    println!("  └────────────────────────────────────────────────────────┘");
    println!();

    let words = recovery_phrase.words();
    for (i, chunk) in words.chunks(6).enumerate() {
        print!("  ");
        for (j, word) in chunk.iter().enumerate() {
            let num = i * 6 + j + 1;
            print!("{:2}. {:12} ", num, word);
        }
        println!();
    }
    println!();

    // Step 3: Demonstrate recovery
    println!("Step 3: Recovering identity from phrase...");
    let recovered_identity = Identity::from_recovery_phrase(&recovery_phrase, "Alice (Recovered)".to_string())
        .expect("Failed to recover identity");

    println!("  Identity recovered successfully!");
    println!("  Original DID:  {}", identity.did());
    println!("  Recovered DID: {}", recovered_identity.did());
    println!();

    // Verify DIDs match
    if identity.did().to_string() == recovered_identity.did().to_string() {
        println!("  [OK] DIDs match - recovery successful!");
    } else {
        println!("  [FAILED] DIDs do not match!");
    }
    println!();

    // Step 4: Get public identity (safe to share)
    println!("Step 4: Public Identity (shareable)");
    let public_identity = identity.public_identity();
    println!("  DID: {}", public_identity.did);
    println!("  Display Name: {}", public_identity.display_name);
    println!("  Signing Key (hex): {}", hex::encode(&public_identity.public_keys.signing));
    println!("  Encryption Key (hex): {}", hex::encode(&public_identity.public_keys.encryption));
    println!();

    println!("=== Example Complete ===");
}
