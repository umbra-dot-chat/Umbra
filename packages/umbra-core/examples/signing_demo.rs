//! # Digital Signature Demo
//!
//! Demonstrates Ed25519 digital signatures for message authentication.
//!
//! ## Run
//!
//! ```bash
//! cargo run --example signing_demo
//! ```

use umbra_core::crypto::{sign, verify, KeyPair};

fn main() {
    println!("=== Umbra Core: Digital Signature Demo ===\n");

    // Step 1: Create a keypair
    println!("Step 1: Creating Ed25519 signing keypair...");

    let seed: [u8; 32] = [42u8; 32]; // In production, use secure random
    let keypair = KeyPair::from_seed(&seed).expect("Failed to create keypair");

    println!(
        "  Public key (hex): {}",
        hex::encode(keypair.signing.public_bytes())
    );
    println!();

    // Step 2: Explain the signing process
    println!("Step 2: Understanding Ed25519 Signatures");
    println!();
    println!("  ┌─────────────────────────────────────────────────────────────┐");
    println!("  │                   SIGNATURE FLOW                            │");
    println!("  ├─────────────────────────────────────────────────────────────┤");
    println!("  │                                                             │");
    println!("  │  SIGNING (Private Key Holder Only):                        │");
    println!("  │                                                             │");
    println!("  │    Message ──────┐                                         │");
    println!("  │                  ▼                                         │");
    println!("  │    Private ─► Ed25519 ─► Signature (64 bytes)              │");
    println!("  │    Key         Sign                                        │");
    println!("  │                                                             │");
    println!("  │  VERIFICATION (Anyone with Public Key):                    │");
    println!("  │                                                             │");
    println!("  │    Message ──────┐                                         │");
    println!("  │                  ▼                                         │");
    println!("  │    Public ──► Ed25519 ─► Valid / Invalid                   │");
    println!("  │    Key        Verify                                       │");
    println!("  │    Signature ────┘                                         │");
    println!("  │                                                             │");
    println!("  │  PROPERTIES:                                               │");
    println!("  │  • Only private key holder can create valid signatures     │");
    println!("  │  • Anyone with public key can verify                       │");
    println!("  │  • Signature proves both authenticity and integrity        │");
    println!("  │  • Non-repudiation: signer cannot deny signing             │");
    println!("  │                                                             │");
    println!("  └─────────────────────────────────────────────────────────────┘");
    println!();

    // Step 3: Sign a message
    println!("Step 3: Signing a message...");

    let message = b"This message was sent by me and has not been tampered with.";
    println!("  Message: \"{}\"", String::from_utf8_lossy(message));

    let signature = sign(&keypair.signing, message);

    println!("  Signature (hex): {}", hex::encode(signature.as_bytes()));
    println!("  Signature length: {} bytes", signature.as_bytes().len());
    println!();

    // Step 4: Verify the signature
    println!("Step 4: Verifying the signature...");

    match verify(&keypair.signing.public_bytes(), message, &signature) {
        Ok(()) => println!("  [OK] Signature is valid!"),
        Err(_) => println!("  [FAILED] Signature verification failed!"),
    }
    println!();

    // Step 5: Demonstrate forgery detection
    println!("Step 5: Forgery detection...");

    // Try to verify with tampered message
    let tampered_message = b"This message was MODIFIED by an attacker!";
    match verify(
        &keypair.signing.public_bytes(),
        tampered_message,
        &signature,
    ) {
        Ok(()) => println!("  [FAILED] Tampered message was accepted!"),
        Err(_) => println!("  [OK] Tampered message detected - signature invalid!"),
    }

    // Try to verify with wrong public key
    let wrong_seed: [u8; 32] = [99u8; 32];
    let wrong_keypair = KeyPair::from_seed(&wrong_seed).expect("Failed to create wrong keypair");
    match verify(&wrong_keypair.signing.public_bytes(), message, &signature) {
        Ok(()) => println!("  [FAILED] Wrong public key was accepted!"),
        Err(_) => println!("  [OK] Wrong public key detected - signature invalid!"),
    }
    println!();

    // Step 6: Sign multiple messages
    println!("Step 6: Signing multiple messages...");

    let messages = [
        "Friend request accepted",
        "New message received",
        "Profile updated",
    ];

    for (i, msg) in messages.iter().enumerate() {
        let sig = sign(&keypair.signing, msg.as_bytes());
        let valid = verify(&keypair.signing.public_bytes(), msg.as_bytes(), &sig).is_ok();
        println!("  Message {}: \"{}\"", i + 1, msg);
        println!("    Signature: {}...", hex::encode(&sig.as_bytes()[..16]));
        println!("    Valid: {}", if valid { "[OK]" } else { "[FAILED]" });
    }
    println!();

    println!("=== Example Complete ===");
}
