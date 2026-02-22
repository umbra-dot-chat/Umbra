//! # Messaging Module Demo
//!
//! This example demonstrates end-to-end encrypted messaging:
//! 1. Two users exchange encryption keys (via friend flow)
//! 2. Alice sends an encrypted message to Bob
//! 3. Bob decrypts and verifies the message
//! 4. Demonstrates tamper detection
//!
//! ## Run
//!
//! ```bash
//! cargo run --example messaging_demo
//! ```

use umbra_core::friends::Friend;
use umbra_core::identity::Identity;
use umbra_core::messaging::{
    Conversation, Message, MessageContent, MessageEnvelope, MessageType, MESSAGE_PROTOCOL_VERSION,
};

fn main() {
    println!("=================================================");
    println!("         UMBRA MESSAGING MODULE DEMO");
    println!("=================================================\n");

    // =========================================================================
    // STEP 1: Create identities for Alice and Bob
    // =========================================================================
    println!("1. Creating identities for Alice and Bob...\n");

    let (alice_identity, _alice_recovery) =
        Identity::create("Alice".to_string()).expect("Failed to create Alice's identity");

    let (bob_identity, _bob_recovery) =
        Identity::create("Bob".to_string()).expect("Failed to create Bob's identity");

    println!("   Alice's DID: {}", alice_identity.did_string());
    println!("   Bob's DID:   {}", bob_identity.did_string());
    println!();

    // =========================================================================
    // STEP 2: Simulate friend exchange (both have each other's public keys)
    // =========================================================================
    println!("2. Simulating friend key exchange...\n");

    // Alice has Bob's public identity (from friend request flow)
    let bob_as_friend = Friend::from_public_identity(&bob_identity.public_identity());

    // Bob has Alice's public identity
    let alice_as_friend = Friend::from_public_identity(&alice_identity.public_identity());

    println!("   Alice has Bob's:");
    println!(
        "   - Signing key: {}...",
        hex::encode(&bob_as_friend.signing_public_key[..8])
    );
    println!(
        "   - Encryption key: {}...",
        hex::encode(&bob_as_friend.encryption_public_key[..8])
    );
    println!();
    println!("   Bob has Alice's:");
    println!(
        "   - Signing key: {}...",
        hex::encode(&alice_as_friend.signing_public_key[..8])
    );
    println!(
        "   - Encryption key: {}...",
        hex::encode(&alice_as_friend.encryption_public_key[..8])
    );
    println!();

    // =========================================================================
    // STEP 3: Create a conversation
    // =========================================================================
    println!("3. Creating conversation between Alice and Bob...\n");

    let conversation_id =
        Conversation::generate_id(&alice_identity.did_string(), &bob_identity.did_string());

    println!("   Conversation ID: {}", conversation_id);
    println!("   (Deterministic: same ID regardless of who initiates)");

    // Verify determinism
    let reverse_id =
        Conversation::generate_id(&bob_identity.did_string(), &alice_identity.did_string());
    println!("   Reverse order ID: {}", reverse_id);
    println!("   IDs match: {}", conversation_id == reverse_id);
    println!();

    // =========================================================================
    // STEP 4: Alice creates a message
    // =========================================================================
    println!("4. Alice creates a message...\n");

    let message = Message::new(
        conversation_id.clone(),
        alice_identity.did_string(),
        bob_identity.did_string(),
        MessageContent::Text("Hello Bob! This is a secret message.".to_string()),
    );

    println!("   Message ID: {}", message.id);
    println!("   Content: {:?}", message.content);
    println!("   Timestamp: {}", message.timestamp);
    println!();

    // =========================================================================
    // STEP 5: Encrypt the message into an envelope
    // =========================================================================
    println!("5. Encrypting message into envelope...\n");

    let envelope = MessageEnvelope::encrypt(
        &message,
        &alice_identity,
        &bob_as_friend.encryption_public_key,
    )
    .expect("Failed to encrypt message");

    println!("   Envelope version: {}", envelope.version);
    println!("   Message type: {:?}", envelope.msg_type);
    println!("   Sender: {}", &envelope.sender_did[..40]);
    println!("   Recipient: {}", &envelope.recipient_did[..40]);
    println!("   Nonce (base64): {}...", &envelope.nonce[..16]);
    println!("   Ciphertext (base64): {}...", &envelope.ciphertext[..32]);
    println!("   Signature (hex): {}...", &envelope.signature[..32]);
    println!();
    println!("   The message content is now encrypted!");
    println!("   Only Bob can decrypt it with his private key.");
    println!();

    // =========================================================================
    // STEP 6: Serialize for transmission
    // =========================================================================
    println!("6. Serializing envelope for network transmission...\n");

    let envelope_json = envelope.to_json().expect("Failed to serialize");

    println!("   JSON size: {} bytes", envelope_json.len());
    println!("   (Would be sent over libp2p to Bob's peer)");
    println!();

    // =========================================================================
    // STEP 7: Bob receives and decrypts
    // =========================================================================
    println!("7. Bob receives and decrypts the message...\n");

    // Parse the received envelope
    let received = MessageEnvelope::from_json(&envelope_json).expect("Failed to parse envelope");

    // Decrypt using Bob's private key and Alice's public key
    let decrypted = received
        .decrypt(&bob_identity, &alice_as_friend)
        .expect("Failed to decrypt message");

    println!("   Decryption successful!");
    println!("   Message ID: {}", decrypted.id);
    println!("   From: {}", &decrypted.sender_did[..40]);
    match &decrypted.content {
        MessageContent::Text(text) => println!("   Content: \"{}\"", text),
        _ => println!("   Content: {:?}", decrypted.content),
    }
    println!();

    // =========================================================================
    // STEP 8: Demonstrate different message types
    // =========================================================================
    println!("8. Different message types...\n");

    let message_types = [
        (MessageType::ChatMessage, "Regular chat message"),
        (MessageType::TypingIndicator, "User is typing"),
        (MessageType::ReadReceipt, "Message was read"),
        (MessageType::DeliveryReceipt, "Message was delivered"),
    ];

    for (msg_type, description) in &message_types {
        println!("   {:?}: {}", msg_type, description);
    }
    println!();

    // =========================================================================
    // STEP 9: Demonstrate tamper detection
    // =========================================================================
    println!("9. Demonstrating tamper detection...\n");

    // Create a valid envelope
    let test_message = Message::new(
        conversation_id.clone(),
        alice_identity.did_string(),
        bob_identity.did_string(),
        MessageContent::Text("Original message".to_string()),
    );

    let mut tampered_envelope = MessageEnvelope::encrypt(
        &test_message,
        &alice_identity,
        &bob_as_friend.encryption_public_key,
    )
    .expect("Failed to encrypt");

    // Tamper with the ciphertext
    let original_ciphertext = tampered_envelope.ciphertext.clone();
    tampered_envelope.ciphertext = "dGFtcGVyZWQ=".to_string(); // "tampered" in base64

    match tampered_envelope.decrypt(&bob_identity, &alice_as_friend) {
        Ok(_) => println!("   [FAIL] Tampered message was decrypted!"),
        Err(_) => println!("   [OK] Tampered ciphertext was REJECTED!"),
    }

    // Restore ciphertext but tamper with sender
    tampered_envelope.ciphertext = original_ciphertext;
    tampered_envelope.sender_did = bob_identity.did_string(); // Wrong sender

    match tampered_envelope.decrypt(&bob_identity, &alice_as_friend) {
        Ok(_) => println!("   [FAIL] Message with wrong sender was accepted!"),
        Err(_) => println!("   [OK] Message with wrong sender was REJECTED!"),
    }
    println!();

    // =========================================================================
    // STEP 10: Wrong recipient detection
    // =========================================================================
    println!("10. Wrong recipient detection...\n");

    // Create a third user
    let (eve_identity, _) =
        Identity::create("Eve".to_string()).expect("Failed to create Eve's identity");

    // Eve tries to decrypt a message meant for Bob
    let eve_as_friend = Friend::from_public_identity(&alice_identity.public_identity());

    let message_for_bob = Message::new(
        conversation_id.clone(),
        alice_identity.did_string(),
        bob_identity.did_string(),
        MessageContent::Text("Secret for Bob only".to_string()),
    );

    let envelope_for_bob = MessageEnvelope::encrypt(
        &message_for_bob,
        &alice_identity,
        &bob_as_friend.encryption_public_key,
    )
    .expect("Failed to encrypt");

    match envelope_for_bob.decrypt(&eve_identity, &eve_as_friend) {
        Ok(_) => println!("   [FAIL] Eve decrypted Bob's message!"),
        Err(_) => println!("   [OK] Eve cannot decrypt Bob's message (different keys)!"),
    }
    println!();

    // =========================================================================
    // Summary
    // =========================================================================
    println!("=================================================");
    println!("                    SUMMARY");
    println!("=================================================\n");
    println!("  Message Encryption:");
    println!("  - Protocol version: {}", MESSAGE_PROTOCOL_VERSION);
    println!("  - Key exchange: X25519 ECDH");
    println!("  - Key derivation: HKDF-SHA256");
    println!("  - Encryption: AES-256-GCM with AAD");
    println!("  - Signatures: Ed25519");
    println!();
    println!("  Security Properties:");
    println!("  - Confidentiality: Only recipient can decrypt");
    println!("  - Authenticity: Signature proves sender identity");
    println!("  - Integrity: Any tampering is detected");
    println!("  - Binding: AAD binds sender/recipient/time to message");
    println!();
    println!("  Wire Format:");
    println!("  - JSON envelope for network transmission");
    println!("  - Base64-encoded binary fields (nonce, ciphertext)");
    println!("  - Hex-encoded signature for readability");
    println!();
}
