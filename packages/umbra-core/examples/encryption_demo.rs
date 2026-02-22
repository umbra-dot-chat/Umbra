//! # Encryption Demo
//!
//! Demonstrates end-to-end encryption between two parties.
//!
//! ## Run
//!
//! ```bash
//! cargo run --example encryption_demo
//! ```

use umbra_core::crypto::{decrypt, encrypt, KeyPair, SharedSecret};

fn main() {
    println!("=== Umbra Core: End-to-End Encryption Demo ===\n");

    // Step 1: Create two parties (Alice and Bob)
    println!("Step 1: Creating keypairs for Alice and Bob...");

    let alice_seed: [u8; 32] = [1u8; 32]; // In production, use secure random
    let bob_seed: [u8; 32] = [2u8; 32];

    let alice = KeyPair::from_seed(&alice_seed).expect("Failed to create Alice's keypair");
    let bob = KeyPair::from_seed(&bob_seed).expect("Failed to create Bob's keypair");

    println!(
        "  Alice's public encryption key: {}...",
        hex::encode(&alice.encryption.public_bytes()[..8])
    );
    println!(
        "  Bob's public encryption key: {}...",
        hex::encode(&bob.encryption.public_bytes()[..8])
    );
    println!();

    // Step 2: Derive shared secret using ECDH (X25519)
    println!("Step 2: Deriving shared secret (X25519 ECDH)...");
    println!();
    println!("  ┌─────────────────────────────────────────────────────────────┐");
    println!("  │                    KEY EXCHANGE FLOW                        │");
    println!("  ├─────────────────────────────────────────────────────────────┤");
    println!("  │                                                             │");
    println!("  │   Alice                              Bob                    │");
    println!("  │     │                                  │                    │");
    println!("  │     │──── Alice's Public Key ─────────►│                    │");
    println!("  │     │                                  │                    │");
    println!("  │     │◄──── Bob's Public Key ───────────│                    │");
    println!("  │     │                                  │                    │");
    println!("  │     ▼                                  ▼                    │");
    println!("  │  ┌──────────┐                    ┌──────────┐              │");
    println!("  │  │ Alice's  │                    │  Bob's   │              │");
    println!("  │  │ Private  │                    │ Private  │              │");
    println!("  │  │   Key    │                    │   Key    │              │");
    println!("  │  └────┬─────┘                    └────┬─────┘              │");
    println!("  │       │                               │                    │");
    println!("  │       └───────────┐     ┌─────────────┘                    │");
    println!("  │                   ▼     ▼                                  │");
    println!("  │              ┌─────────────────┐                           │");
    println!("  │              │  SAME SHARED    │                           │");
    println!("  │              │     SECRET      │                           │");
    println!("  │              └─────────────────┘                           │");
    println!("  │                                                             │");
    println!("  └─────────────────────────────────────────────────────────────┘");
    println!();

    // Alice computes shared secret with Bob's public key
    let alice_dh_output = alice
        .encryption
        .diffie_hellman(&bob.encryption.public_bytes());
    let alice_shared = SharedSecret::from_bytes(alice_dh_output);

    // Bob computes shared secret with Alice's public key
    let bob_dh_output = bob
        .encryption
        .diffie_hellman(&alice.encryption.public_bytes());
    let bob_shared = SharedSecret::from_bytes(bob_dh_output);

    println!(
        "  Alice's computed DH output: {}...",
        hex::encode(&alice_dh_output[..8])
    );
    println!(
        "  Bob's computed DH output:   {}...",
        hex::encode(&bob_dh_output[..8])
    );

    if alice_dh_output == bob_dh_output {
        println!("  [OK] DH outputs match!");
    } else {
        println!("  [FAILED] DH outputs don't match!");
        return;
    }
    println!();

    // Step 3: Encrypt a message from Alice to Bob
    println!("Step 3: Alice encrypts a message...");

    let message = b"Hello Bob! This is a secret message from Alice.";
    let conversation_id = b"alice-bob-conversation-001";

    println!("  Plaintext: \"{}\"", String::from_utf8_lossy(message));
    println!(
        "  Conversation ID: {:?}",
        String::from_utf8_lossy(conversation_id)
    );

    // Derive encryption key from shared secret using conversation ID
    let alice_encryption_key = alice_shared
        .derive_key(conversation_id)
        .expect("Failed to derive encryption key");

    let (nonce, ciphertext) =
        encrypt(&alice_encryption_key, message, conversation_id).expect("Encryption failed");

    println!();
    println!("  Ciphertext (hex): {}", hex::encode(&ciphertext));
    println!("  Nonce (hex): {}", hex::encode(nonce.as_bytes()));
    println!(
        "  Ciphertext length: {} bytes (plaintext: {} bytes)",
        ciphertext.len(),
        message.len()
    );
    println!();

    // Step 4: Bob decrypts the message
    println!("Step 4: Bob decrypts the message...");

    // Bob derives the same encryption key
    let bob_encryption_key = bob_shared
        .derive_key(conversation_id)
        .expect("Failed to derive encryption key");

    let decrypted = decrypt(&bob_encryption_key, &nonce, &ciphertext, conversation_id)
        .expect("Decryption failed");

    println!("  Decrypted: \"{}\"", String::from_utf8_lossy(&decrypted));

    if decrypted == message {
        println!("  [OK] Message decrypted successfully!");
    } else {
        println!("  [FAILED] Decryption produced wrong result!");
    }
    println!();

    // Step 5: Demonstrate tamper detection
    println!("Step 5: Tamper detection (AEAD integrity)...");

    let mut tampered_ciphertext = ciphertext.clone();
    if !tampered_ciphertext.is_empty() {
        tampered_ciphertext[0] ^= 0xFF; // Flip bits in first byte
    }

    match decrypt(
        &bob_encryption_key,
        &nonce,
        &tampered_ciphertext,
        conversation_id,
    ) {
        Ok(_) => println!("  [FAILED] Tampered message was accepted!"),
        Err(_) => println!("  [OK] Tampered message detected and rejected!"),
    }

    // Also try wrong conversation ID (AAD)
    let wrong_conversation = b"wrong-conversation";
    match decrypt(&bob_encryption_key, &nonce, &ciphertext, wrong_conversation) {
        Ok(_) => println!("  [FAILED] Wrong conversation ID was accepted!"),
        Err(_) => println!("  [OK] Wrong conversation ID detected and rejected!"),
    }
    println!();

    println!("=== Example Complete ===");
}
